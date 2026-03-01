import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateCycleSchema } from "@/lib/validation/api";

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ cycleId: string }> }
) {
  const { cycleId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const { authorized, error: authzError } = await isOrgAdmin(
    context.supabase,
    context.orgId,
    context.user.id
  );
  if (authzError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: authzError.message },
      requestId,
      500
    );
  }
  if (!authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Admin role required." },
      requestId,
      403
    );
  }

  const parseResult = updateCycleSchema.safeParse(await request.json());
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

  if (parseResult.data.isActive) {
    await context.supabase
      .from("cycles")
      .update({ is_active: false })
      .eq("org_id", context.orgId)
      .eq("type", "annual");
    await context.supabase
      .from("cycles")
      .update({ is_active: false })
      .eq("org_id", context.orgId)
      .eq("type", "quarterly");
  }

  const { data, error } = await context.supabase
    .from("cycles")
    .update({
      name: parseResult.data.name,
      is_active: parseResult.data.isActive,
    })
    .eq("org_id", context.orgId)
    .eq("id", cycleId)
    .select("id, type, name, start_date, end_date, is_active")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.NOT_FOUND,
        message: error?.message ?? "Cycle not found.",
      },
      requestId,
      404
    );
  }

  return apiSuccess(data, requestId);
}
