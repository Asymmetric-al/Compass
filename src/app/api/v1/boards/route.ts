import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createBoardSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  let query = context.supabase
    .from("boards")
    .select(
      "id, org_id, type, owner_user_id, team_id, name, is_default, created_by, created_at, updated_at"
    )
    .eq("org_id", context.orgId)
    .order("created_at");

  if (type === "user" || type === "team") {
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
  if (!context) return errorResponse;

  const parseResult = createBoardSchema.safeParse(await request.json());
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

  const payload = parseResult.data;
  const adminCheck = await isOrgAdmin(
    context.supabase,
    context.orgId,
    context.user.id
  );
  if (adminCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: adminCheck.error.message },
      requestId,
      500
    );
  }

  const isOwnerBoardForCurrentUser =
    payload.type === "user" &&
    payload.ownerUserId !== null &&
    payload.ownerUserId === context.user.id;
  if (!adminCheck.authorized && !isOwnerBoardForCurrentUser) {
    return apiError(
      {
        code: API_ERROR.FORBIDDEN,
        message: "Admin role required unless creating your own user board.",
      },
      requestId,
      403
    );
  }

  const { data, error } = await context.supabase
    .from("boards")
    .insert({
      org_id: context.orgId,
      type: payload.type,
      owner_user_id: payload.type === "user" ? payload.ownerUserId : null,
      team_id: payload.type === "team" ? payload.teamId : null,
      name: payload.name,
      is_default: payload.isDefault ?? false,
      created_by: context.user.id,
    })
    .select(
      "id, org_id, type, owner_user_id, team_id, name, is_default, created_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create board.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
