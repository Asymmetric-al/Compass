import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createMeasureUpdateSchema } from "@/lib/validation/api";

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ measureId: string }> }
) {
  const { measureId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = createMeasureUpdateSchema.safeParse(await request.json());
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
    .from("measure_updates")
    .upsert({
      org_id: context.orgId,
      measure_id: measureId,
      as_of_date: payload.asOfDate,
      value_numeric: payload.valueNumeric ?? null,
      value_text: payload.valueText ?? null,
      comment_json: payload.commentJson ?? {},
      created_by: context.user.id,
    })
    .select(
      "id, measure_id, as_of_date, value_numeric, value_text, comment_json"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to save measure update.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
