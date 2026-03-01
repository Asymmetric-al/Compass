import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const { requestId, context, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const { data: roles, error: rolesError } = await context.supabase
    .from("role_assignments")
    .select("role, team_id")
    .eq("org_id", context.orgId)
    .eq("user_id", context.user.id);

  if (rolesError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: rolesError.message },
      requestId,
      500
    );
  }

  const { data: teams, error: teamsError } = await context.supabase
    .from("team_memberships")
    .select("team_id, is_primary, teams(id, type, slug, name)")
    .eq("org_id", context.orgId)
    .eq("user_id", context.user.id);

  if (teamsError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: teamsError.message },
      requestId,
      500
    );
  }

  const { data: activeCycles } = await context.supabase
    .from("cycles")
    .select("id, type")
    .eq("org_id", context.orgId)
    .eq("is_active", true);

  const annualCycle = activeCycles?.find((cycle) => cycle.type === "annual");
  const quarterlyCycle = activeCycles?.find(
    (cycle) => cycle.type === "quarterly"
  );

  return apiSuccess(
    {
      userId: context.user.id,
      email: context.user.email,
      fullName:
        context.user.user_metadata?.full_name ??
        context.user.user_metadata?.name ??
        null,
      orgId: context.orgId,
      roles: roles ?? [],
      teams: teams ?? [],
      activeAnnualCycleId: annualCycle?.id ?? null,
      activeQuarterlyCycleId: quarterlyCycle?.id ?? null,
    },
    requestId
  );
}
