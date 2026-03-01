import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin, isTeamDirector } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";
import { createGoalSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const scopeType = url.searchParams.get("scopeType");
  const teamId = url.searchParams.get("teamId");
  const userId = url.searchParams.get("userId");
  const timeboxType = url.searchParams.get("timeboxType");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const q = url.searchParams.get("q");

  let query = context.supabase
    .from("goals")
    .select(
      "id, org_id, scope_type, scope_team_id, scope_user_id, title, description_json, description_text, status, timebox_type, start_date, end_date, parent_goal_id, visibility, classification, created_by, updated_by, created_at, updated_at"
    )
    .eq("org_id", context.orgId)
    .order("start_date", { ascending: false });

  if (scopeType === "org" || scopeType === "team" || scopeType === "user") {
    query = query.eq("scope_type", scopeType);
  }
  if (teamId) query = query.eq("scope_team_id", teamId);
  if (userId) query = query.eq("scope_user_id", userId);
  if (
    timeboxType === "annual" ||
    timeboxType === "quarterly" ||
    timeboxType === "monthly" ||
    timeboxType === "weekly" ||
    timeboxType === "custom"
  ) {
    query = query.eq("timebox_type", timeboxType);
  }
  if (from) query = query.gte("start_date", from);
  if (to) query = query.lte("end_date", to);
  if (q) query = query.or(`title.ilike.%${q}%,description_text.ilike.%${q}%`);

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

  const parseResult = createGoalSchema.safeParse(await request.json());
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

  let authorized = adminCheck.authorized;
  if (!authorized && payload.scopeType === "team" && payload.scopeTeamId) {
    const teamDirectorCheck = await isTeamDirector(
      context.supabase,
      context.orgId,
      payload.scopeTeamId,
      context.user.id
    );
    if (teamDirectorCheck.error) {
      return apiError(
        {
          code: API_ERROR.INTERNAL_ERROR,
          message: teamDirectorCheck.error.message,
        },
        requestId,
        500
      );
    }
    authorized = teamDirectorCheck.authorized;
  }

  if (!authorized && payload.scopeType === "user") {
    authorized =
      !payload.scopeUserId || payload.scopeUserId === context.user.id;
  }

  if (!authorized) {
    return apiError(
      {
        code: API_ERROR.FORBIDDEN,
        message: "Insufficient permissions to create goal.",
      },
      requestId,
      403
    );
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("goals")
    .insert({
      org_id: context.orgId,
      scope_type: payload.scopeType,
      scope_team_id: payload.scopeTeamId ?? null,
      scope_user_id: payload.scopeUserId ?? null,
      title: payload.title,
      description_json: payload.descriptionJson ?? null,
      description_text: payload.descriptionText ?? null,
      status: payload.status ?? "active",
      timebox_type: payload.timeboxType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      parent_goal_id: payload.parentGoalId ?? null,
      visibility: payload.visibility ?? "org",
      classification: payload.classification ?? "normal",
      created_by: context.user.id,
      updated_by: context.user.id,
    })
    .select(
      "id, org_id, scope_type, scope_team_id, scope_user_id, title, description_json, description_text, status, timebox_type, start_date, end_date, parent_goal_id, visibility, classification, created_by, updated_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create goal.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
