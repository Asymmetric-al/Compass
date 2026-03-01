import { SQL } from "bun";

export type MigrationEntity =
  | "aim"
  | "measure"
  | "commitment"
  | "story"
  | "prayer_item";

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set.");
  }
  return databaseUrl;
}

export function createDatabaseClient() {
  return new SQL(getDatabaseUrl());
}

export async function ensureMigrationMapTable(db: SQL) {
  await db.unsafe(`
    create table if not exists public.v2_migration_map (
      entity text not null,
      old_id uuid not null,
      new_id uuid not null,
      created_at timestamptz not null default now(),
      primary key (entity, old_id)
    );
  `);
}

export async function findMappedId(
  db: SQL,
  entity: MigrationEntity,
  oldId: string
) {
  const rows = await db<{ new_id: string }[]>`
    select new_id
    from public.v2_migration_map
    where entity = ${entity}
      and old_id = ${oldId}::uuid
    limit 1
  `;

  return rows[0]?.new_id ?? null;
}

export async function saveMappedId(
  db: SQL,
  entity: MigrationEntity,
  oldId: string,
  newId: string
) {
  await db`
    insert into public.v2_migration_map (entity, old_id, new_id)
    values (${entity}, ${oldId}::uuid, ${newId}::uuid)
    on conflict (entity, old_id)
    do update set new_id = excluded.new_id
  `;
}

export function mapCommitmentStatusToWorkStatus(
  status: string | null | undefined
) {
  if (status === "done") return "done";
  if (status === "in_progress") return "doing";
  if (status === "blocked") return "waiting";
  if (status === "planned") return "backlog";
  return "backlog";
}
