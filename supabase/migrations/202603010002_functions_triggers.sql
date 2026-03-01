create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger orgs_set_updated_at
  before update on public.orgs
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger app_config_set_updated_at
  before update on public.app_config
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger cycles_set_updated_at
  before update on public.cycles
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger aims_set_updated_at
  before update on public.aims
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger measures_set_updated_at
  before update on public.measures
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger commitments_set_updated_at
  before update on public.commitments
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger checkins_set_updated_at
  before update on public.checkins
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger stories_set_updated_at
  before update on public.stories
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger prayer_items_set_updated_at
  before update on public.prayer_items
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger missionaries_set_updated_at
  before update on public.missionaries
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger missionary_updates_set_updated_at
  before update on public.missionary_updates
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

grant execute on function public.current_user_id() to authenticated;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.org_id = p_org_id
      and p.user_id = (select auth.uid())
      and p.is_active = true
  );
$$;

grant execute on function public.is_org_member(uuid) to authenticated;

create or replace function public.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.role_assignments ra
    where ra.org_id = p_org_id
      and ra.user_id = (select auth.uid())
      and ra.team_id is null
      and ra.role in ('co_ed', 'admin')
  );
$$;

revoke all on function public.is_org_admin(uuid) from public;
grant execute on function public.is_org_admin(uuid) to authenticated;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = p_team_id
      and tm.user_id = (select auth.uid())
  );
$$;

grant execute on function public.is_team_member(uuid) to authenticated;

create or replace function public.is_team_director(p_org_id uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.role_assignments ra
    where ra.org_id = p_org_id
      and ra.user_id = (select auth.uid())
      and ra.team_id = p_team_id
      and ra.role in ('department_director', 'regional_director')
  );
$$;

revoke all on function public.is_team_director(uuid, uuid) from public;
grant execute on function public.is_team_director(uuid, uuid) to authenticated;

create or replace function public.is_manager_of(p_org_id uuid, p_report_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.reporting_lines rl
    where rl.org_id = p_org_id
      and rl.manager_user_id = (select auth.uid())
      and rl.report_user_id = p_report_user_id
  );
$$;

grant execute on function public.is_manager_of(uuid, uuid) to authenticated;

create or replace function public.create_default_teams(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.teams (org_id, type, slug, name) values
    (p_org_id, 'department', 'operations', 'Operations'),
    (p_org_id, 'department', 'development', 'Development'),
    (p_org_id, 'department', 'training-prayer', 'Training/Prayer'),
    (p_org_id, 'department', 'mobilization', 'Mobilization'),
    (p_org_id, 'department', 'fruitfulness', 'Fruitfulness'),
    (p_org_id, 'department', 'member-care', 'Member Care')
  on conflict do nothing;

  insert into public.teams (org_id, type, slug, name) values
    (p_org_id, 'region', 'europe', 'Europe'),
    (p_org_id, 'region', 'north-africa', 'North Africa'),
    (p_org_id, 'region', 'middle-east', 'Middle East'),
    (p_org_id, 'region', 'central-asia', 'Central Asia'),
    (p_org_id, 'region', 'south-asia', 'South Asia'),
    (p_org_id, 'region', 'east-asia', 'East Asia')
  on conflict do nothing;
end;
$$;

revoke all on function public.create_default_teams(uuid) from public;
grant execute on function public.create_default_teams(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
  v_has_legacy_profile_id boolean;
begin
  select primary_org_id into v_org_id
  from public.app_config
  where id = 1;

  if v_org_id is null then
    return new;
  end if;

  v_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) into v_has_legacy_profile_id;

  if v_has_legacy_profile_id then
    insert into public.profiles (id, user_id, org_id, email, full_name, timezone, is_active)
    values (new.id, new.id, v_org_id, new.email, v_name, 'UTC', true)
    on conflict (user_id) do update
    set
      id = excluded.id,
      org_id = excluded.org_id,
      email = excluded.email,
      full_name = excluded.full_name,
      timezone = coalesce(public.profiles.timezone, excluded.timezone),
      is_active = coalesce(public.profiles.is_active, true),
      updated_at = now();
  else
    insert into public.profiles (user_id, org_id, email, full_name)
    values (new.id, v_org_id, new.email, v_name)
    on conflict (user_id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();
  end if;

  return new;
end;
$$;

do $$ begin
  create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
exception when duplicate_object then null; end $$;
