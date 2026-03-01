import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createMeasureSchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const aimId = url.searchParams.get("aimId");
  if (!aimId) {
    return apiError(
      {
        code: API_ERROR.BAD_REQUEST,
        message: "aimId query parameter is required.",
      },
      requestId,
      400
    );
  }

  const { data, error } = await context.supabase
    .from("measures")
    .select(
      "id, aim_id, kind, owner_user_id, name, cadence, unit, unit_label, direction, baseline, target, target_date, confidence_score, definition_text, notes_json"
    )
    .eq("org_id", context.orgId)
    .eq("aim_id", aimId)
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

  const parseResult = createMeasureSchema.safeParse(await request.json());
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
    .from("measures")
    .insert({
      org_id: context.orgId,
      aim_id: payload.aimId,
      kind: payload.kind,
      owner_user_id: payload.ownerUserId ?? null,
      name: payload.name,
      cadence: payload.cadence ?? "weekly",
      unit: payload.unit ?? "count",
      unit_label: payload.unitLabel ?? null,
      direction: payload.direction ?? "increase",
      baseline: payload.baseline ?? null,
      target: payload.target ?? null,
      target_date: payload.targetDate ?? null,
      confidence_score: payload.confidenceScore ?? 3,
      definition_text: payload.definitionText ?? "",
      notes_json: payload.notesJson ?? {},
      created_by: context.user.id,
    })
    .select(
      "id, aim_id, kind, owner_user_id, name, cadence, unit, unit_label, direction, baseline, target, target_date, confidence_score, definition_text, notes_json"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create measure.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
