create or replace function public.can_view_board(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards b
    where b.id = p_board_id
      and public.is_org_member(b.org_id)
      and (
        public.is_org_admin(b.org_id)
        or (b.type = 'user' and b.owner_user_id = (select auth.uid()))
        or (b.type = 'team' and b.team_id is not null and public.is_team_member(b.team_id))
      )
  );
$$;

revoke all on function public.can_view_board(uuid) from public;
grant execute on function public.can_view_board(uuid) to authenticated;

create or replace function public.can_edit_board(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards b
    where b.id = p_board_id
      and (
        public.is_org_admin(b.org_id)
        or (b.type = 'user' and b.owner_user_id = (select auth.uid()))
        or (b.type = 'team' and b.team_id is not null and public.is_team_director(b.org_id, b.team_id))
      )
  );
$$;

revoke all on function public.can_edit_board(uuid) from public;
grant execute on function public.can_edit_board(uuid) to authenticated;

create or replace function public.can_view_goal(p_goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.goals g
    where g.id = p_goal_id
      and public.is_org_member(g.org_id)
      and (
        g.visibility = 'org'
        or (
          g.visibility = 'team'
          and (
            public.is_org_admin(g.org_id)
            or (g.scope_team_id is not null and public.is_team_member(g.scope_team_id))
            or g.scope_user_id = (select auth.uid())
            or g.created_by = (select auth.uid())
          )
        )
        or (
          g.visibility = 'private'
          and (
            public.is_org_admin(g.org_id)
            or g.scope_user_id = (select auth.uid())
            or g.created_by = (select auth.uid())
          )
        )
      )
      and (
        g.classification <> 'restricted'
        or public.is_org_admin(g.org_id)
        or (g.scope_team_id is not null and public.is_team_member(g.scope_team_id))
        or g.scope_user_id = (select auth.uid())
      )
  );
$$;

revoke all on function public.can_view_goal(uuid) from public;
grant execute on function public.can_view_goal(uuid) to authenticated;

create or replace function public.can_edit_goal(p_goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.goals g
    where g.id = p_goal_id
      and (
        public.is_org_admin(g.org_id)
        or (
          g.scope_type = 'team'
          and g.scope_team_id is not null
          and public.is_team_director(g.org_id, g.scope_team_id)
        )
        or (
          g.scope_type = 'user'
          and (
            g.scope_user_id = (select auth.uid())
            or g.created_by = (select auth.uid())
          )
        )
      )
  );
$$;

revoke all on function public.can_edit_goal(uuid) from public;
grant execute on function public.can_edit_goal(uuid) to authenticated;

