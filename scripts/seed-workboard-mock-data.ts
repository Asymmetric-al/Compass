import { SQL } from "bun";

import { ensureAuthFixtureData } from "../e2e/support/auth-fixtures";
import { getDatabaseUrl } from "./lib/v2-migration";

async function seedWorkboardMockData() {
  const fixture = await ensureAuthFixtureData();
  const db = new SQL(getDatabaseUrl());

  try {
    const mockPrefix = "Mock V2:";

    await db.begin(async (tx) => {
      await tx`
        delete from public.work_item_board_state
        where work_item_id in (
          select id from public.work_items
          where org_id = ${fixture.orgId}
            and title ilike ${`${mockPrefix}%`}
        )
      `;
      await tx`
        delete from public.work_item_assignees
        where work_item_id in (
          select id from public.work_items
          where org_id = ${fixture.orgId}
            and title ilike ${`${mockPrefix}%`}
        )
      `;
      await tx`
        delete from public.work_item_goal_links
        where work_item_id in (
          select id from public.work_items
          where org_id = ${fixture.orgId}
            and title ilike ${`${mockPrefix}%`}
        )
      `;
      await tx`
        delete from public.work_items
        where org_id = ${fixture.orgId}
          and title ilike ${`${mockPrefix}%`}
      `;
      await tx`
        delete from public.goal_measure_updates
        where goal_measure_id in (
          select id from public.goal_measures
          where org_id = ${fixture.orgId}
            and name ilike ${`${mockPrefix}%`}
        )
      `;
      await tx`
        delete from public.goal_measures
        where org_id = ${fixture.orgId}
          and name ilike ${`${mockPrefix}%`}
      `;
      await tx`
        delete from public.goals
        where org_id = ${fixture.orgId}
          and title ilike ${`${mockPrefix}%`}
      `;

      const [goal] = await tx<[{ id: string }]>`
        insert into public.goals (
          org_id,
          scope_type,
          scope_team_id,
          scope_user_id,
          title,
          description_text,
          status,
          timebox_type,
          start_date,
          end_date,
          visibility,
          classification,
          created_by,
          updated_by
        )
        values (
          ${fixture.orgId},
          'user',
          ${fixture.regionTeamId},
          ${fixture.userId},
          'Mock V2: Strengthen prayer-led disciple pathways',
          'Build consistent rhythms across mentoring, outreach, and intercession.',
          'active',
          'quarterly',
          current_date,
          current_date + interval '89 days',
          'private',
          'normal',
          ${fixture.userId},
          ${fixture.userId}
        )
        returning id
      `;

      const [measure] = await tx<[{ id: string }]>`
        insert into public.goal_measures (
          org_id,
          goal_id,
          kind,
          name,
          format,
          start_value,
          target_value,
          current_value,
          update_cadence,
          created_by
        )
        values (
          ${fixture.orgId},
          ${goal.id},
          'lead',
          'Mock V2: Weekly mentoring touchpoints',
          'number',
          3,
          8,
          4,
          'weekly',
          ${fixture.userId}
        )
        returning id
      `;

      await tx`
        insert into public.goal_measure_updates (
          org_id,
          goal_measure_id,
          value,
          note_text,
          occurred_at,
          created_by
        )
        values (
          ${fixture.orgId},
          ${measure.id},
          4,
          'Started weekly coaching rhythms with two cohorts.',
          current_date,
          ${fixture.userId}
        )
      `;

      const workItems = await tx<[{ id: string }, { id: string }]>`
        insert into public.work_items (
          org_id,
          type,
          title,
          status_key,
          priority,
          due_date,
          owner_user_id,
          team_id,
          created_by,
          updated_by,
          visibility,
          classification
        )
        values
          (
            ${fixture.orgId},
            'task',
            'Mock V2: Build weekly intercession rhythm doc',
            'next',
            'high',
            current_date + interval '5 days',
            ${fixture.userId},
            ${fixture.regionTeamId},
            ${fixture.userId},
            ${fixture.userId},
            'team',
            'normal'
          ),
          (
            ${fixture.orgId},
            'task',
            'Mock V2: Collect testimony highlights from region',
            'doing',
            'medium',
            current_date + interval '10 days',
            ${fixture.userId},
            ${fixture.regionTeamId},
            ${fixture.userId},
            ${fixture.userId},
            'team',
            'normal'
          )
        returning id
      `;

      for (const workItem of workItems) {
        await tx`
          insert into public.work_item_goal_links (
            org_id,
            work_item_id,
            goal_id,
            is_primary,
            created_by
          )
          values (
            ${fixture.orgId},
            ${workItem.id},
            ${goal.id},
            true,
            ${fixture.userId}
          )
        `;
        await tx`
          insert into public.work_item_assignees (
            org_id,
            work_item_id,
            user_id,
            created_by
          )
          values (
            ${fixture.orgId},
            ${workItem.id},
            ${fixture.userId},
            ${fixture.userId}
          )
          on conflict (work_item_id, user_id) do nothing
        `;
      }

      const [board] = await tx<[{ id: string }]>`
        select id
        from public.boards
        where org_id = ${fixture.orgId}
          and type = 'user'
          and owner_user_id = ${fixture.userId}
        limit 1
      `;

      if (board?.id) {
        const columns = await tx<{ id: string; key: "next" | "doing" }[]>`
          select id, key
          from public.board_columns
          where board_id = ${board.id}
            and key in ('next', 'doing')
        `;
        const columnMap = new Map(
          columns.map((column) => [column.key, column.id])
        );

        const nextColumnId = columnMap.get("next");
        const doingColumnId = columnMap.get("doing");
        if (nextColumnId && doingColumnId) {
          await tx`
            insert into public.work_item_board_state (
              org_id,
              board_id,
              work_item_id,
              column_id,
              position,
              pinned
            )
            values
              (
                ${fixture.orgId},
                ${board.id},
                ${workItems[0].id},
                ${nextColumnId},
                1000,
                true
              ),
              (
                ${fixture.orgId},
                ${board.id},
                ${workItems[1].id},
                ${doingColumnId},
                1000,
                true
              )
            on conflict (board_id, work_item_id)
            do update set
              column_id = excluded.column_id,
              position = excluded.position,
              pinned = true,
              updated_at = now()
          `;
        }
      }

      await tx`
        insert into public.work_item_checklist_items (
          org_id,
          work_item_id,
          text,
          is_done,
          sort_order,
          created_by
        )
        values
          (
            ${fixture.orgId},
            ${workItems[0].id},
            'Draft rhythm outline',
            true,
            1000,
            ${fixture.userId}
          ),
          (
            ${fixture.orgId},
            ${workItems[0].id},
            'Review with team lead',
            false,
            2000,
            ${fixture.userId}
          )
      `;
    });

    console.log("✅ Workboard v2 mock data seeded.");
  } finally {
    await db.close();
  }
}

await seedWorkboardMockData();
