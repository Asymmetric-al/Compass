import {
  createDatabaseClient,
  ensureMigrationMapTable,
  findMappedId,
  mapCommitmentStatusToWorkStatus,
  saveMappedId,
} from "./lib/v2-migration";

type LegacyCommitment = {
  id: string;
  org_id: string;
  aim_id: string | null;
  owner_user_id: string;
  team_id: string | null;
  title: string;
  details_json: Record<string, unknown> | null;
  status: string;
  due_date: string | null;
  classification: "normal" | "sensitive" | "restricted";
  created_by: string;
  created_at: string;
  updated_at: string;
  weight: number;
};

function mapPriority(weight: number | null | undefined) {
  if ((weight ?? 0) >= 85) return "urgent";
  if ((weight ?? 0) >= 65) return "high";
  if ((weight ?? 0) >= 40) return "medium";
  return "low";
}

async function migrateCommitmentsToWorkItems() {
  const db = createDatabaseClient();
  try {
    await ensureMigrationMapTable(db);

    const commitments = await db<LegacyCommitment[]>`
      select
        id,
        org_id,
        aim_id,
        owner_user_id,
        team_id,
        title,
        details_json,
        status,
        due_date,
        classification,
        created_by,
        created_at,
        updated_at,
        weight
      from public.commitments
      order by created_at asc
    `;

    let workItemsCreated = 0;
    let goalLinksCreated = 0;
    let assigneesCreated = 0;

    for (const commitment of commitments) {
      const existingWorkItemId = await findMappedId(
        db,
        "commitment",
        commitment.id
      );
      if (existingWorkItemId) continue;

      const mappedGoalId = commitment.aim_id
        ? await findMappedId(db, "aim", commitment.aim_id)
        : null;

      const [inserted] = await db<{ id: string }[]>`
        insert into public.work_items (
          org_id,
          type,
          title,
          description_json,
          description_text,
          status_key,
          priority,
          due_date,
          owner_user_id,
          team_id,
          created_by,
          updated_by,
          visibility,
          classification,
          created_at,
          updated_at
        )
        values (
          ${commitment.org_id},
          'task',
          ${commitment.title},
          jsonb_build_object(
            'legacyCommitmentId',
            ${commitment.id}::text,
            'details',
            ${JSON.stringify(commitment.details_json ?? {})}::jsonb
          ),
          null,
          ${mapCommitmentStatusToWorkStatus(commitment.status)},
          ${mapPriority(commitment.weight)},
          ${commitment.due_date}::date,
          ${commitment.owner_user_id},
          ${commitment.team_id},
          ${commitment.created_by},
          ${commitment.created_by},
          ${commitment.team_id ? "team" : "private"},
          ${commitment.classification},
          ${commitment.created_at}::timestamptz,
          ${commitment.updated_at}::timestamptz
        )
        returning id
      `;

      if (!inserted?.id) continue;
      await saveMappedId(db, "commitment", commitment.id, inserted.id);
      workItemsCreated += 1;

      await db`
        insert into public.work_item_assignees (
          org_id,
          work_item_id,
          user_id,
          created_by
        )
        values (
          ${commitment.org_id},
          ${inserted.id}::uuid,
          ${commitment.owner_user_id},
          ${commitment.created_by}
        )
        on conflict (work_item_id, user_id) do nothing
      `;
      assigneesCreated += 1;

      if (mappedGoalId) {
        await db`
          insert into public.work_item_goal_links (
            org_id,
            work_item_id,
            goal_id,
            is_primary,
            created_by
          )
          values (
            ${commitment.org_id},
            ${inserted.id}::uuid,
            ${mappedGoalId}::uuid,
            true,
            ${commitment.created_by}
          )
          on conflict (work_item_id, goal_id)
          do update set is_primary = true
        `;
        goalLinksCreated += 1;
      }
    }

    console.log(
      `✅ Migrated commitments→work_items (${workItemsCreated}), created assignees (${assigneesCreated}), goal links (${goalLinksCreated}).`
    );
  } finally {
    await db.close();
  }
}

await migrateCommitmentsToWorkItems();