create or replace function public.is_work_item_participant(p_work_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.work_items w
    where w.id = p_work_item_id
      and w.owner_user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.work_item_assignees a
    where a.work_item_id = p_work_item_id
      and a.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.work_item_watchers w
    where w.work_item_id = p_work_item_id
      and w.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_work_item_participant(uuid) from public;
grant execute on function public.is_work_item_participant(uuid) to authenticated;

create or replace function public.can_view_work_item(p_work_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.work_items w
    where w.id = p_work_item_id
      and public.is_org_member(w.org_id)
      and (
        w.visibility = 'org'
        or (
          w.visibility = 'team'
          and (
            public.is_org_admin(w.org_id)
            or (w.team_id is not null and public.is_team_member(w.team_id))
            or public.is_work_item_participant(w.id)
          )
        )
        or (
          w.visibility = 'private'
          and (
            public.is_org_admin(w.org_id)
            or public.is_work_item_participant(w.id)
          )
        )
      )
      and (
        w.classification <> 'restricted'
        or public.is_org_admin(w.org_id)
        or (w.team_id is not null and public.is_team_member(w.team_id))
        or public.is_work_item_participant(w.id)
      )
  );
$$;

revoke all on function public.can_view_work_item(uuid) from public;
grant execute on function public.can_view_work_item(uuid) to authenticated;

create or replace function public.can_edit_work_item(p_work_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.work_items w
    where w.id = p_work_item_id
      and (
        public.is_org_admin(w.org_id)
        or w.owner_user_id = (select auth.uid())
        or exists (
          select 1
          from public.work_item_assignees a
          where a.work_item_id = w.id
            and a.user_id = (select auth.uid())
        )
        or (w.team_id is not null and public.is_team_director(w.org_id, w.team_id))
      )
  );
$$;

revoke all on function public.can_edit_work_item(uuid) from public;
grant execute on function public.can_edit_work_item(uuid) to authenticated;

alter table public.goals enable row level security;
alter table public.goal_links enable row level security;
alter table public.goal_measures enable row level security;
alter table public.goal_measure_updates enable row level security;
alter table public.boards enable row level security;
alter table public.board_columns enable row level security;
alter table public.board_views enable row level security;
alter table public.work_items enable row level security;
alter table public.work_item_board_state enable row level security;
alter table public.work_item_assignees enable row level security;
alter table public.work_item_watchers enable row level security;
alter table public.work_item_goal_links enable row level security;
alter table public.work_item_team_tags enable row level security;
alter table public.work_item_missionary_tags enable row level security;
alter table public.labels enable row level security;
alter table public.label_links enable row level security;
alter table public.work_item_checklist_items enable row level security;
alter table public.comments enable row level security;
alter table public.activity_events enable row level security;

drop policy if exists goals_v2_select on public.goals;
create policy goals_v2_select on public.goals
for select to authenticated
using ((select public.can_view_goal(id)));

drop policy if exists goals_v2_insert on public.goals;
create policy goals_v2_insert on public.goals
for insert to authenticated
with check (
  public.is_org_member(org_id)
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (
    public.is_org_admin(org_id)
    or (
      scope_type = 'team'
      and scope_team_id is not null
      and public.is_team_director(org_id, scope_team_id)
    )
    or (
      scope_type = 'user'
      and (
        scope_user_id = (select auth.uid())
        or scope_user_id is null
      )
    )
  )
);

drop policy if exists goals_v2_update on public.goals;
create policy goals_v2_update on public.goals
for update to authenticated
using ((select public.can_edit_goal(id)))
with check ((select public.can_edit_goal(id)));

drop policy if exists goals_v2_delete on public.goals;
create policy goals_v2_delete on public.goals
for delete to authenticated
using ((select public.can_edit_goal(id)));

drop policy if exists goal_links_v2_select on public.goal_links;
create policy goal_links_v2_select on public.goal_links
for select to authenticated
using (
  (select public.can_view_goal(goal_id))
  and (select public.can_view_goal(upstream_goal_id))
);

drop policy if exists goal_links_v2_write on public.goal_links;
create policy goal_links_v2_write on public.goal_links
for all to authenticated
using ((select public.can_edit_goal(goal_id)))
with check (
  (select public.can_edit_goal(goal_id))
  and (select public.can_view_goal(upstream_goal_id))
);

drop policy if exists goal_measures_v2_select on public.goal_measures;
create policy goal_measures_v2_select on public.goal_measures
for select to authenticated
using ((select public.can_view_goal(goal_id)));

drop policy if exists goal_measures_v2_write on public.goal_measures;
create policy goal_measures_v2_write on public.goal_measures
for all to authenticated
using ((select public.can_edit_goal(goal_id)))
with check ((select public.can_edit_goal(goal_id)));

drop policy if exists goal_measure_updates_v2_select on public.goal_measure_updates;
create policy goal_measure_updates_v2_select on public.goal_measure_updates
for select to authenticated
using (
  exists (
    select 1
    from public.goal_measures gm
    where gm.id = goal_measure_id
      and (select public.can_view_goal(gm.goal_id))
  )
);

drop policy if exists goal_measure_updates_v2_write on public.goal_measure_updates;
create policy goal_measure_updates_v2_write on public.goal_measure_updates
for all to authenticated
using (
  exists (
    select 1
    from public.goal_measures gm
    where gm.id = goal_measure_id
      and (select public.can_edit_goal(gm.goal_id))
  )
)
with check (
  exists (
    select 1
    from public.goal_measures gm
    where gm.id = goal_measure_id
      and (select public.can_edit_goal(gm.goal_id))
  )
);

drop policy if exists boards_v2_select on public.boards;
create policy boards_v2_select on public.boards
for select to authenticated
using ((select public.can_view_board(id)));

drop policy if exists boards_v2_insert on public.boards;
create policy boards_v2_insert on public.boards
for insert to authenticated
with check (
  public.is_org_member(org_id)
  and created_by = (select auth.uid())
  and (
    public.is_org_admin(org_id)
    or (type = 'user' and owner_user_id = (select auth.uid()))
  )
);

drop policy if exists boards_v2_update on public.boards;
create policy boards_v2_update on public.boards
for update to authenticated
using ((select public.can_edit_board(id)))
with check ((select public.can_edit_board(id)));

drop policy if exists boards_v2_delete on public.boards;
create policy boards_v2_delete on public.boards
for delete to authenticated
using ((select public.can_edit_board(id)));

drop policy if exists board_columns_v2_select on public.board_columns;
create policy board_columns_v2_select on public.board_columns
for select to authenticated
using ((select public.can_view_board(board_id)));

drop policy if exists board_columns_v2_write on public.board_columns;
create policy board_columns_v2_write on public.board_columns
for all to authenticated
using ((select public.can_edit_board(board_id)))
with check ((select public.can_edit_board(board_id)));

drop policy if exists board_views_v2_select on public.board_views;
create policy board_views_v2_select on public.board_views
for select to authenticated
using ((select public.can_view_board(board_id)));

drop policy if exists board_views_v2_write on public.board_views;
create policy board_views_v2_write on public.board_views
for all to authenticated
using ((select public.can_edit_board(board_id)))
with check (
  (select public.can_edit_board(board_id))
  and (goal_id is null or (select public.can_view_goal(goal_id)))
);

drop policy if exists work_items_v2_select on public.work_items;
create policy work_items_v2_select on public.work_items
for select to authenticated
using ((select public.can_view_work_item(id)));

drop policy if exists work_items_v2_insert on public.work_items;
create policy work_items_v2_insert on public.work_items
for insert to authenticated
with check (
  public.is_org_member(org_id)
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (
    owner_user_id = (select auth.uid())
    or public.is_org_admin(org_id)
    or (team_id is not null and public.is_team_director(org_id, team_id))
  )
);

drop policy if exists work_items_v2_update on public.work_items;
create policy work_items_v2_update on public.work_items
for update to authenticated
using ((select public.can_edit_work_item(id)))
with check ((select public.can_edit_work_item(id)));

drop policy if exists work_items_v2_delete on public.work_items;
create policy work_items_v2_delete on public.work_items
for delete to authenticated
using ((select public.can_edit_work_item(id)));

drop policy if exists work_item_board_state_v2_select on public.work_item_board_state;
create policy work_item_board_state_v2_select on public.work_item_board_state
for select to authenticated
using (
  (select public.can_view_board(board_id))
  and (select public.can_view_work_item(work_item_id))
);

drop policy if exists work_item_board_state_v2_write on public.work_item_board_state;
create policy work_item_board_state_v2_write on public.work_item_board_state
for all to authenticated
using (
  (select public.can_edit_board(board_id))
  and (select public.can_edit_work_item(work_item_id))
)
with check (
  (select public.can_edit_board(board_id))
  and (select public.can_edit_work_item(work_item_id))
);

drop policy if exists work_item_assignees_v2_select on public.work_item_assignees;
create policy work_item_assignees_v2_select on public.work_item_assignees
for select to authenticated
using ((select public.can_view_work_item(work_item_id)));

drop policy if exists work_item_assignees_v2_write on public.work_item_assignees;
create policy work_item_assignees_v2_write on public.work_item_assignees
for all to authenticated
using ((select public.can_edit_work_item(work_item_id)))
with check ((select public.can_edit_work_item(work_item_id)));

drop policy if exists work_item_watchers_v2_select on public.work_item_watchers;
create policy work_item_watchers_v2_select on public.work_item_watchers
for select to authenticated
using ((select public.can_view_work_item(work_item_id)));

drop policy if exists work_item_watchers_v2_write on public.work_item_watchers;
create policy work_item_watchers_v2_write on public.work_item_watchers
for all to authenticated
using ((select public.can_edit_work_item(work_item_id)))
with check ((select public.can_edit_work_item(work_item_id)));

drop policy if exists work_item_goal_links_v2_select on public.work_item_goal_links;
create policy work_item_goal_links_v2_select on public.work_item_goal_links
for select to authenticated
using (
  (select public.can_view_work_item(work_item_id))
  and (select public.can_view_goal(goal_id))
);

drop policy if exists work_item_goal_links_v2_write on public.work_item_goal_links;
create policy work_item_goal_links_v2_write on public.work_item_goal_links
for all to authenticated
using ((select public.can_edit_work_item(work_item_id)))
with check (
  (select public.can_edit_work_item(work_item_id))
  and (select public.can_view_goal(goal_id))
);

drop policy if exists work_item_team_tags_v2_select on public.work_item_team_tags;
create policy work_item_team_tags_v2_select on public.work_item_team_tags
for select to authenticated
using ((select public.can_view_work_item(work_item_id)));

drop policy if exists work_item_team_tags_v2_write on public.work_item_team_tags;
create policy work_item_team_tags_v2_write on public.work_item_team_tags
for all to authenticated
using ((select public.can_edit_work_item(work_item_id)))
with check ((select public.can_edit_work_item(work_item_id)));

drop policy if exists work_item_missionary_tags_v2_select on public.work_item_missionary_tags;
create policy work_item_missionary_tags_v2_select on public.work_item_missionary_tags
for select to authenticated
using ((select public.can_view_work_item(work_item_id)));

drop policy if exists work_item_missionary_tags_v2_write on public.work_item_missionary_tags;
create policy work_item_missionary_tags_v2_write on public.work_item_missionary_tags
for all to authenticated
using ((select public.can_edit_work_item(work_item_id)))
with check ((select public.can_edit_work_item(work_item_id)));

drop policy if exists labels_v2_select on public.labels;
create policy labels_v2_select on public.labels
for select to authenticated
using (public.is_org_member(org_id));

drop policy if exists labels_v2_write on public.labels;
create policy labels_v2_write on public.labels
for all to authenticated
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists label_links_v2_select on public.label_links;
create policy label_links_v2_select on public.label_links
for select to authenticated
using (
  (
    entity_type = 'goal'
    and (select public.can_view_goal(entity_id))
  )
  or (
    entity_type = 'work_item'
    and (select public.can_view_work_item(entity_id))
  )
);

drop policy if exists label_links_v2_write on public.label_links;
create policy label_links_v2_write on public.label_links
for all to authenticated
using (
  (
    entity_type = 'goal'
    and (select public.can_edit_goal(entity_id))
  )
  or (
    entity_type = 'work_item'
    and (select public.can_edit_work_item(entity_id))
  )
)
with check (
  (
    entity_type = 'goal'
    and (select public.can_edit_goal(entity_id))
  )
  or (
    entity_type = 'work_item'
    and (select public.can_edit_work_item(entity_id))
  )
);

drop policy if exists work_item_checklist_items_v2_select on public.work_item_checklist_items;
create policy work_item_checklist_items_v2_select on public.work_item_checklist_items
for select to authenticated
using ((select public.can_view_work_item(work_item_id)));

drop policy if exists work_item_checklist_items_v2_write on public.work_item_checklist_items;
create policy work_item_checklist_items_v2_write on public.work_item_checklist_items
for all to authenticated
using ((select public.can_edit_work_item(work_item_id)))
with check ((select public.can_edit_work_item(work_item_id)));

drop policy if exists comments_v2_select on public.comments;
create policy comments_v2_select on public.comments
for select to authenticated
using (
  (
    entity_type = 'goal'
    and (select public.can_view_goal(entity_id))
  )
  or (
    entity_type = 'work_item'
    and (select public.can_view_work_item(entity_id))
  )
);

drop policy if exists comments_v2_write on public.comments;
create policy comments_v2_write on public.comments
for all to authenticated
using (
  (
    entity_type = 'goal'
    and (select public.can_edit_goal(entity_id))
  )
  or (
    entity_type = 'work_item'
    and (select public.can_edit_work_item(entity_id))
  )
)
with check (
  created_by = (select auth.uid())
  and (
    (
      entity_type = 'goal'
      and (select public.can_edit_goal(entity_id))
    )
    or (
      entity_type = 'work_item'
      and (select public.can_edit_work_item(entity_id))
    )
  )
);

drop policy if exists activity_events_v2_select on public.activity_events;
create policy activity_events_v2_select on public.activity_events
for select to authenticated
using (
  (
    entity_type = 'goal'
    and entity_id is not null
    and (select public.can_view_goal(entity_id))
  )
  or (
    entity_type = 'work_item'
    and entity_id is not null
    and (select public.can_view_work_item(entity_id))
  )
  or (
    entity_type = 'board'
    and entity_id is not null
    and (select public.can_view_board(entity_id))
  )
);

drop policy if exists activity_events_v2_insert on public.activity_events;
create policy activity_events_v2_insert on public.activity_events
for insert to authenticated
with check (
  public.is_org_member(org_id)
  and (created_by = (select auth.uid()) or created_by is null)
);

