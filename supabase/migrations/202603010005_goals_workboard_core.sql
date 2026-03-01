do $$
begin
  create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    scope_type text not null check (scope_type in ('org', 'team', 'user')),
    scope_team_id uuid references public.teams(id) on delete set null,
    scope_user_id uuid references auth.users(id) on delete set null,
    title text not null,
    description_json jsonb,
    description_text text,
    status text not null default 'active' check (status in ('draft', 'active', 'done', 'dropped')),
    timebox_type text not null check (timebox_type in ('annual', 'quarterly', 'monthly', 'weekly', 'custom')),
    start_date date not null,
    end_date date not null,
    parent_goal_id uuid references public.goals(id) on delete set null,
    visibility text not null default 'org' check (visibility in ('org', 'team', 'private')),
    classification public.classification_level not null default 'normal',
    created_by uuid not null references auth.users(id),
    updated_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (start_date <= end_date)
  );
end $$;

create index if not exists goals_v2_org_scope_idx on public.goals(org_id, scope_type);
create index if not exists goals_v2_org_scope_team_idx on public.goals(org_id, scope_team_id);
create index if not exists goals_v2_org_scope_user_idx on public.goals(org_id, scope_user_id);
create index if not exists goals_v2_org_dates_idx on public.goals(org_id, start_date, end_date);
create index if not exists goals_v2_org_parent_idx on public.goals(org_id, parent_goal_id);

do $$
begin
  create table if not exists public.goal_links (
    org_id uuid not null references public.orgs(id) on delete cascade,
    goal_id uuid not null references public.goals(id) on delete cascade,
    upstream_goal_id uuid not null references public.goals(id) on delete cascade,
    link_type text not null default 'supports' check (link_type in ('supports', 'related')),
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    primary key (goal_id, upstream_goal_id),
    check (goal_id <> upstream_goal_id)
  );
end $$;

create index if not exists goal_links_org_goal_idx on public.goal_links(org_id, goal_id);
create index if not exists goal_links_org_upstream_idx on public.goal_links(org_id, upstream_goal_id);

do $$
begin
  create table if not exists public.goal_measures (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    goal_id uuid not null references public.goals(id) on delete cascade,
    kind text not null check (kind in ('lead', 'outcome')),
    name text not null,
    unit text,
    format text not null default 'number' check (format in ('number', 'percent', 'boolean', 'text')),
    start_value numeric,
    target_value numeric,
    current_value numeric,
    update_cadence text not null default 'ad_hoc' check (update_cadence in ('weekly', 'monthly', 'ad_hoc')),
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now()
  );
end $$;

create index if not exists goal_measures_org_goal_idx on public.goal_measures(org_id, goal_id);

do $$
begin
  create table if not exists public.goal_measure_updates (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    goal_measure_id uuid not null references public.goal_measures(id) on delete cascade,
    value numeric,
    note_json jsonb,
    note_text text,
    occurred_at date not null,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now()
  );
end $$;

create index if not exists goal_measure_updates_org_measure_idx on public.goal_measure_updates(org_id, goal_measure_id, occurred_at desc);

do $$
begin
  create table if not exists public.boards (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    type text not null check (type in ('user', 'team')),
    owner_user_id uuid references auth.users(id) on delete cascade,
    team_id uuid references public.teams(id) on delete cascade,
    name text not null,
    is_default boolean not null default false,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (
      (type = 'user' and owner_user_id is not null and team_id is null) or
      (type = 'team' and team_id is not null and owner_user_id is null)
    )
  );
end $$;

create unique index if not exists boards_user_unique_idx
  on public.boards(org_id, owner_user_id) where type = 'user';
create unique index if not exists boards_team_unique_idx
  on public.boards(org_id, team_id) where type = 'team';
create index if not exists boards_org_type_idx on public.boards(org_id, type);

do $$
begin
  create table if not exists public.board_columns (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    board_id uuid not null references public.boards(id) on delete cascade,
    key text not null check (key in ('backlog', 'next', 'doing', 'waiting', 'done')),
    name text not null,
    sort_order int not null,
    wip_limit int,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (board_id, key)
  );
end $$;

create index if not exists board_columns_org_board_idx on public.board_columns(org_id, board_id, sort_order);

