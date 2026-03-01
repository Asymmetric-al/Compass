import { API_ERROR } from "@/lib/api/errors";
import { canEditGoal } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateGoalSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ goalId: string }> }
) {
  const { goalId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const { data, error } = await context.supabase
    .from("goals")
    .select(
      "id, org_id, scope_type, scope_team_id, scope_user_id, title, description_json, description_text, status, timebox_type, start_date, end_date, parent_goal_id, visibility, classification, created_by, updated_by, created_at, updated_at"
    )
    .eq("org_id", context.orgId)
    .eq("id", goalId)
    .single();

  if (error || !data) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "Goal not found." },
      requestId,
      404
    );
  }

  return apiSuccess(data, requestId);
}

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ goalId: string }> }
) {
  const { goalId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = updateGoalSchema.safeParse(await request.json());
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

  const { data: existingGoal, error: existingGoalError } =
    await context.supabase
      .from("goals")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("id", goalId)
      .single();

  if (existingGoalError || !existingGoal) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "Goal not found." },
      requestId,
      404
    );
  }

  const editCheck = await canEditGoal(context.supabase, goalId);
  if (editCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: editCheck.error.message },
      requestId,
      500
    );
  }
  if (!editCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Insufficient permissions." },
      requestId,
      403
    );
  }

  const payload = parseResult.data;
  const updates: Record<string, unknown> = {
    updated_by: context.user.id,
  };
  if (payload.scopeType !== undefined) updates.scope_type = payload.scopeType;
  if (payload.scopeTeamId !== undefined)
    updates.scope_team_id = payload.scopeTeamId;
  if (payload.scopeUserId !== undefined)
    updates.scope_user_id = payload.scopeUserId;
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.descriptionJson !== undefined)
    updates.description_json = payload.descriptionJson;
  if (payload.descriptionText !== undefined)
    updates.description_text = payload.descriptionText;
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.timeboxType !== undefined)
    updates.timebox_type = payload.timeboxType;
  if (payload.startDate !== undefined) updates.start_date = payload.startDate;
  if (payload.endDate !== undefined) updates.end_date = payload.endDate;
  if (payload.parentGoalId !== undefined)
    updates.parent_goal_id = payload.parentGoalId;
  if (payload.visibility !== undefined) updates.visibility = payload.visibility;
  if (payload.classification !== undefined)
    updates.classification = payload.classification;

  const { data, error } = await context.supabase
    .from("goals")
    .update(updates)
    .eq("org_id", context.orgId)
    .eq("id", goalId)
    .select(
      "id, org_id, scope_type, scope_team_id, scope_user_id, title, description_json, description_text, status, timebox_type, start_date, end_date, parent_goal_id, visibility, classification, created_by, updated_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update goal.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId);
}
