import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createTeamSchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  let query = context.supabase
    .from("teams")
    .select("id, type, slug, name")
    .eq("org_id", context.orgId)
    .order("name");

  if (type === "department" || type === "region") {
    query = query.eq("type", type);
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

  const parseResult = createTeamSchema.safeParse(await request.json());
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
    .from("teams")
    .insert({
      org_id: context.orgId,
      type: parseResult.data.type,
      slug: parseResult.data.slug,
      name: parseResult.data.name,
    })
    .select("id, type, slug, name")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create team.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
