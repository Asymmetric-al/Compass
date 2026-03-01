import { API_ERROR } from "@/lib/api/errors";
import { canEditBoard, canEditWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { moveWorkItemSchema } from "@/lib/validation/api";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPositionForMove({
  supabase,
  orgId,
  boardId,
  prevWorkItemId,
  nextWorkItemId,
}: {
  supabase: SupabaseClient;
  orgId: string;
  boardId: string;
  prevWorkItemId: string | null;
  nextWorkItemId: string | null;
}) {
  if (prevWorkItemId && nextWorkItemId) {
    const [{ data: prev }, { data: next }] = await Promise.all([
      supabase
        .from("work_item_board_state")
        .select("position")
        .eq("org_id", orgId)
        .eq("board_id", boardId)
        .eq("work_item_id", prevWorkItemId)
        .single(),
      supabase
        .from("work_item_board_state")
        .select("position")
        .eq("org_id", orgId)
        .eq("board_id", boardId)
        .eq("work_item_id", nextWorkItemId)
        .single(),
    ]);

    if (prev && next && prev.position < next.position) {
      return (prev.position + next.position) / 2;
    }
  }

  if (prevWorkItemId) {
    const { data: prev } = await supabase
      .from("work_item_board_state")
      .select("position")
      .eq("org_id", orgId)
      .eq("board_id", boardId)
      .eq("work_item_id", prevWorkItemId)
      .single();

    return (prev?.position ?? 0) + 1000;
  }

  if (nextWorkItemId) {
    const { data: next } = await supabase
      .from("work_item_board_state")
      .select("position")
      .eq("org_id", orgId)
      .eq("board_id", boardId)
      .eq("work_item_id", nextWorkItemId)
      .single();

    return (next?.position ?? 1000) / 2;
  }

  return 1000;
}

export async function POST(
  request: Request,
  routeContext: {
    params: Promise<{ boardId: string; viewId: string; workItemId: string }>;
  }
) {
  const { boardId, workItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = moveWorkItemSchema.safeParse(await request.json());
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

  const [boardEditCheck, itemEditCheck] = await Promise.all([
    canEditBoard(context.supabase, boardId),
    canEditWorkItem(context.supabase, workItemId),
  ]);
  if (boardEditCheck.error || itemEditCheck.error) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message:
          boardEditCheck.error?.message ??
          itemEditCheck.error?.message ??
          "Authorization check failed.",
      },
      requestId,
      500
    );
  }
  if (!boardEditCheck.authorized || !itemEditCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Insufficient permissions." },
      requestId,
      403
    );
  }

  const payload = parseResult.data;
  const { data: column, error: columnError } = await context.supabase
    .from("board_columns")
    .select("id, key")
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .eq("id", payload.toColumnId)
    .single();

  if (columnError || !column) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "Destination column not found." },
      requestId,
      404
    );
  }

  const nextPosition = await getPositionForMove({
    supabase: context.supabase,
    orgId: context.orgId,
    boardId,
    prevWorkItemId: payload.prevWorkItemId,
    nextWorkItemId: payload.nextWorkItemId,
  });

  const { data: boardState, error: boardStateError } = await context.supabase
    .from("work_item_board_state")
    .upsert(
      {
        org_id: context.orgId,
        board_id: boardId,
        work_item_id: workItemId,
        column_id: payload.toColumnId,
        position: nextPosition,
        pinned: true,
      },
      { onConflict: "board_id,work_item_id" }
    )
    .select("org_id, board_id, work_item_id, column_id, position, pinned")
    .single();

  if (boardStateError || !boardState) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: boardStateError?.message ?? "Unable to move work item.",
      },
      requestId,
      500
    );
  }

  await context.supabase
    .from("work_items")
    .update({
      status_key: column.key,
      updated_by: context.user.id,
    })
    .eq("org_id", context.orgId)
    .eq("id", workItemId);

  return apiSuccess(boardState, requestId);
}
