import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createStorySchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId");
  const cycleId = url.searchParams.get("cycleId");

  let query = context.supabase
    .from("stories")
    .select(
      "id, team_id, cycle_id, aim_id, author_user_id, type, title, body_json, tags, classification, updated_at"
    )
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (teamId) query = query.eq("team_id", teamId);
  if (cycleId) query = query.eq("cycle_id", cycleId);

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

  const parseResult = createStorySchema.safeParse(await request.json());
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
  const { data, error } = await context.supabase
    .from("stories")
    .insert({
      org_id: context.orgId,
      team_id: payload.teamId ?? null,
      cycle_id: payload.cycleId ?? null,
      aim_id: payload.aimId ?? null,
      author_user_id: context.user.id,
      type: payload.type ?? "quick",
      title: payload.title,
      body_json: payload.bodyJson ?? {},
      tags: payload.tags ?? [],
      classification: payload.classification ?? "normal",
    })
    .select(
      "id, team_id, cycle_id, aim_id, author_user_id, type, title, body_json, tags, classification, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create story.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
