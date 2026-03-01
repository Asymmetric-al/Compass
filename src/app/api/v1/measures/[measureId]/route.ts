import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateMeasureSchema } from "@/lib/validation/api";

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ measureId: string }> }
) {
  const { measureId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = updateMeasureSchema.safeParse(await request.json());
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
    .update({
      aim_id: payload.aimId,
      kind: payload.kind,
      owner_user_id: payload.ownerUserId,
      name: payload.name,
      cadence: payload.cadence,
      unit: payload.unit,
      unit_label: payload.unitLabel,
      direction: payload.direction,
      baseline: payload.baseline,
      target: payload.target,
      target_date: payload.targetDate,
      confidence_score: payload.confidenceScore,
      definition_text: payload.definitionText,
      notes_json: payload.notesJson,
    })
    .eq("org_id", context.orgId)
    .eq("id", measureId)
    .select(
      "id, aim_id, kind, owner_user_id, name, cadence, unit, unit_label, direction, baseline, target, target_date, confidence_score, definition_text, notes_json"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.NOT_FOUND,
        message: error?.message ?? "Measure not found.",
      },
      requestId,
      404
    );
  }

  return apiSuccess(data, requestId);
}
