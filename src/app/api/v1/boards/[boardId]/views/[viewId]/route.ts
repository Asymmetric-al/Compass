import { API_ERROR } from "@/lib/api/errors";
import { canEditBoard, canViewBoard } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateBoardViewSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ boardId: string; viewId: string }> }
) {
  const { boardId, viewId } = await routeContext.params;
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
    .from("board_views")
    .select(
      "id, org_id, board_id, name, kind, goal_id, filter_json, sort_order, created_by, created_at, updated_at"
    )
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .eq("id", viewId)
    .single();

  if (error || !data) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "View not found." },
      requestId,
      404
    );
  }

  return apiSuccess(data, requestId);
}

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ boardId: string; viewId: string }> }
) {
  const { boardId, viewId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = updateBoardViewSchema.safeParse(await request.json());
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
  if (payload.kind !== undefined) updates.kind = payload.kind;
  if (payload.goalId !== undefined) updates.goal_id = payload.goalId;
  if (payload.filterJson !== undefined)
    updates.filter_json = payload.filterJson;
  if (payload.sortOrder !== undefined) updates.sort_order = payload.sortOrder;

  const { data, error } = await context.supabase
    .from("board_views")
    .update(updates)
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .eq("id", viewId)
    .select(
      "id, org_id, board_id, name, kind, goal_id, filter_json, sort_order, created_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update board view.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId);
}

export async function DELETE(
  _request: Request,
  routeContext: { params: Promise<{ boardId: string; viewId: string }> }
) {
  const { boardId, viewId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

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

  const { error } = await context.supabase
    .from("board_views")
    .delete()
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .eq("id", viewId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess({ ok: true }, requestId);
}
