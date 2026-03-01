alter table public.orgs enable row level security;
alter table public.app_config enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.role_assignments enable row level security;
alter table public.reporting_lines enable row level security;
alter table public.cycles enable row level security;
alter table public.aims enable row level security;
alter table public.measures enable row level security;
alter table public.measure_updates enable row level security;
alter table public.commitments enable row level security;
alter table public.commitment_updates enable row level security;
alter table public.checkins enable row level security;
alter table public.stories enable row level security;
alter table public.prayer_items enable row level security;
alter table public.missionaries enable row level security;
alter table public.missionary_updates enable row level security;
alter table public.audit_log enable row level security;

create policy "orgs_select_for_members"
on public.orgs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.org_id = orgs.id
      and p.user_id = (select auth.uid())
      and p.is_active = true
  )
);

create policy "app_config_select_admin_only"
on public.app_config
for select
to authenticated
using (
  primary_org_id is not null
  and public.is_org_admin(primary_org_id)
);

create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_org_admin(org_id)
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "teams_select_for_org_members"
on public.teams
for select
to authenticated
using (public.is_org_member(org_id));

create policy "teams_write_admin_only"
on public.teams
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

create policy "team_memberships_select_self_admin_director"
on public.team_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_org_admin(org_id)
  or public.is_team_director(org_id, team_id)
);

create policy "team_memberships_write_admin_only"
on public.team_memberships
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

create policy "role_assignments_select_self_or_admin"
on public.role_assignments
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_org_admin(org_id)
);

create policy "role_assignments_write_admin_only"
on public.role_assignments
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

create policy "reporting_lines_select_admin_or_involved"
on public.reporting_lines
for select
to authenticated
using (
  public.is_org_admin(org_id)
  or manager_user_id = (select auth.uid())
  or report_user_id = (select auth.uid())
);

create policy "reporting_lines_write_admin_only"
on public.reporting_lines
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

create policy "cycles_select_org_members"
on public.cycles
for select
to authenticated
using (public.is_org_member(org_id));

create policy "cycles_write_admin_only"
on public.cycles
for all
to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

create policy "aims_select_with_classification"
on public.aims
for select
to authenticated
using (
  public.is_org_member(org_id)
  and (
    classification <> 'restricted'
    or public.is_org_admin(org_id)
    or (team_id is not null and public.is_team_member(team_id))
  )
);

create policy "aims_insert_admin_or_team_director"
on public.aims
for insert
to authenticated
with check (
  public.is_org_member(org_id)
  and (
    public.is_org_admin(org_id)
    or (scope = 'team' and team_id is not null and public.is_team_director(org_id, team_id))
    or (scope = 'user' and owner_user_id = (select auth.uid()))
  )
);

create policy "aims_update_admin_or_team_director"
on public.aims
for update
to authenticated
using (
  public.is_org_admin(org_id)
  or (scope = 'team' and team_id is not null and public.is_team_director(org_id, team_id))
  or (scope = 'user' and owner_user_id = (select auth.uid()))
)
with check (
  public.is_org_admin(org_id)
  or (scope = 'team' and team_id is not null and public.is_team_director(org_id, team_id))
  or (scope = 'user' and owner_user_id = (select auth.uid()))
);

create policy "measures_select_via_aim"
on public.measures
for select
to authenticated
using (
  public.is_org_member(org_id)
  and exists (
    select 1
    from public.aims a
    where a.id = measures.aim_id
      and a.org_id = measures.org_id
      and (
        a.classification <> 'restricted'
        or public.is_org_admin(a.org_id)
        or (a.team_id is not null and public.is_team_member(a.team_id))
      )
  )
);

create policy "measures_write_admin_or_director"
on public.measures
for all
to authenticated
using (
  exists (
    select 1
    from public.aims a
    where a.id = measures.aim_id
      and a.org_id = measures.org_id
      and (
        public.is_org_admin(a.org_id)
        or (a.team_id is not null and public.is_team_director(a.org_id, a.team_id))
      )
  )
)
with check (
  exists (
    select 1
    from public.aims a
    where a.id = measures.aim_id
      and a.org_id = measures.org_id
      and (
        public.is_org_admin(a.org_id)
        or (a.team_id is not null and public.is_team_director(a.org_id, a.team_id))
      )
  )
);

create policy "measure_updates_select_via_measure"
on public.measure_updates
for select
to authenticated
using (
  public.is_org_member(org_id)
  and exists (
    select 1
    from public.measures m
    where m.id = measure_updates.measure_id
      and m.org_id = measure_updates.org_id
  )
);

create policy "measure_updates_insert_admin_or_director"
on public.measure_updates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.measures m
    join public.aims a on a.id = m.aim_id
    where m.id = measure_updates.measure_id
      and m.org_id = measure_updates.org_id
      and (
        public.is_org_admin(a.org_id)
        or (a.team_id is not null and public.is_team_director(a.org_id, a.team_id))
      )
  )
);

create policy "commitments_select_scoped"
on public.commitments
for select
to authenticated
using (
  public.is_org_member(org_id)
  and (
    owner_user_id = (select auth.uid())
    or public.is_org_admin(org_id)
    or public.is_manager_of(org_id, owner_user_id)
    or (team_id is not null and public.is_team_director(org_id, team_id))
  )
  and (
    classification <> 'restricted'
    or public.is_org_admin(org_id)
    or (team_id is not null and public.is_team_member(team_id))
  )
);

create policy "commitments_insert_owner_or_admin"
on public.commitments
for insert
to authenticated
with check (
  public.is_org_member(org_id)
  and (
    owner_user_id = (select auth.uid())
    or public.is_org_admin(org_id)
  )
);

