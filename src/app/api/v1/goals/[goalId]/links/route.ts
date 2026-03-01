import { API_ERROR } from "@/lib/api/errors";
import { canEditGoal, canViewGoal } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createGoalLinkSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ goalId: string }> }
) {
  const { goalId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const viewCheck = await canViewGoal(context.supabase, goalId);
  if (viewCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: viewCheck.error.message },
      requestId,
      500
    );
  }
  if (!viewCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Goal not accessible." },
      requestId,
      403
    );
  }

  const { data, error } = await context.supabase
    .from("goal_links")
    .select(
      "org_id, goal_id, upstream_goal_id, link_type, created_by, created_at"
    )
    .eq("org_id", context.orgId)
    .eq("goal_id", goalId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess(data ?? [], requestId);
}

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ goalId: string }> }
) {
  const { goalId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = createGoalLinkSchema.safeParse(await request.json());
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

  const viewCheck = await canViewGoal(context.supabase, payload.upstreamGoalId);
  if (viewCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: viewCheck.error.message },
      requestId,
      500
    );
  }
  if (!viewCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Upstream goal not accessible." },
      requestId,
      403
    );
  }

  const { data, error } = await context.supabase
    .from("goal_links")
    .upsert(
      {
        org_id: context.orgId,
        goal_id: goalId,
        upstream_goal_id: payload.upstreamGoalId,
        link_type: payload.linkType ?? "supports",
        created_by: context.user.id,
      },
      { onConflict: "goal_id,upstream_goal_id" }
    )
    .select(
      "org_id, goal_id, upstream_goal_id, link_type, created_by, created_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to link goals.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
