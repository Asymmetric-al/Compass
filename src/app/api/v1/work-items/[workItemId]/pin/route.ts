import { API_ERROR } from "@/lib/api/errors";
import { canEditBoard, canViewWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { pinWorkItemSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ workItemId: string }> }
) {
  const { workItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = pinWorkItemSchema.safeParse(await request.json());
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

  const workItemCheck = await canViewWorkItem(context.supabase, workItemId);
  if (workItemCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: workItemCheck.error.message },
      requestId,
      500
    );
  }
  if (!workItemCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Work item not accessible." },
      requestId,
      403
    );
  }

  const boardId = parseResult.data.boardId;
  const boardEditCheck = await canEditBoard(context.supabase, boardId);
  if (boardEditCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: boardEditCheck.error.message },
      requestId,
      500
    );
  }
  if (!boardEditCheck.authorized) {
    return apiError(
      {
        code: API_ERROR.FORBIDDEN,
        message: "Insufficient permissions to modify board state.",
      },
      requestId,
      403
    );
  }

  const [{ data: column }, { data: latestState }] = await Promise.all([
    context.supabase
      .from("board_columns")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("board_id", boardId)
      .eq("key", "backlog")
      .single(),
    context.supabase
      .from("work_item_board_state")
      .select("position")
      .eq("org_id", context.orgId)
      .eq("board_id", boardId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!column) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "Backlog column not found." },
      requestId,
      404
    );
  }

  const { data, error } = await context.supabase
    .from("work_item_board_state")
    .upsert(
      {
        org_id: context.orgId,
        board_id: boardId,
        work_item_id: workItemId,
        column_id: column.id,
        position: (latestState?.position ?? 0) + 1000,
        pinned: true,
      },
      { onConflict: "board_id,work_item_id" }
    )
    .select("org_id, board_id, work_item_id, column_id, position, pinned")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to pin work item.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
