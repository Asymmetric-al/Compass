import { createDatabaseClient } from "./lib/v2-migration";

async function backfillBoardState() {
  const db = createDatabaseClient();
  try {
    await db.unsafe(`
      with owner_targets as (
        select
          w.org_id,
          b.id as board_id,
          w.id as work_item_id,
          c.id as column_id,
          row_number() over (
            partition by b.id, c.id
            order by w.updated_at asc, w.created_at asc
          ) as row_number
        from public.work_items w
        join public.boards b
          on b.org_id = w.org_id
          and b.type = 'user'
          and b.owner_user_id = w.owner_user_id
        join public.board_columns c
          on c.board_id = b.id
          and c.key = w.status_key
      ),
      team_targets as (
        select
          w.org_id,
          b.id as board_id,
          w.id as work_item_id,
          c.id as column_id,
          row_number() over (
            partition by b.id, c.id
            order by w.updated_at asc, w.created_at asc
          ) as row_number
        from public.work_items w
        join public.boards b
          on b.org_id = w.org_id
          and b.type = 'team'
          and b.team_id = w.team_id
        join public.board_columns c
          on c.board_id = b.id
          and c.key = w.status_key
        where w.team_id is not null
      ),
      combined as (
        select * from owner_targets
        union all
        select * from team_targets
      )
      insert into public.work_item_board_state (
        org_id,
        board_id,
        work_item_id,
        column_id,
        position,
        pinned
      )
      select
        org_id,
        board_id,
        work_item_id,
        column_id,
        (row_number * 1000)::numeric(30, 15),
        true
      from combined
      on conflict (board_id, work_item_id)
      do update set
        column_id = excluded.column_id,
        position = excluded.position,
        pinned = true,
        updated_at = now();
    `);

    console.log("✅ Work item board state backfilled.");
  } finally {
    await db.close();
  }
}

await backfillBoardState();
