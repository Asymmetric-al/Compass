import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/api/audit";
import { createRoleAssignmentSchema } from "@/lib/validation/api";

export async function GET() {
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

  const { data, error } = await context.supabase
    .from("role_assignments")
    .select("id, user_id, role, team_id, created_at")
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

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

  const parseResult = createRoleAssignmentSchema.safeParse(
    await request.json()
  );
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
    .from("role_assignments")
    .upsert({
      org_id: context.orgId,
      user_id: parseResult.data.userId,
      role: parseResult.data.role,
      team_id: parseResult.data.teamId ?? null,
    })
    .select("id, user_id, role, team_id, created_at")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create role assignment.",
      },
      requestId,
      500
    );
  }

  await writeAuditLog({
    supabase: context.supabase,
    orgId: context.orgId,
    actorUserId: context.user.id,
    action: "role_assignment.upsert",
    entityType: "role_assignment",
    entityId: data.id,
    metadata: {
      assigned_user_id: data.user_id,
      role: data.role,
      team_id: data.team_id,
    },
  });

  return apiSuccess(data, requestId, 201);
}
