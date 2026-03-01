do $$
declare
  v_default_actor uuid;
begin
  select p.user_id
  into v_default_actor
  from public.profiles p
  where p.is_active = true
  order by p.created_at asc
  limit 1;

  if v_default_actor is null then
    return;
  end if;

  insert into public.boards (org_id, type, owner_user_id, name, is_default, created_by)
  select
    p.org_id,
    'user',
    p.user_id,
    'My Board',
    true,
    p.user_id
  from public.profiles p
  where p.is_active = true
  on conflict (org_id, owner_user_id) where type = 'user'
  do update set updated_at = now();

  insert into public.boards (org_id, type, team_id, name, is_default, created_by)
  select
    t.org_id,
    'team',
    t.id,
    t.name || ' Board',
    true,
    v_default_actor
  from public.teams t
  on conflict (org_id, team_id) where type = 'team'
  do update set updated_at = now();

  insert into public.board_columns (org_id, board_id, key, name, sort_order)
  select
    b.org_id,
    b.id,
    c.key,
    c.name,
    c.sort_order
  from public.boards b
  cross join (
    values
      ('backlog'::text, 'Backlog'::text, 1000),
      ('next'::text, 'Next'::text, 2000),
      ('doing'::text, 'Doing'::text, 3000),
      ('waiting'::text, 'Waiting'::text, 4000),
      ('done'::text, 'Done'::text, 5000)
  ) as c(key, name, sort_order)
  on conflict (board_id, key) do nothing;

  insert into public.board_views (org_id, board_id, name, kind, sort_order, created_by)
  select
    b.org_id,
    b.id,
    'All work',
    'all',
    1000,
    b.created_by
  from public.boards b
  where not exists (
    select 1
    from public.board_views v
    where v.board_id = b.id
      and v.kind = 'all'
  );

  insert into public.board_views (org_id, board_id, name, kind, sort_order, created_by)
  select
    b.org_id,
    b.id,
    'Unlinked',
    'unlinked',
    2000,
    b.created_by
  from public.boards b
  where not exists (
    select 1
    from public.board_views v
    where v.board_id = b.id
      and v.kind = 'unlinked'
  );

  insert into public.board_views (org_id, board_id, name, kind, goal_id, sort_order, created_by)
  select
    b.org_id,
    b.id,
    g.title,
    'goal',
    g.id,
    3000 + row_number() over (partition by b.id order by g.created_at),
    b.created_by
  from public.boards b
  join public.teams t on t.id = b.team_id
  join public.goals g
    on g.org_id = b.org_id
    and g.scope_type = 'team'
    and g.scope_team_id = t.id
    and g.status = 'active'
  where b.type = 'team'
    and not exists (
      select 1
      from public.board_views v
      where v.board_id = b.id
        and v.kind = 'goal'
        and v.goal_id = g.id
    );

  insert into public.work_item_board_state (
    org_id,
    board_id,
    work_item_id,
    column_id,
    position,
    pinned
  )
  select
    c.org_id,
    b.id as board_id,
    w.id as work_item_id,
    col.id as column_id,
    (coalesce(c.priority_rank, 0) + row_number() over (partition by b.id order by c.priority_rank, c.created_at))::numeric(30,15) * 1000,
    true
  from public.commitments c
  join public.work_items w
    on w.org_id = c.org_id
    and w.title = c.title
    and w.owner_user_id = c.owner_user_id
  join public.boards b
    on b.org_id = c.org_id
    and b.type = 'user'
    and b.owner_user_id = c.owner_user_id
  join public.board_columns col
    on col.board_id = b.id
    and col.key = 'backlog'
  where not exists (
    select 1
    from public.work_item_board_state s
    where s.board_id = b.id
      and s.work_item_id = w.id
  );
end $$;

