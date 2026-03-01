import { API_ERROR } from "@/lib/api/errors";
import { canEditWorkItem, canViewWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { setWorkItemTagsSchema } from "@/lib/validation/api";

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

  const [{ data: teamTags }, { data: missionaryTags }, { data: labelLinks }] =
    await Promise.all([
      context.supabase
        .from("work_item_team_tags")
        .select("team_id")
        .eq("org_id", context.orgId)
        .eq("work_item_id", workItemId),
      context.supabase
        .from("work_item_missionary_tags")
        .select("missionary_id")
        .eq("org_id", context.orgId)
        .eq("work_item_id", workItemId),
      context.supabase
        .from("label_links")
        .select("label_id")
        .eq("org_id", context.orgId)
        .eq("entity_type", "work_item")
        .eq("entity_id", workItemId),
    ]);

  return apiSuccess(
    {
      teamIds: (teamTags ?? []).map((row) => row.team_id),
      missionaryIds: (missionaryTags ?? []).map((row) => row.missionary_id),
      labelIds: (labelLinks ?? []).map((row) => row.label_id),
    },
    requestId
  );
}

export async function PUT(
  request: Request,
  routeContext: { params: Promise<{ workItemId: string }> }
) {
  const { workItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = setWorkItemTagsSchema.safeParse(await request.json());
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
  await Promise.all([
    context.supabase
      .from("work_item_team_tags")
      .delete()
      .eq("org_id", context.orgId)
      .eq("work_item_id", workItemId),
    context.supabase
      .from("work_item_missionary_tags")
      .delete()
      .eq("org_id", context.orgId)
      .eq("work_item_id", workItemId),
    context.supabase
      .from("label_links")
      .delete()
      .eq("org_id", context.orgId)
      .eq("entity_type", "work_item")
      .eq("entity_id", workItemId),
  ]);

  if (payload.teamIds.length > 0) {
    await context.supabase.from("work_item_team_tags").insert(
      payload.teamIds.map((teamId) => ({
        org_id: context.orgId,
        work_item_id: workItemId,
        team_id: teamId,
        created_by: context.user.id,
      }))
    );
  }
  if (payload.missionaryIds.length > 0) {
    await context.supabase.from("work_item_missionary_tags").insert(
      payload.missionaryIds.map((missionaryId) => ({
        org_id: context.orgId,
        work_item_id: workItemId,
        missionary_id: missionaryId,
        created_by: context.user.id,
      }))
    );
  }
  if (payload.labelIds.length > 0) {
    await context.supabase.from("label_links").insert(
      payload.labelIds.map((labelId) => ({
        org_id: context.orgId,
        label_id: labelId,
        entity_type: "work_item",
        entity_id: workItemId,
        created_by: context.user.id,
      }))
    );
  }

  return apiSuccess(
    {
      teamIds: payload.teamIds,
      missionaryIds: payload.missionaryIds,
      labelIds: payload.labelIds,
    },
    requestId
  );
}
