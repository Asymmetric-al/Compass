import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

type AuthorizationResult = {
  authorized: boolean;
  error: PostgrestError | null;
};

export async function isOrgAdmin(
  supabase: SupabaseClient,
  orgId: string,
  userId: string
): Promise<AuthorizationResult> {
  const { data, error } = await supabase
    .from("role_assignments")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .is("team_id", null)
    .in("role", ["co_ed", "admin"])
    .limit(1);

  return { authorized: Boolean(data && data.length > 0), error };
}

export async function isTeamDirector(
  supabase: SupabaseClient,
  orgId: string,
  teamId: string,
  userId: string
): Promise<AuthorizationResult> {
  const { data, error } = await supabase
    .from("role_assignments")
    .select("id")
    .eq("org_id", orgId)
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .in("role", ["department_director", "regional_director"])
    .limit(1);

  return { authorized: Boolean(data && data.length > 0), error };
}
