import { API_ERROR } from "@/lib/api/errors";
import { canViewBoard } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const viewCheck = await canViewBoard(context.supabase, boardId);
  if (viewCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: viewCheck.error.message },
      requestId,
      500
    );
  }
  if (!viewCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Board not accessible." },
      requestId,
      403
    );
  }

  const { data, error } = await context.supabase
    .from("board_columns")
    .select("id, org_id, board_id, key, name, sort_order, wip_limit")
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .order("sort_order");

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess(data ?? [], requestId);
}
