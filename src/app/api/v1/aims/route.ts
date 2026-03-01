import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin, isTeamDirector } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAimSchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const cycleId = url.searchParams.get("cycleId");
  const scope = url.searchParams.get("scope");
  const teamId = url.searchParams.get("teamId");
  const parentAimId = url.searchParams.get("parentAimId");

  let query = context.supabase
    .from("aims")
    .select(
      "id, cycle_id, scope, team_id, owner_user_id, parent_aim_id, title, narrative_json, scripture_anchor, why_this_matters, classification, sort_order"
    )
    .eq("org_id", context.orgId)
    .order("sort_order");

  if (cycleId) query = query.eq("cycle_id", cycleId);
  if (scope === "org" || scope === "team" || scope === "user") {
    query = query.eq("scope", scope);
  }
  if (teamId) query = query.eq("team_id", teamId);
  if (parentAimId) query = query.eq("parent_aim_id", parentAimId);

  const { data, error } = await query;
  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess(data ?? [], requestId);
}

export async function POST(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = createAimSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return apiError(
      {
        code: API_ERROR.BAD_REQUEST,
        message: parseResult.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
      requestId,
      400
    );
  }

  const payload = parseResult.data;
  const adminCheck = await isOrgAdmin(
    context.supabase,
    context.orgId,
    context.user.id
  );
  if (adminCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: adminCheck.error.message },
      requestId,
      500
    );
  }

  let authorized = adminCheck.authorized;
  if (!authorized && payload.scope === "team" && payload.teamId) {
    const directorCheck = await isTeamDirector(
      context.supabase,
      context.orgId,
      payload.teamId,
      context.user.id
    );
    if (directorCheck.error) {
      return apiError(
        {
          code: API_ERROR.INTERNAL_ERROR,
          message: directorCheck.error.message,
        },
        requestId,
        500
      );
    }
    authorized = directorCheck.authorized;
  }
  if (!authorized && payload.scope === "user") {
    authorized =
      !payload.ownerUserId || payload.ownerUserId === context.user.id;
  }

  if (!authorized) {
    return apiError(
      {
        code: API_ERROR.FORBIDDEN,
        message: "Insufficient permissions to create aim.",
      },
      requestId,
      403
    );
  }

  const { data, error } = await context.supabase
    .from("aims")
    .insert({
      org_id: context.orgId,
      cycle_id: payload.cycleId,
      scope: payload.scope,
      team_id: payload.teamId ?? null,
      owner_user_id: payload.ownerUserId ?? null,
      parent_aim_id: payload.parentAimId ?? null,
      title: payload.title,
      narrative_json: payload.narrativeJson ?? {},
      scripture_anchor: payload.scriptureAnchor ?? null,
      why_this_matters: payload.whyThisMatters ?? null,
      classification: payload.classification ?? "normal",
      created_by: context.user.id,
    })
    .select(
      "id, cycle_id, scope, team_id, owner_user_id, parent_aim_id, title, narrative_json, scripture_anchor, why_this_matters, classification, sort_order"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create aim.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
