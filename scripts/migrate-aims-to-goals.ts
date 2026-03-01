import {
  createDatabaseClient,
  ensureMigrationMapTable,
  findMappedId,
  saveMappedId,
} from "./lib/v2-migration";

type LegacyAimRow = {
  id: string;
  org_id: string;
  scope: "org" | "team" | "user";
  team_id: string | null;
  owner_user_id: string | null;
  parent_aim_id: string | null;
  title: string;
  narrative_json: Record<string, unknown> | null;
  why_this_matters: string | null;
  classification: "normal" | "sensitive" | "restricted";
  created_by: string;
  created_at: string;
  cycle_type: "annual" | "quarterly" | null;
  start_date: string | null;
  end_date: string | null;
};

type LegacyMeasureRow = {
  id: string;
  org_id: string;
  aim_id: string;
  kind: "lead" | "lag" | "health" | "learning";
  name: string;
  unit: string;
  baseline: number | null;
  target: number | null;
  cadence: "weekly" | "monthly" | "quarterly";
  owner_user_id: string | null;
  created_by: string;
  created_at: string;
};

type LegacyMeasureUpdate = {
  id: string;
  as_of_date: string;
  value_numeric: number | null;
  value_text: string | null;
  comment_json: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
};

function inferTimeboxType(
  cycleType: LegacyAimRow["cycle_type"]
): "annual" | "quarterly" | "monthly" | "weekly" | "custom" {
  if (cycleType === "annual") return "annual";
  if (cycleType === "quarterly") return "quarterly";
  return "custom";
}

async function migrateAimsToGoals() {
  const db = createDatabaseClient();

  try {
    await ensureMigrationMapTable(db);

    const aims = await db<LegacyAimRow[]>`
      select
        a.id,
        a.org_id,
        a.scope,
        a.team_id,
        a.owner_user_id,
        a.parent_aim_id,
        a.title,
        a.narrative_json,
        a.why_this_matters,
        a.classification,
        a.created_by,
        a.created_at,
        c.type as cycle_type,
        c.start_date,
        c.end_date
      from public.aims a
      left join public.cycles c on c.id = a.cycle_id
      order by a.created_at asc
    `;

    let goalsCreated = 0;
    for (const aim of aims) {
      const existingGoalId = await findMappedId(db, "aim", aim.id);
      if (existingGoalId) continue;

      const parentGoalId = aim.parent_aim_id
        ? await findMappedId(db, "aim", aim.parent_aim_id)
        : null;

      const startDate = aim.start_date ?? new Date().toISOString().slice(0, 10);
      const endDate = aim.end_date ?? startDate;
      const scopeUserId =
        aim.scope === "user" ? (aim.owner_user_id ?? aim.created_by) : null;

      const insertedGoal = await db<{ id: string }[]>`
        insert into public.goals (
          org_id,
          scope_type,
          scope_team_id,
          scope_user_id,
          title,
          description_json,
          description_text,
          status,
          timebox_type,
          start_date,
          end_date,
          parent_goal_id,
          visibility,
          classification,
          created_by,
          updated_by,
          created_at,
          updated_at
        )
        values (
          ${aim.org_id},
          ${aim.scope},
          ${aim.team_id},
          ${scopeUserId},
          ${aim.title},
          jsonb_build_object('legacyAimId', ${aim.id}::text, 'narrative', ${JSON.stringify(
            aim.narrative_json ?? {}
          )}::jsonb),
          ${aim.why_this_matters ?? null},
          'active',
          ${inferTimeboxType(aim.cycle_type)},
          ${startDate}::date,
          ${endDate}::date,
          ${parentGoalId}::uuid,
          ${aim.scope === "user" ? "private" : "org"},
          ${aim.classification},
          ${aim.created_by},
          ${aim.created_by},
          ${aim.created_at}::timestamptz,
          ${aim.created_at}::timestamptz
        )
        returning id
      `;

      const goalId = insertedGoal[0]?.id;
      if (!goalId) continue;
      await saveMappedId(db, "aim", aim.id, goalId);
      goalsCreated += 1;
    }

    const measures = await db<LegacyMeasureRow[]>`
      select
        id,
        org_id,
        aim_id,
        kind,
        name,
        unit,
        baseline,
        target,
        cadence,
        owner_user_id,
        created_by,
        created_at
      from public.measures
      order by created_at asc
    `;

    let measuresCreated = 0;
    let updatesCreated = 0;
    for (const measure of measures) {
      const existingMeasureId = await findMappedId(db, "measure", measure.id);
      if (existingMeasureId) continue;

      const goalId = await findMappedId(db, "aim", measure.aim_id);
      if (!goalId) continue;

      const insertedMeasure = await db<{ id: string }[]>`
        insert into public.goal_measures (
          org_id,
          goal_id,
          kind,
          name,
          unit,
          format,
          start_value,
          target_value,
          current_value,
          update_cadence,
          created_by,
          created_at
        )
        values (
          ${measure.org_id},
          ${goalId}::uuid,
          ${measure.kind === "lead" ? "lead" : "outcome"},
          ${measure.name},
          ${measure.unit === "count" ? null : measure.unit},
          'number',
          ${measure.baseline},
          ${measure.target},
          ${measure.baseline},
          ${measure.cadence === "quarterly" ? "monthly" : measure.cadence},
          ${measure.owner_user_id ?? measure.created_by},
          ${measure.created_at}::timestamptz
        )
        returning id
      `;

      const goalMeasureId = insertedMeasure[0]?.id;
      if (!goalMeasureId) continue;
      await saveMappedId(db, "measure", measure.id, goalMeasureId);
      measuresCreated += 1;

      const updates = await db<LegacyMeasureUpdate[]>`
        select id, as_of_date, value_numeric, value_text, comment_json, created_by, created_at
        from public.measure_updates
        where measure_id = ${measure.id}::uuid
        order by as_of_date asc
      `;

      for (const update of updates) {
        await db`
          insert into public.goal_measure_updates (
            org_id,
            goal_measure_id,
            value,
            note_json,
            note_text,
            occurred_at,
            created_by,
            created_at
          )
          values (
            ${measure.org_id},
            ${goalMeasureId}::uuid,
            ${update.value_numeric},
            ${JSON.stringify(update.comment_json ?? {})}::jsonb,
            ${update.value_text ?? null},
            ${update.as_of_date}::date,
            ${update.created_by},
            ${update.created_at}::timestamptz
          )
        `;
        updatesCreated += 1;
      }

      if (updates.length > 0) {
        const latest = updates[updates.length - 1];
        await db`
          update public.goal_measures
          set current_value = ${latest.value_numeric}
          where id = ${goalMeasureId}::uuid
        `;
      }
    }

    console.log(
      `✅ Migrated aims→goals (${goalsCreated}) and measures (${measuresCreated}) with ${updatesCreated} updates.`
    );
  } finally {
    await db.close();
  }
}

await migrateAimsToGoals();
