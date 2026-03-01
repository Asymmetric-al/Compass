import { API_ERROR } from "@/lib/api/errors";
import { canEditBoard, canViewBoard } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateBoardSchema } from "@/lib/validation/api";

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

  const { data: board, error: boardError } = await context.supabase
    .from("boards")
    .select(
      "id, org_id, type, owner_user_id, team_id, name, is_default, created_by, created_at, updated_at"
    )
    .eq("org_id", context.orgId)
    .eq("id", boardId)
    .single();

  if (boardError || !board) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "Board not found." },
      requestId,
      404
    );
  }

  const [
    { data: columns, error: columnsError },
    { data: views, error: viewsError },
  ] = await Promise.all([
    context.supabase
      .from("board_columns")
      .select("id, org_id, board_id, key, name, sort_order, wip_limit")
      .eq("org_id", context.orgId)
      .eq("board_id", boardId)
      .order("sort_order"),
    context.supabase
      .from("board_views")
      .select(
        "id, org_id, board_id, name, kind, goal_id, filter_json, sort_order, created_by, created_at, updated_at"
      )
      .eq("org_id", context.orgId)
      .eq("board_id", boardId)
      .order("sort_order"),
  ]);

  if (columnsError || viewsError) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message:
          columnsError?.message ??
          viewsError?.message ??
          "Unable to load board.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(
    {
      board,
      columns: columns ?? [],
      views: views ?? [],
    },
    requestId
  );
}

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = updateBoardSchema.safeParse(await request.json());
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
  if (payload.isDefault !== undefined) updates.is_default = payload.isDefault;

  const { data, error } = await context.supabase
    .from("boards")
    .update(updates)
    .eq("org_id", context.orgId)
    .eq("id", boardId)
    .select(
      "id, org_id, type, owner_user_id, team_id, name, is_default, created_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update board.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId);
}
