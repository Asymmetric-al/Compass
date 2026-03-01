import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateLabelSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdmin() {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return { context: null, requestId, response: errorResponse };
  }

  const adminCheck = await isOrgAdmin(
    context.supabase,
    context.orgId,
    context.user.id
  );
  if (adminCheck.error) {
    return {
      context: null,
      requestId,
      response: apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: adminCheck.error.message },
        requestId,
        500
      ),
    };
  }
  if (!adminCheck.authorized) {
    return {
      context: null,
      requestId,
      response: apiError(
        { code: API_ERROR.FORBIDDEN, message: "Admin role required." },
        requestId,
        403
      ),
    };
  }

  return { context, requestId, response: null };
}

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ labelId: string }> }
) {
  const { labelId } = await routeContext.params;
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const parseResult = updateLabelSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return apiError(
      {
        code: API_ERROR.BAD_REQUEST,
        message: parseResult.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
      auth.requestId,
      400
    );
  }

  const payload = parseResult.data;
  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.colorKey !== undefined) updates.color_key = payload.colorKey;

  const { data, error } = await auth.context.supabase
    .from("labels")
    .update(updates)
    .eq("org_id", auth.context.orgId)
    .eq("id", labelId)
    .select("id, org_id, name, color_key, created_by, created_at")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update label.",
      },
      auth.requestId,
      500
    );
  }

  return apiSuccess(data, auth.requestId);
}

export async function DELETE(
  _request: Request,
  routeContext: { params: Promise<{ labelId: string }> }
) {
  const { labelId } = await routeContext.params;
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const { error } = await auth.context.supabase
    .from("labels")
    .delete()
    .eq("org_id", auth.context.orgId)
    .eq("id", labelId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      auth.requestId,
      500
    );
  }

  return apiSuccess({ ok: true }, auth.requestId);
}
