import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { upsertCheckinSchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const weekStart = url.searchParams.get("weekStart");
  const userId = url.searchParams.get("userId");

  let query = context.supabase
    .from("checkins")
    .select(
      "id, user_id, week_start, highlights_json, progress_json, blockers_json, asks_json, prayer_json, next_week_json, updated_at"
    )
    .eq("org_id", context.orgId)
    .order("week_start", { ascending: false });

  if (weekStart) query = query.eq("week_start", weekStart);
  if (userId) query = query.eq("user_id", userId);

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

  const parseResult = upsertCheckinSchema.safeParse(await request.json());
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
    .from("checkins")
    .upsert({
      org_id: context.orgId,
      user_id: context.user.id,
      week_start: payload.weekStart,
      highlights_json: payload.highlightsJson ?? {},
      progress_json: payload.progressJson ?? {},
      blockers_json: payload.blockersJson ?? {},
      asks_json: payload.asksJson ?? {},
      prayer_json: payload.prayerJson ?? {},
      next_week_json: payload.nextWeekJson ?? {},
    })
    .select(
      "id, user_id, week_start, highlights_json, progress_json, blockers_json, asks_json, prayer_json, next_week_json, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to save check-in.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
