import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { upsertMissionaryUpdateSchema } from "@/lib/validation/api";

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ missionaryId: string }> }
) {
  const { missionaryId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const { data, error } = await context.supabase
    .from("missionary_updates")
    .select(
      "id, missionary_id, month, summary_json, prayer_json, lead_metrics, lag_metrics, classification, updated_at"
    )
    .eq("org_id", context.orgId)
    .eq("missionary_id", missionaryId)
    .order("month", { ascending: false });

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
  routeContext: { params: Promise<{ missionaryId: string }> }
) {
  const { missionaryId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = upsertMissionaryUpdateSchema.safeParse(
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

  const payload = parseResult.data;
  const { data, error } = await context.supabase
    .from("missionary_updates")
    .upsert({
      org_id: context.orgId,
      missionary_id: missionaryId,
      month: payload.month,
      summary_json: payload.summaryJson ?? {},
      prayer_json: payload.prayerJson ?? {},
      lead_metrics: payload.leadMetrics ?? {},
      lag_metrics: payload.lagMetrics ?? {},
      classification: payload.classification ?? "sensitive",
      created_by: context.user.id,
    })
    .select(
      "id, missionary_id, month, summary_json, prayer_json, lead_metrics, lag_metrics, classification, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to save missionary update.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
