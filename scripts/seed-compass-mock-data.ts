import { SQL } from "bun";

import { ensureAuthFixtureData } from "../e2e/support/auth-fixtures";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set to seed Compass mock data.");
  }

  return databaseUrl;
}

async function seedMockData() {
  const fixture = await ensureAuthFixtureData();
  const db = new SQL(getDatabaseUrl());

  try {
    const mockPrefix = "Mock Data:";

    await db.begin(async (tx) => {
      await tx`
        delete from public.commitments
        where owner_user_id = ${fixture.userId}
          and title ilike ${`${mockPrefix}%`}
      `;
      await tx`
        delete from public.measures
        where owner_user_id = ${fixture.userId}
          and name ilike ${`${mockPrefix}%`}
      `;
      await tx`
        delete from public.aims
        where owner_user_id = ${fixture.userId}
          and title ilike ${`${mockPrefix}%`}
      `;
      await tx`
        delete from public.stories
        where title ilike ${`${mockPrefix}%`}
      `;
      await tx`
        delete from public.prayer_items
        where text ilike ${`${mockPrefix}%`}
      `;
      await tx`
        delete from public.missionaries
        where code_name ilike ${`${mockPrefix}%`}
      `;

      const [aim] = await tx<[{ id: string }]>`
        insert into public.aims (
          org_id,
          scope,
          owner_user_id,
          team_id,
          title,
          why_this_matters,
          classification,
          created_by
        )
        values (
          ${fixture.orgId},
          'user',
          ${fixture.userId},
          ${fixture.regionTeamId},
          'Mock Data: Multiply mentor coaching cohorts',
          'Strengthen sustainable disciple-making multiplication through local mentors.',
          'normal',
          ${fixture.userId}
        )
        returning id
      `;

      const [measure] = await tx<[{ id: string }]>`
        insert into public.measures (
          org_id,
          aim_id,
          kind,
          owner_user_id,
          name,
          cadence,
          unit,
          baseline,
          target,
          confidence_score,
          definition_text,
          created_by
        )
        values (
          ${fixture.orgId},
          ${aim.id},
          'lead',
          ${fixture.userId},
          'Mock Data: Weekly mentor coaching sessions',
          'weekly',
          'count',
          4,
          9,
          4,
          'Number of completed mentor coaching sessions each week.',
          ${fixture.userId}
        )
        returning id
      `;

      await tx`
        insert into public.commitments (
          org_id,
          aim_id,
          measure_id,
          owner_user_id,
          team_id,
          title,
          status,
          priority_rank,
          weight,
          classification,
          created_by
        )
        values
          (
            ${fixture.orgId},
            ${aim.id},
            ${measure.id},
            ${fixture.userId},
            ${fixture.regionTeamId},
            'Mock Data: Debrief this week''s mentor calls',
            'planned',
            1,
            80,
            'normal',
            ${fixture.userId}
          ),
          (
            ${fixture.orgId},
            ${aim.id},
            ${measure.id},
            ${fixture.userId},
            ${fixture.regionTeamId},
            'Mock Data: Share prayer updates with regional team',
            'in_progress',
            2,
            65,
            'normal',
            ${fixture.userId}
          )
      `;

      await tx`
        insert into public.stories (
          org_id,
          team_id,
          aim_id,
          author_user_id,
          type,
          title,
          body_json,
          tags,
          classification
        )
        values (
          ${fixture.orgId},
          ${fixture.regionTeamId},
          ${aim.id},
          ${fixture.userId},
          'quick',
          'Mock Data: New house fellowship launched',
          '{"text":"A mentoring pair launched a new house fellowship and started coaching two apprentices."}'::jsonb,
          array['mock', 'story'],
          'normal'
        )
      `;

      await tx`
        insert into public.prayer_items (
          org_id,
          team_id,
          aim_id,
          owner_user_id,
          text,
          status,
          classification
        )
        values (
          ${fixture.orgId},
          ${fixture.regionTeamId},
          ${aim.id},
          ${fixture.userId},
          'Mock Data: Pray for endurance and boldness for mentor teams in difficult settings.',
          'open',
          'normal'
        )
      `;

      const [missionary] = await tx<[{ id: string }]>`
        insert into public.missionaries (
          org_id,
          region_team_id,
          code_name,
          status,
          location_text,
          classification
        )
        values (
          ${fixture.orgId},
          ${fixture.regionTeamId},
          'Mock Data: Juniper Harbor',
          'active',
          'Sensitive region',
          'sensitive'
        )
        returning id
      `;

      await tx`
        insert into public.missionary_updates (
          org_id,
          missionary_id,
          month,
          summary_json,
          prayer_json,
          lead_metrics,
          lag_metrics,
          classification,
          created_by
        )
        values (
          ${fixture.orgId},
          ${missionary.id},
          date_trunc('month', now())::date,
          '{"text":"Two key relationships deepened and regular follow-up rhythms stabilized."}'::jsonb,
          '{"text":"Pray for protection, discernment, and language growth."}'::jsonb,
          '{"visits":8,"coaching_sessions":5}'::jsonb,
          '{"new_groups":2,"new_leaders":1}'::jsonb,
          'sensitive',
          ${fixture.userId}
        )
        on conflict (missionary_id, month) do update
        set
          summary_json = excluded.summary_json,
          prayer_json = excluded.prayer_json,
          lead_metrics = excluded.lead_metrics,
          lag_metrics = excluded.lag_metrics,
          updated_at = now()
      `;
    });

    console.log("✅ Compass mock data inserted into configured database.");
  } finally {
    await db.close();
  }
}

await seedMockData();
