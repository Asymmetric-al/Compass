do $$
declare
  v_org_id uuid;
begin
  insert into public.orgs (slug, name)
  values ('global-fellowship', 'Global Fellowship')
  on conflict (slug)
  do update set name = excluded.name
  returning id into v_org_id;

  insert into public.app_config (id, primary_org_id)
  values (1, v_org_id)
  on conflict (id)
  do update set primary_org_id = excluded.primary_org_id, updated_at = now();

  perform public.create_default_teams(v_org_id);
end $$;