do $$
begin
  create table if not exists public.board_views (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    board_id uuid not null references public.boards(id) on delete cascade,
    name text not null,
    kind text not null check (kind in ('all', 'goal', 'unlinked', 'custom')),
    goal_id uuid references public.goals(id) on delete set null,
    filter_json jsonb,
    sort_order int not null,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
end $$;

create index if not exists board_views_org_board_idx on public.board_views(org_id, board_id, sort_order);
create index if not exists board_views_org_goal_idx on public.board_views(org_id, goal_id);

do $$
begin
  create table if not exists public.work_items (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    type text not null default 'task' check (type in ('task', 'project', 'subtask')),
    title text not null,
    description_json jsonb,
    description_text text,
    status_key text not null default 'backlog' check (status_key in ('backlog', 'next', 'doing', 'waiting', 'done')),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
    due_date date,
    start_date date,
    completed_at timestamptz,
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    team_id uuid references public.teams(id) on delete set null,
    created_by uuid not null references auth.users(id),
    updated_by uuid not null references auth.users(id),
    visibility text not null default 'team' check (visibility in ('org', 'team', 'private')),
    classification public.classification_level not null default 'normal',
    parent_work_item_id uuid references public.work_items(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
end $$;

create index if not exists work_items_org_owner_status_idx on public.work_items(org_id, owner_user_id, status_key);
create index if not exists work_items_org_due_date_idx on public.work_items(org_id, due_date);
create index if not exists work_items_org_parent_idx on public.work_items(org_id, parent_work_item_id);
create index if not exists work_items_org_team_idx on public.work_items(org_id, team_id);

do $$
begin
  create table if not exists public.work_item_board_state (
    org_id uuid not null references public.orgs(id) on delete cascade,
    board_id uuid not null references public.boards(id) on delete cascade,
    work_item_id uuid not null references public.work_items(id) on delete cascade,
    column_id uuid not null references public.board_columns(id) on delete cascade,
    position numeric(30, 15) not null,
    pinned boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (board_id, work_item_id)
  );
end $$;

create index if not exists work_item_board_state_lookup_idx
  on public.work_item_board_state(org_id, board_id, column_id, position);

do $$
begin
  create table if not exists public.work_item_assignees (
    org_id uuid not null references public.orgs(id) on delete cascade,
    work_item_id uuid not null references public.work_items(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    primary key (work_item_id, user_id)
  );
end $$;

create index if not exists work_item_assignees_org_user_idx on public.work_item_assignees(org_id, user_id);

do $$
begin
  create table if not exists public.work_item_watchers (
    org_id uuid not null references public.orgs(id) on delete cascade,
    work_item_id uuid not null references public.work_items(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    primary key (work_item_id, user_id)
  );
end $$;

create index if not exists work_item_watchers_org_user_idx on public.work_item_watchers(org_id, user_id);

do $$
begin
  create table if not exists public.work_item_goal_links (
    org_id uuid not null references public.orgs(id) on delete cascade,
    work_item_id uuid not null references public.work_items(id) on delete cascade,
    goal_id uuid not null references public.goals(id) on delete cascade,
    is_primary boolean not null default false,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    primary key (work_item_id, goal_id)
  );
end $$;

create unique index if not exists work_item_goal_links_primary_unique_idx
  on public.work_item_goal_links(work_item_id) where is_primary = true;
create index if not exists work_item_goal_links_org_goal_idx on public.work_item_goal_links(org_id, goal_id);

do $$
begin
  create table if not exists public.work_item_team_tags (
    org_id uuid not null references public.orgs(id) on delete cascade,
    work_item_id uuid not null references public.work_items(id) on delete cascade,
    team_id uuid not null references public.teams(id) on delete cascade,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    primary key (work_item_id, team_id)
  );
end $$;

create index if not exists work_item_team_tags_org_team_idx on public.work_item_team_tags(org_id, team_id);

do $$
begin
  create table if not exists public.work_item_missionary_tags (
    org_id uuid not null references public.orgs(id) on delete cascade,
    work_item_id uuid not null references public.work_items(id) on delete cascade,
    missionary_id uuid not null references public.missionaries(id) on delete cascade,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    primary key (work_item_id, missionary_id)
  );
end $$;

create index if not exists work_item_missionary_tags_org_missionary_idx on public.work_item_missionary_tags(org_id, missionary_id);

do $$
begin
  create table if not exists public.labels (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    name text not null,
    color_key text,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    unique (org_id, name)
  );
end $$;

do $$
begin
  create table if not exists public.label_links (
    org_id uuid not null references public.orgs(id) on delete cascade,
    label_id uuid not null references public.labels(id) on delete cascade,
    entity_type text not null check (entity_type in ('goal', 'work_item')),
    entity_id uuid not null,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    primary key (label_id, entity_type, entity_id)
  );
end $$;

create index if not exists label_links_org_entity_idx on public.label_links(org_id, entity_type, entity_id);

do $$
begin
  create table if not exists public.work_item_checklist_items (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    work_item_id uuid not null references public.work_items(id) on delete cascade,
    text text not null,
    is_done boolean not null default false,
    sort_order int not null,
    completed_at timestamptz,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
end $$;

create index if not exists work_item_checklist_org_item_idx on public.work_item_checklist_items(org_id, work_item_id, sort_order);

do $$
begin
  create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    entity_type text not null check (entity_type in ('goal', 'work_item')),
    entity_id uuid not null,
    body_json jsonb not null default '{}'::jsonb,
    body_text text,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now()
  );
end $$;

create index if not exists comments_org_entity_idx on public.comments(org_id, entity_type, entity_id, created_at desc);

do $$
begin
  create table if not exists public.activity_events (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    entity_type text not null check (entity_type in ('goal', 'work_item', 'board')),
    entity_id uuid,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now()
  );
end $$;

create index if not exists activity_events_org_entity_idx on public.activity_events(org_id, entity_type, entity_id, created_at desc);

create or replace view public.work_item_checklist_summary as
select
  work_item_id,
  count(*)::int as total,
  count(*) filter (where is_done)::int as done
from public.work_item_checklist_items
group by work_item_id;

create or replace function public.ensure_user_board(
  p_org_id uuid,
  p_owner_user_id uuid,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  select b.id into v_board_id
  from public.boards b
  where b.org_id = p_org_id
    and b.type = 'user'
    and b.owner_user_id = p_owner_user_id
  limit 1;

  if v_board_id is null then
    insert into public.boards (
      org_id,
      type,
      owner_user_id,
      name,
      is_default,
      created_by
    )
    values (
      p_org_id,
      'user',
      p_owner_user_id,
      'My Board',
      true,
      p_created_by
    )
    returning id into v_board_id;
  end if;

  return v_board_id;
end;
$$;

revoke all on function public.ensure_user_board(uuid, uuid, uuid) from public;
grant execute on function public.ensure_user_board(uuid, uuid, uuid) to authenticated;

create or replace function public.ensure_default_board_structure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.board_columns (org_id, board_id, key, name, sort_order)
  values
    (new.org_id, new.id, 'backlog', 'Backlog', 1000),
    (new.org_id, new.id, 'next', 'Next', 2000),
    (new.org_id, new.id, 'doing', 'Doing', 3000),
    (new.org_id, new.id, 'waiting', 'Waiting', 4000),
    (new.org_id, new.id, 'done', 'Done', 5000)
  on conflict (board_id, key) do nothing;

  insert into public.board_views (org_id, board_id, name, kind, sort_order, created_by)
  values
    (new.org_id, new.id, 'All work', 'all', 1000, new.created_by),
    (new.org_id, new.id, 'Unlinked', 'unlinked', 2000, new.created_by)
  on conflict do nothing;

  return new;
end;
$$;

do $$
begin
  create trigger boards_default_structure_trigger
  after insert on public.boards
  for each row execute function public.ensure_default_board_structure();
exception
  when duplicate_object then null;
end $$;

create or replace function public.pin_work_item_for_assignee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
  v_column_id uuid;
  v_position numeric(30,15);
  v_actor_user_id uuid;
begin
  select w.created_by into v_actor_user_id
  from public.work_items w
  where w.id = new.work_item_id;

  v_board_id := public.ensure_user_board(new.org_id, new.user_id, coalesce(v_actor_user_id, new.created_by));

  select c.id into v_column_id
  from public.board_columns c
  where c.board_id = v_board_id and c.key = 'backlog'
  limit 1;

  select coalesce(max(position), 0) + 1000 into v_position
  from public.work_item_board_state s
  where s.org_id = new.org_id
    and s.board_id = v_board_id
    and s.column_id = v_column_id;

  insert into public.work_item_board_state (
    org_id,
    board_id,
    work_item_id,
    column_id,
    position,
    pinned
  )
  values (
    new.org_id,
    v_board_id,
    new.work_item_id,
    v_column_id,
    v_position,
    true
  )
  on conflict (board_id, work_item_id) do update
  set
    column_id = excluded.column_id,
    position = excluded.position,
    pinned = true,
    updated_at = now();

  return new;
end;
$$;

do $$
begin
  create trigger work_item_assignees_pin_trigger
  after insert on public.work_item_assignees
  for each row execute function public.pin_work_item_for_assignee();
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create trigger goals_v2_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create trigger boards_v2_set_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create trigger board_columns_v2_set_updated_at
  before update on public.board_columns
  for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create trigger board_views_v2_set_updated_at
  before update on public.board_views
  for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create trigger work_items_v2_set_updated_at
  before update on public.work_items
  for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create trigger work_item_board_state_v2_set_updated_at
  before update on public.work_item_board_state
  for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create trigger work_item_checklist_v2_set_updated_at
  before update on public.work_item_checklist_items
  for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

