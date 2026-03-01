import { API_ERROR } from "@/lib/api/errors";
import { canEditWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateChecklistItemSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: Request,
  routeContext: {
    params: Promise<{ workItemId: string; checklistItemId: string }>;
  }
) {
  const { workItemId, checklistItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = updateChecklistItemSchema.safeParse(await request.json());
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
  const updates: Record<string, unknown> = {};
  if (payload.text !== undefined) updates.text = payload.text;
  if (payload.isDone !== undefined) {
    updates.is_done = payload.isDone;
    updates.completed_at = payload.isDone ? new Date().toISOString() : null;
  }
  if (payload.sortOrder !== undefined) updates.sort_order = payload.sortOrder;

  const { data, error } = await context.supabase
    .from("work_item_checklist_items")
    .update(updates)
    .eq("org_id", context.orgId)
    .eq("work_item_id", workItemId)
    .eq("id", checklistItemId)
    .select(
      "id, org_id, work_item_id, text, is_done, sort_order, completed_at, created_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update checklist item.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId);
}

export async function DELETE(
  _request: Request,
  routeContext: {
    params: Promise<{ workItemId: string; checklistItemId: string }>;
  }
) {
  const { workItemId, checklistItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

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

  const { error } = await context.supabase
    .from("work_item_checklist_items")
    .delete()
    .eq("org_id", context.orgId)
    .eq("work_item_id", workItemId)
    .eq("id", checklistItemId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess({ ok: true }, requestId);
}
