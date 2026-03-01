import { API_ERROR } from "@/lib/api/errors";
import { canEditWorkItem, canViewWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateWorkItemSchema } from "@/lib/validation/api";

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

  const [
    { data: workItem, error: workItemError },
    { data: assignees, error: assigneesError },
    { data: watchers, error: watchersError },
    { data: goalLinks, error: goalLinksError },
    { data: checklist, error: checklistError },
  ] = await Promise.all([
    context.supabase
      .from("work_items")
      .select(
        "id, org_id, type, title, description_json, description_text, status_key, priority, due_date, start_date, completed_at, owner_user_id, team_id, created_by, updated_by, visibility, classification, parent_work_item_id, created_at, updated_at"
      )
      .eq("org_id", context.orgId)
      .eq("id", workItemId)
      .single(),
    context.supabase
      .from("work_item_assignees")
      .select("user_id")
      .eq("org_id", context.orgId)
      .eq("work_item_id", workItemId),
    context.supabase
      .from("work_item_watchers")
      .select("user_id")
      .eq("org_id", context.orgId)
      .eq("work_item_id", workItemId),
    context.supabase
      .from("work_item_goal_links")
      .select("goal_id, is_primary")
      .eq("org_id", context.orgId)
      .eq("work_item_id", workItemId),
    context.supabase
      .from("work_item_checklist_items")
      .select("id, text, is_done, sort_order, completed_at")
      .eq("org_id", context.orgId)
      .eq("work_item_id", workItemId)
      .order("sort_order"),
  ]);

  if (
    workItemError ||
    assigneesError ||
    watchersError ||
    goalLinksError ||
    checklistError ||
    !workItem
  ) {
    return apiError(
      {
        code: workItem ? API_ERROR.INTERNAL_ERROR : API_ERROR.NOT_FOUND,
        message:
          workItemError?.message ??
          assigneesError?.message ??
          watchersError?.message ??
          goalLinksError?.message ??
          checklistError?.message ??
          "Unable to load work item.",
      },
      requestId,
      workItem ? 500 : 404
    );
  }

  return apiSuccess(
    {
      ...workItem,
      assigneeUserIds: (assignees ?? []).map((row) => row.user_id),
      watcherUserIds: (watchers ?? []).map((row) => row.user_id),
      goals: goalLinks ?? [],
      checklist: checklist ?? [],
    },
    requestId
  );
}

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ workItemId: string }> }
) {
  const { workItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = updateWorkItemSchema.safeParse(await request.json());
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
  const updates: Record<string, unknown> = { updated_by: context.user.id };
  if (payload.type !== undefined) updates.type = payload.type;
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.descriptionJson !== undefined)
    updates.description_json = payload.descriptionJson;
  if (payload.descriptionText !== undefined)
    updates.description_text = payload.descriptionText;
  if (payload.statusKey !== undefined) updates.status_key = payload.statusKey;
  if (payload.priority !== undefined) updates.priority = payload.priority;
  if (payload.dueDate !== undefined) updates.due_date = payload.dueDate;
  if (payload.startDate !== undefined) updates.start_date = payload.startDate;
  if (payload.ownerUserId !== undefined)
    updates.owner_user_id = payload.ownerUserId;
  if (payload.teamId !== undefined) updates.team_id = payload.teamId;
  if (payload.visibility !== undefined) updates.visibility = payload.visibility;
  if (payload.classification !== undefined)
    updates.classification = payload.classification;
  if (payload.parentWorkItemId !== undefined)
    updates.parent_work_item_id = payload.parentWorkItemId;
  if (payload.statusKey !== undefined && payload.statusKey === "done") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await context.supabase
    .from("work_items")
    .update(updates)
    .eq("org_id", context.orgId)
    .eq("id", workItemId)
    .select(
      "id, org_id, type, title, description_json, description_text, status_key, priority, due_date, start_date, completed_at, owner_user_id, team_id, created_by, updated_by, visibility, classification, parent_work_item_id, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update work item.",
      },
      requestId,
      500
    );
  }

  if (
    payload.primaryGoalId !== undefined ||
    payload.linkedGoalIds !== undefined
  ) {
    const linkedGoalIds = new Set(payload.linkedGoalIds ?? []);
    if (payload.primaryGoalId) linkedGoalIds.add(payload.primaryGoalId);

    await context.supabase
      .from("work_item_goal_links")
      .delete()
      .eq("org_id", context.orgId)
      .eq("work_item_id", workItemId);

    if (linkedGoalIds.size > 0) {
      await context.supabase.from("work_item_goal_links").insert(
        Array.from(linkedGoalIds).map((goalId) => ({
          org_id: context.orgId,
          work_item_id: workItemId,
          goal_id: goalId,
          is_primary: payload.primaryGoalId === goalId,
          created_by: context.user.id,
        }))
      );
    }
  }

  return apiSuccess(data, requestId);
}

export async function DELETE(
  _request: Request,
  routeContext: { params: Promise<{ workItemId: string }> }
) {
  const { workItemId } = await routeContext.params;
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
    .from("work_items")
    .delete()
    .eq("org_id", context.orgId)
    .eq("id", workItemId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess({ ok: true }, requestId);
}
