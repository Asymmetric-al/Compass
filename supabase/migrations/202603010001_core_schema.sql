create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

do $$
begin
  create type public.team_type as enum ('department', 'region');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cycle_type as enum ('annual', 'quarterly');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.aim_scope as enum ('org', 'team', 'user');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.measure_kind as enum ('lead', 'lag', 'health', 'learning');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.measure_cadence as enum ('weekly', 'monthly', 'quarterly');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.measure_unit as enum ('count', 'percent', 'currency', 'hours', 'score', 'yes_no', 'narrative', 'custom');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.commitment_status as enum ('planned', 'in_progress', 'blocked', 'done', 'dropped');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_type as enum ('quick', 'msc_candidate');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.prayer_status as enum ('open', 'answered', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.classification_level as enum ('normal', 'sensitive', 'restricted');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.role_key as enum (
    'co_ed',
    'admin',
    'staff',
    'department_director',
    'department_staff',
    'regional_director',
    'regional_staff',
    'read_only'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_config (
  id int primary key default 1,
  primary_org_id uuid references public.orgs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_config_single_row check (id = 1)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  full_name text not null,
  title text,
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_org_id_idx on public.profiles(org_id);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  type public.team_type not null,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, type, slug)
);

create index if not exists teams_org_id_idx on public.teams(org_id);

create table if not exists public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index if not exists team_memberships_user_idx on public.team_memberships(user_id);
create index if not exists team_memberships_team_idx on public.team_memberships(team_id);

create table if not exists public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.role_key not null,
  team_id uuid references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (org_id, user_id, role, team_id)
);

create index if not exists role_assignments_user_idx on public.role_assignments(user_id);
create index if not exists role_assignments_team_idx on public.role_assignments(team_id);

create table if not exists public.reporting_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  manager_user_id uuid not null references auth.users(id) on delete cascade,
  report_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (manager_user_id, report_user_id)
);

create index if not exists reporting_lines_manager_idx on public.reporting_lines(manager_user_id);
create index if not exists reporting_lines_report_idx on public.reporting_lines(report_user_id);

create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  type public.cycle_type not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date <= end_date)
);

create index if not exists cycles_org_active_idx on public.cycles(org_id, type, is_active);

create table if not exists public.aims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cycle_id uuid references public.cycles(id) on delete set null,
  scope public.aim_scope not null,
  team_id uuid references public.teams(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  parent_aim_id uuid references public.aims(id) on delete set null,
  title text not null,
  narrative_json jsonb not null default '{}'::jsonb,
  scripture_anchor text,
  why_this_matters text,
  classification public.classification_level not null default 'normal',
  sort_order int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists aims_org_cycle_idx on public.aims(org_id, cycle_id);
create index if not exists aims_parent_idx on public.aims(parent_aim_id);
create index if not exists aims_team_idx on public.aims(team_id);

create table if not exists public.measures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  aim_id uuid not null references public.aims(id) on delete cascade,
  kind public.measure_kind not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  cadence public.measure_cadence not null default 'weekly',
  unit public.measure_unit not null default 'count',
  unit_label text,
  direction text not null default 'increase',
  baseline numeric,
  target numeric,
  target_date date,
  confidence_score int not null default 3,
  definition_text text not null default '',
  notes_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (confidence_score between 1 and 5)
);

create index if not exists measures_aim_idx on public.measures(aim_id);
create index if not exists measures_org_idx on public.measures(org_id);

create table if not exists public.measure_updates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  measure_id uuid not null references public.measures(id) on delete cascade,
  as_of_date date not null,
  value_numeric numeric,
  value_text text,
  comment_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (measure_id, as_of_date)
);

create index if not exists measure_updates_measure_idx on public.measure_updates(measure_id);

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cycle_id uuid references public.cycles(id) on delete set null,
  aim_id uuid references public.aims(id) on delete set null,
  measure_id uuid references public.measures(id) on delete set null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  title text not null,
  details_json jsonb not null default '{}'::jsonb,
  status public.commitment_status not null default 'planned',
  priority_rank int not null default 0,
  weight int not null default 10,
  due_date date,
  recurring_rule text,
  estimated_minutes int,
  completed_at timestamptz,
  classification public.classification_level not null default 'normal',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (weight between 0 and 100),
  check (estimated_minutes is null or estimated_minutes >= 0)
);

create index if not exists commitments_owner_idx on public.commitments(owner_user_id, status);
create index if not exists commitments_cycle_idx on public.commitments(cycle_id);
create index if not exists commitments_aim_idx on public.commitments(aim_id);

create table if not exists public.commitment_updates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  status public.commitment_status,
  note_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists commitment_updates_commitment_idx on public.commitment_updates(commitment_id);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  highlights_json jsonb not null default '{}'::jsonb,
  progress_json jsonb not null default '{}'::jsonb,
  blockers_json jsonb not null default '{}'::jsonb,
  asks_json jsonb not null default '{}'::jsonb,
  prayer_json jsonb not null default '{}'::jsonb,
  next_week_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists checkins_org_week_idx on public.checkins(org_id, week_start);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  cycle_id uuid references public.cycles(id) on delete set null,
  aim_id uuid references public.aims(id) on delete set null,
  author_user_id uuid references auth.users(id) on delete set null,
  type public.story_type not null default 'quick',
  title text not null,
  body_json jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  classification public.classification_level not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_org_idx on public.stories(org_id);
create index if not exists stories_team_idx on public.stories(team_id);

create table if not exists public.prayer_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  aim_id uuid references public.aims(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  text text not null,
  status public.prayer_status not null default 'open',
  classification public.classification_level not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prayer_items_org_idx on public.prayer_items(org_id, status);

create table if not exists public.missionaries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  region_team_id uuid not null references public.teams(id) on delete restrict,
  code_name text,
  public_name text,
  status text not null default 'active',
  location_text text,
  classification public.classification_level not null default 'sensitive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists missionaries_org_region_idx on public.missionaries(org_id, region_team_id);

create table if not exists public.missionary_updates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  missionary_id uuid not null references public.missionaries(id) on delete cascade,
  month date not null,
  summary_json jsonb not null default '{}'::jsonb,
  prayer_json jsonb not null default '{}'::jsonb,
  lead_metrics jsonb not null default '{}'::jsonb,
  lag_metrics jsonb not null default '{}'::jsonb,
  classification public.classification_level not null default 'sensitive',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (missionary_id, month)
);

create index if not exists missionary_updates_missionary_idx on public.missionary_updates(missionary_id);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_org_idx on public.audit_log(org_id, created_at desc);
