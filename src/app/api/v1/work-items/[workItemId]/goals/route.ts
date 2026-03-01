import { API_ERROR } from "@/lib/api/errors";
import { canEditWorkItem, canViewWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { linkWorkItemGoalSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ workItemId: string }> }
) {
  const { workItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const viewCheck = await canViewWorkItem(context.supabase, workItemId);
  if (viewCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: viewCheck.error.message },
      requestId,
      500
    );
  }
  if (!viewCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Work item not accessible." },
      requestId,
      403
    );
  }

  const { data, error } = await context.supabase
    .from("work_item_goal_links")
    .select("work_item_id, goal_id, is_primary, created_by, created_at")
    .eq("org_id", context.orgId)
    .eq("work_item_id", workItemId);

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
  routeContext: { params: Promise<{ workItemId: string }> }
) {
  const { workItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = linkWorkItemGoalSchema.safeParse(await request.json());
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

  const payload = parseResult.data;
  if (payload.isPrimary) {
    await context.supabase
      .from("work_item_goal_links")
      .update({ is_primary: false })
      .eq("org_id", context.orgId)
      .eq("work_item_id", workItemId);
  }

  const { data, error } = await context.supabase
    .from("work_item_goal_links")
    .upsert(
      {
        org_id: context.orgId,
        work_item_id: workItemId,
        goal_id: payload.goalId,
        is_primary: payload.isPrimary ?? false,
        created_by: context.user.id,
      },
      { onConflict: "work_item_id,goal_id" }
    )
    .select("work_item_id, goal_id, is_primary, created_by, created_at")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to link goal.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
