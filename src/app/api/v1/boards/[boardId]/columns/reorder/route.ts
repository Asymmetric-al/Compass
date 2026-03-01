import { API_ERROR } from "@/lib/api/errors";
import { canEditBoard } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { reorderBoardColumnsSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = reorderBoardColumnsSchema.safeParse(await request.json());
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

  const updates = parseResult.data.orderedColumnIds.map((columnId, index) =>
    context.supabase
      .from("board_columns")
      .update({ sort_order: (index + 1) * 1000 })
      .eq("org_id", context.orgId)
      .eq("board_id", boardId)
      .eq("id", columnId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error);
  if (firstError?.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: firstError.error.message },
      requestId,
      500
    );
  }

  return apiSuccess(
    { updated: parseResult.data.orderedColumnIds.length },
    requestId
  );
}
