import { API_ERROR } from "@/lib/api/errors";
import { canEditWorkItem, canViewWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { addWorkItemAssigneeSchema } from "@/lib/validation/api";

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
    .from("work_item_assignees")
    .select("work_item_id, user_id, created_by, created_at")
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

  const parseResult = addWorkItemAssigneeSchema.safeParse(await request.json());
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

  const { data, error } = await context.supabase
    .from("work_item_assignees")
    .upsert(
      {
        org_id: context.orgId,
        work_item_id: workItemId,
        user_id: parseResult.data.userId,
        created_by: context.user.id,
      },
      { onConflict: "work_item_id,user_id" }
    )
    .select("work_item_id, user_id, created_by, created_at")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to add assignee.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
