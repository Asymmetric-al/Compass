import { API_ERROR } from "@/lib/api/errors";
import { canEditWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  _request: Request,
  routeContext: {
    params: Promise<{ workItemId: string; userId: string }>;
  }
) {
  const { workItemId, userId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const editCheck = await canEditWorkItem(context.supabase, workItemId);
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
    .from("work_item_assignees")
    .delete()
    .eq("org_id", context.orgId)
    .eq("work_item_id", workItemId)
    .eq("user_id", userId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess({ ok: true }, requestId);
}
