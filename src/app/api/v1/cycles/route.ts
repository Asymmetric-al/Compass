import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createCycleSchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const active = url.searchParams.get("active");

  let query = context.supabase
    .from("cycles")
    .select("id, type, name, start_date, end_date, is_active")
    .eq("org_id", context.orgId)
    .order("start_date", { ascending: false });

  if (type === "annual" || type === "quarterly") {
    query = query.eq("type", type);
  }
  if (active === "true") {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess(data ?? [], requestId);
}

export async function POST(request: Request) {
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

  const parseResult = createCycleSchema.safeParse(await request.json());
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

  const { data, error } = await context.supabase
    .from("cycles")
    .insert({
      org_id: context.orgId,
      type: parseResult.data.type,
      name: parseResult.data.name,
      start_date: parseResult.data.startDate,
      end_date: parseResult.data.endDate,
      created_by: context.user.id,
    })
    .select("id, type, name, start_date, end_date, is_active")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create cycle.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
