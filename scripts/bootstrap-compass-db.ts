import { readFile } from "node:fs/promises";
import path from "node:path";

import { SQL } from "bun";

type MigrationRecord = {
  name: string;
};

const MIGRATION_FILES = [
  "202603010001_core_schema.sql",
  "202603010002_functions_triggers.sql",
  "202603010003_rls_policies.sql",
  "202603010004_seed_bootstrap.sql",
  "202603010005_goals_workboard_core.sql",
  "202603010006_goals_workboard_rls.sql",
  "202603010007_goals_workboard_bootstrap.sql",
] as const;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set to bootstrap the Compass schema."
    );
  }

  return databaseUrl;
}

async function ensureCompatibilityColumns(db: SQL) {
  await db.unsafe(`
    alter table public.profiles add column if not exists org_id uuid;
    alter table public.profiles add column if not exists title text;
    alter table public.profiles add column if not exists timezone text;
    alter table public.profiles add column if not exists is_active boolean;
    update public.profiles set timezone = coalesce(timezone, 'UTC');
    update public.profiles set is_active = coalesce(is_active, true);
    alter table public.profiles alter column timezone set default 'UTC';
    alter table public.profiles alter column is_active set default true;

    alter table public.missionaries add column if not exists org_id uuid;
    alter table public.missionaries add column if not exists region_team_id uuid;
    alter table public.missionaries add column if not exists code_name text;
    alter table public.missionaries add column if not exists public_name text;
    alter table public.missionaries add column if not exists status text;
    alter table public.missionaries add column if not exists location_text text;
    alter table public.missionaries add column if not exists classification text;
    update public.missionaries set status = coalesce(status, 'active');
    update public.missionaries set classification = coalesce(classification, 'sensitive');
    update public.missionaries set location_text = coalesce(location_text, location);
  `);
}

async function ensureMigrationLogTable(db: SQL) {
  await db.unsafe(`
    create table if not exists public.compass_migration_log (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function applyMigrationIfNeeded(db: SQL, migrationFile: string) {
  const migrationName = migrationFile.replace(".sql", "");
  const existing = await db<MigrationRecord[]>`
    select name
    from public.compass_migration_log
    where name = ${migrationName}
    limit 1
  `;

  if (existing.length > 0) {
    console.log(`• Skipping ${migrationName} (already applied)`);
    return;
  }

  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    migrationFile
  );
  const migrationSql = await readFile(migrationPath, "utf8");

  console.log(`• Applying ${migrationName}...`);
  await db.unsafe(migrationSql);
  await db`
    insert into public.compass_migration_log (name)
    values (${migrationName})
  `;
}

async function backfillDefaults(db: SQL) {
  await db.unsafe(`
    with primary_org as (
      select primary_org_id as org_id
      from public.app_config
      where id = 1
    )
    update public.profiles p
    set org_id = po.org_id
    from primary_org po
    where p.org_id is null;

    with defaults as (
      select
        ac.primary_org_id as org_id,
        (
          select t.id
          from public.teams t
          where t.org_id = ac.primary_org_id
            and t.type = 'region'
          order by t.created_at asc
          limit 1
        ) as region_team_id
      from public.app_config ac
      where ac.id = 1
    )
    update public.missionaries m
    set
      org_id = coalesce(m.org_id, d.org_id),
      region_team_id = coalesce(m.region_team_id, d.region_team_id),
      code_name = coalesce(m.code_name, m.public_name, 'Legacy missionary'),
      classification = coalesce(m.classification, 'sensitive'),
      status = coalesce(m.status, 'active')
    from defaults d
    where m.org_id is null or m.region_team_id is null or m.code_name is null;
  `);
}

async function bootstrapCompassSchema() {
  const db = new SQL(getDatabaseUrl());

  try {
    await ensureCompatibilityColumns(db);
    await ensureMigrationLogTable(db);

    for (const migrationFile of MIGRATION_FILES) {
      await applyMigrationIfNeeded(db, migrationFile);
    }

    await backfillDefaults(db);
    console.log("✅ Compass schema bootstrap complete.");
  } finally {
    await db.close();
  }
}

await bootstrapCompassSchema();
