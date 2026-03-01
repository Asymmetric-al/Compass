import { API_ERROR } from "@/lib/api/errors";
import { canEditBoard, canViewBoard } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createBoardViewSchema } from "@/lib/validation/api";

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
    .from("board_views")
    .select(
      "id, org_id, board_id, name, kind, goal_id, filter_json, sort_order, created_by, created_at, updated_at"
    )
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

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = createBoardViewSchema.safeParse(await request.json());
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
  const { data: latestView } = await context.supabase
    .from("board_views")
    .select("sort_order")
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await context.supabase
    .from("board_views")
    .insert({
      org_id: context.orgId,
      board_id: boardId,
      name: payload.name,
      kind: payload.kind,
      goal_id: payload.kind === "goal" ? (payload.goalId ?? null) : null,
      filter_json:
        payload.kind === "custom" ? (payload.filterJson ?? null) : null,
      sort_order: payload.sortOrder ?? (latestView?.sort_order ?? 0) + 1000,
      created_by: context.user.id,
    })
    .select(
      "id, org_id, board_id, name, kind, goal_id, filter_json, sort_order, created_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create board view.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
