import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin, isTeamDirector } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateAimSchema } from "@/lib/validation/api";

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ aimId: string }> }
) {
  const { aimId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = updateAimSchema.safeParse(await request.json());
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

  const { data: existingAim, error: existingAimError } = await context.supabase
    .from("aims")
    .select("id, scope, team_id, owner_user_id")
    .eq("org_id", context.orgId)
    .eq("id", aimId)
    .single();

  if (existingAimError || !existingAim) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "Aim not found." },
      requestId,
      404
    );
  }

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
  if (!authorized && existingAim.team_id) {
    const directorCheck = await isTeamDirector(
      context.supabase,
      context.orgId,
      existingAim.team_id as string,
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
  if (!authorized && existingAim.scope === "user") {
    authorized = existingAim.owner_user_id === context.user.id;
  }

  if (!authorized) {
    return apiError(
      {
        code: API_ERROR.FORBIDDEN,
        message: "Insufficient permissions to edit aim.",
      },
      requestId,
      403
    );
  }

  const payload = parseResult.data;
  const { data, error } = await context.supabase
    .from("aims")
    .update({
      cycle_id: payload.cycleId,
      scope: payload.scope,
      team_id: payload.teamId,
      owner_user_id: payload.ownerUserId,
      parent_aim_id: payload.parentAimId,
      title: payload.title,
      narrative_json: payload.narrativeJson,
      scripture_anchor: payload.scriptureAnchor,
      why_this_matters: payload.whyThisMatters,
      classification: payload.classification,
    })
    .eq("org_id", context.orgId)
    .eq("id", aimId)
    .select(
      "id, cycle_id, scope, team_id, owner_user_id, parent_aim_id, title, narrative_json, scripture_anchor, why_this_matters, classification, sort_order"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update aim.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId);
}
