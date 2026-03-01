import { createDatabaseClient } from "./lib/v2-migration";

async function bootstrapWorkboards() {
  const db = createDatabaseClient();

  try {
    const [defaultActor] = await db<{ user_id: string }[]>`
      select user_id
      from public.profiles
      where is_active = true
      order by created_at asc
      limit 1
    `;

    if (!defaultActor?.user_id) {
      console.log("⚠️ No active profiles found. Skipping board bootstrap.");
      return;
    }

    await db.unsafe(`
      insert into public.boards (org_id, type, owner_user_id, name, is_default, created_by)
      select
        p.org_id,
        'user',
        p.user_id,
        'My Board',
        true,
        p.user_id
      from public.profiles p
      where p.is_active = true
      on conflict (org_id, owner_user_id) where type = 'user'
      do update set updated_at = now();
    `);

    await db`
      insert into public.boards (org_id, type, team_id, name, is_default, created_by)
      select
        t.org_id,
        'team',
        t.id,
        t.name || ' Board',
        true,
        ${defaultActor.user_id}
      from public.teams t
      on conflict (org_id, team_id) where type = 'team'
      do update set updated_at = now()
    `;

    await db.unsafe(`
      insert into public.board_columns (org_id, board_id, key, name, sort_order)
      select
        b.org_id,
        b.id,
        c.key,
        c.name,
        c.sort_order
      from public.boards b
      cross join (
        values
          ('backlog'::text, 'Backlog'::text, 1000),
          ('next'::text, 'Next'::text, 2000),
          ('doing'::text, 'Doing'::text, 3000),
          ('waiting'::text, 'Waiting'::text, 4000),
          ('done'::text, 'Done'::text, 5000)
      ) as c(key, name, sort_order)
      on conflict (board_id, key) do nothing;
    `);

    await db.unsafe(`
      insert into public.board_views (org_id, board_id, name, kind, sort_order, created_by)
      select
        b.org_id,
        b.id,
        'All work',
        'all',
        1000,
        b.created_by
      from public.boards b
      where not exists (
        select 1 from public.board_views v where v.board_id = b.id and v.kind = 'all'
      );

      insert into public.board_views (org_id, board_id, name, kind, sort_order, created_by)
      select
        b.org_id,
        b.id,
        'Unlinked',
        'unlinked',
        2000,
        b.created_by
      from public.boards b
      where not exists (
        select 1 from public.board_views v where v.board_id = b.id and v.kind = 'unlinked'
      );
    `);

    await db.unsafe(`
      with required_boards as (
        select distinct w.org_id, w.owner_user_id
        from public.work_items w
        where w.owner_user_id is not null
      )
      insert into public.boards (org_id, type, owner_user_id, name, is_default, created_by)
      select rb.org_id, 'user', rb.owner_user_id, 'My Board', true, rb.owner_user_id
      from required_boards rb
      on conflict (org_id, owner_user_id) where type = 'user'
      do update set updated_at = now();
    `);

    console.log("✅ Workboards bootstrapped for users and teams.");
  } finally {
    await db.close();
  }
}

await bootstrapWorkboards();
