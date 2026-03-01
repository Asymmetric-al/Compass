import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin, isTeamDirector } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { addTeamMemberSchema } from "@/lib/validation/api";

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const [adminCheck, directorCheck] = await Promise.all([
    isOrgAdmin(context.supabase, context.orgId, context.user.id),
    isTeamDirector(context.supabase, context.orgId, teamId, context.user.id),
  ]);

  if (adminCheck.error || directorCheck.error) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message:
          adminCheck.error?.message ??
          directorCheck.error?.message ??
          "Authorization check failed.",
      },
      requestId,
      500
    );
  }

  if (!adminCheck.authorized && !directorCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Insufficient permissions." },
      requestId,
      403
    );
  }

  const { data, error } = await context.supabase
    .from("team_memberships")
    .select(
      "user_id, is_primary, profiles(full_name, email), role_assignments(role)"
    )
    .eq("org_id", context.orgId)
    .eq("team_id", teamId);

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
  routeContext: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await routeContext.params;
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

  const parseResult = addTeamMemberSchema.safeParse(await request.json());
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
    .from("team_memberships")
    .insert({
      org_id: context.orgId,
      team_id: teamId,
      user_id: parseResult.data.userId,
      is_primary: parseResult.data.isPrimary ?? false,
    })
    .select("id, team_id, user_id, is_primary")
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to add team member.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}

export async function DELETE(
  request: Request,
  routeContext: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await routeContext.params;
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

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return apiError(
      {
        code: API_ERROR.BAD_REQUEST,
        message: "userId query parameter is required.",
      },
      requestId,
      400
    );
  }

  const { error } = await context.supabase
    .from("team_memberships")
    .delete()
    .eq("org_id", context.orgId)
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess({ removed: true }, requestId);
}
