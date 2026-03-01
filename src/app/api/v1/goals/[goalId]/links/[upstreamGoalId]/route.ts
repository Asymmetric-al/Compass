import { API_ERROR } from "@/lib/api/errors";
import { canEditGoal } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  _request: Request,
  routeContext: {
    params: Promise<{ goalId: string; upstreamGoalId: string }>;
  }
) {
  const { goalId, upstreamGoalId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

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

  const { error } = await context.supabase
    .from("goal_links")
    .delete()
    .eq("org_id", context.orgId)
    .eq("goal_id", goalId)
    .eq("upstream_goal_id", upstreamGoalId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess({ ok: true }, requestId);
}
