import { API_ERROR } from "@/lib/api/errors";
import { canEditWorkItem, canViewWorkItem } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createChecklistItemSchema } from "@/lib/validation/api";

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
    .from("work_item_checklist_items")
    .select(
      "id, org_id, work_item_id, text, is_done, sort_order, completed_at, created_by, created_at, updated_at"
    )
    .eq("org_id", context.orgId)
    .eq("work_item_id", workItemId)
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
  routeContext: { params: Promise<{ workItemId: string }> }
) {
  const { workItemId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = createChecklistItemSchema.safeParse(await request.json());
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
  const { data: latest } = await context.supabase
    .from("work_item_checklist_items")
    .select("sort_order")
    .eq("org_id", context.orgId)
    .eq("work_item_id", workItemId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await context.supabase
    .from("work_item_checklist_items")
    .insert({
      org_id: context.orgId,
      work_item_id: workItemId,
      text: payload.text,
      sort_order: payload.sortOrder ?? (latest?.sort_order ?? 0) + 1000,
      created_by: context.user.id,
    })
    .select(
      "id, org_id, work_item_id, text, is_done, sort_order, completed_at, created_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create checklist item.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