create policy "commitments_update_owner_admin_director"
on public.commitments
for update
to authenticated
using (
  owner_user_id = (select auth.uid())
  or public.is_org_admin(org_id)
  or (team_id is not null and public.is_team_director(org_id, team_id))
)
with check (
  owner_user_id = (select auth.uid())
  or public.is_org_admin(org_id)
  or (team_id is not null and public.is_team_director(org_id, team_id))
);

create policy "commitment_updates_select_via_commitment"
on public.commitment_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.commitments c
    where c.id = commitment_updates.commitment_id
      and c.org_id = commitment_updates.org_id
      and (
        c.owner_user_id = (select auth.uid())
        or public.is_org_admin(c.org_id)
        or public.is_manager_of(c.org_id, c.owner_user_id)
        or (c.team_id is not null and public.is_team_director(c.org_id, c.team_id))
      )
  )
);

create policy "commitment_updates_insert_scoped"
on public.commitment_updates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.commitments c
    where c.id = commitment_updates.commitment_id
      and c.org_id = commitment_updates.org_id
      and (
        c.owner_user_id = (select auth.uid())
        or public.is_org_admin(c.org_id)
        or (c.team_id is not null and public.is_team_director(c.org_id, c.team_id))
      )
  )
);

create policy "checkins_select_self_manager_admin"
on public.checkins
for select
to authenticated
using (
  public.is_org_member(org_id)
  and (
    user_id = (select auth.uid())
    or public.is_org_admin(org_id)
    or public.is_manager_of(org_id, user_id)
  )
);

create policy "checkins_insert_self"
on public.checkins
for insert
to authenticated
with check (
  public.is_org_member(org_id)
  and user_id = (select auth.uid())
);

create policy "checkins_update_self"
on public.checkins
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "stories_select_with_classification"
on public.stories
for select
to authenticated
using (
  public.is_org_member(org_id)
  and (
    classification <> 'restricted'
    or public.is_org_admin(org_id)
    or (team_id is not null and public.is_team_member(team_id))
  )
);

create policy "stories_insert_org_members"
on public.stories
for insert
to authenticated
with check (public.is_org_member(org_id));

create policy "stories_update_author_or_admin"
on public.stories
for update
to authenticated
using (
  author_user_id = (select auth.uid())
  or public.is_org_admin(org_id)
)
with check (
  author_user_id = (select auth.uid())
  or public.is_org_admin(org_id)
);

create policy "prayer_items_select_with_classification"
on public.prayer_items
for select
to authenticated
using (
  public.is_org_member(org_id)
  and (
    classification <> 'restricted'
    or public.is_org_admin(org_id)
    or (team_id is not null and public.is_team_member(team_id))
  )
);

create policy "prayer_items_insert_org_members"
on public.prayer_items
for insert
to authenticated
with check (public.is_org_member(org_id));

create policy "prayer_items_update_owner_admin_director"
on public.prayer_items
for update
to authenticated
using (
  owner_user_id = (select auth.uid())
  or public.is_org_admin(org_id)
  or (team_id is not null and public.is_team_director(org_id, team_id))
)
with check (
  owner_user_id = (select auth.uid())
  or public.is_org_admin(org_id)
  or (team_id is not null and public.is_team_director(org_id, team_id))
);

create policy "missionaries_select_admin_or_region_member"
on public.missionaries
for select
to authenticated
using (
  public.is_org_member(org_id)
  and (
    public.is_org_admin(org_id)
    or public.is_team_member(region_team_id)
  )
);

create policy "missionaries_insert_admin_or_region_director"
on public.missionaries
for insert
to authenticated
with check (
  public.is_org_member(org_id)
  and (
    public.is_org_admin(org_id)
    or public.is_team_director(org_id, region_team_id)
  )
);

create policy "missionaries_update_admin_or_region_director"
on public.missionaries
for update
to authenticated
using (
  public.is_org_admin(org_id)
  or public.is_team_director(org_id, region_team_id)
)
with check (
  public.is_org_admin(org_id)
  or public.is_team_director(org_id, region_team_id)
);

create policy "missionary_updates_select_admin_or_region_member"
on public.missionary_updates
for select
to authenticated
using (
  public.is_org_member(org_id)
  and exists (
    select 1
    from public.missionaries m
    where m.id = missionary_updates.missionary_id
      and m.org_id = missionary_updates.org_id
      and (
        public.is_org_admin(m.org_id)
        or public.is_team_member(m.region_team_id)
      )
  )
);

create policy "missionary_updates_insert_admin_or_region_director"
on public.missionary_updates
for insert
to authenticated
with check (
  public.is_org_member(org_id)
  and exists (
    select 1
    from public.missionaries m
    where m.id = missionary_updates.missionary_id
      and m.org_id = missionary_updates.org_id
      and (
        public.is_org_admin(m.org_id)
        or public.is_team_director(m.org_id, m.region_team_id)
      )
  )
);

create policy "missionary_updates_update_admin_or_region_director"
on public.missionary_updates
for update
to authenticated
using (
  exists (
    select 1
    from public.missionaries m
    where m.id = missionary_updates.missionary_id
      and m.org_id = missionary_updates.org_id
      and (
        public.is_org_admin(m.org_id)
        or public.is_team_director(m.org_id, m.region_team_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.missionaries m
    where m.id = missionary_updates.missionary_id
      and m.org_id = missionary_updates.org_id
      and (
        public.is_org_admin(m.org_id)
        or public.is_team_director(m.org_id, m.region_team_id)
      )
  )
);

create policy "audit_log_select_admin_only"
on public.audit_log
for select
to authenticated
using (public.is_org_admin(org_id));

create policy "audit_log_insert_org_members"
on public.audit_log
for insert
to authenticated
with check (public.is_org_member(org_id));
