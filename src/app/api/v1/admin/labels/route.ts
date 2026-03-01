import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createLabelSchema } from "@/lib/validation/api";

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

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const { data, error } = await auth.context.supabase
    .from("labels")
    .select("id, org_id, name, color_key, created_by, created_at")
    .eq("org_id", auth.context.orgId)
    .order("name");

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      auth.requestId,
      500
    );
  }

  return apiSuccess(data ?? [], auth.requestId);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const parseResult = createLabelSchema.safeParse(await request.json());
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
  const { data, error } = await auth.context.supabase
    .from("labels")
    .insert({
      org_id: auth.context.orgId,
      name: payload.name,
      color_key: payload.colorKey ?? null,
      created_by: auth.context.user.id,
    })
    .select("id, org_id, name, color_key, created_by, created_at")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create label.",
      },
      auth.requestId,
      500
    );
  }

  return apiSuccess(data, auth.requestId, 201);
}
