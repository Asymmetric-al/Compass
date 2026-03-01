import { API_ERROR } from "@/lib/api/errors";
import { canEditBoard, canViewBoard } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateBoardColumnSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ boardId: string; columnId: string }> }
) {
  const { boardId, columnId } = await routeContext.params;
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
    .eq("id", columnId)
    .single();

  if (error || !data) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "Column not found." },
      requestId,
      404
    );
  }

  return apiSuccess(data, requestId);
}

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ boardId: string; columnId: string }> }
) {
  const { boardId, columnId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = updateBoardColumnSchema.safeParse(await request.json());
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

  const editCheck = await canEditBoard(context.supabase, boardId);
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
  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.sortOrder !== undefined) updates.sort_order = payload.sortOrder;
  if (payload.wipLimit !== undefined) updates.wip_limit = payload.wipLimit;

  const { data, error } = await context.supabase
    .from("board_columns")
    .update(updates)
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .eq("id", columnId)
    .select("id, org_id, board_id, key, name, sort_order, wip_limit")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update column.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId);
}
