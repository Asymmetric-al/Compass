import { API_ERROR } from "@/lib/api/errors";
import { canEditGoal, canViewGoal } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  createGoalMeasureUpdateSchema,
  createMeasureUpdateSchema,
} from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ measureId: string }> }
) {
  const { measureId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const { data: goalMeasure } = await context.supabase
    .from("goal_measures")
    .select("id, goal_id")
    .eq("org_id", context.orgId)
    .eq("id", measureId)
    .maybeSingle();

  if (goalMeasure) {
    const viewCheck = await canViewGoal(context.supabase, goalMeasure.goal_id);
    if (viewCheck.error) {
      return apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: viewCheck.error.message },
        requestId,
        500
      );
    }
    if (!viewCheck.authorized) {
      return apiError(
        { code: API_ERROR.FORBIDDEN, message: "Measure not accessible." },
        requestId,
        403
      );
    }

    const { data, error } = await context.supabase
      .from("goal_measure_updates")
      .select(
        "id, org_id, goal_measure_id, value, note_json, note_text, occurred_at, created_by, created_at"
      )
      .eq("org_id", context.orgId)
      .eq("goal_measure_id", measureId)
      .order("occurred_at", { ascending: false });

    if (error) {
      return apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: error.message },
        requestId,
        500
      );
    }

    return apiSuccess(data ?? [], requestId);
  }

  const { data, error } = await context.supabase
    .from("measure_updates")
    .select(
      "id, measure_id, as_of_date, value_numeric, value_text, comment_json"
    )
    .eq("org_id", context.orgId)
    .eq("measure_id", measureId)
    .order("as_of_date", { ascending: false });

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
  routeContext: { params: Promise<{ measureId: string }> }
) {
  const { measureId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const body = await request.json();
  const { data: goalMeasure } = await context.supabase
    .from("goal_measures")
    .select("id, goal_id")
    .eq("org_id", context.orgId)
    .eq("id", measureId)
    .maybeSingle();

  if (goalMeasure) {
    const parseGoalResult = createGoalMeasureUpdateSchema.safeParse(body);
    if (!parseGoalResult.success) {
      return apiError(
        {
          code: API_ERROR.BAD_REQUEST,
          message: parseGoalResult.error.issues
            .map((issue) => issue.message)
            .join(", "),
        },
        requestId,
        400
      );
    }

    const editCheck = await canEditGoal(context.supabase, goalMeasure.goal_id);
    if (editCheck.error) {
      return apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: editCheck.error.message },
        requestId,
        500
      );
    }
    if (!editCheck.authorized) {
      return apiError(
        { code: API_ERROR.FORBIDDEN, message: "Insufficient permissions." },
        requestId,
        403
      );
    }

    const payload = parseGoalResult.data;
    const { data, error } = await context.supabase
      .from("goal_measure_updates")
      .insert({
        org_id: context.orgId,
        goal_measure_id: measureId,
        value: payload.value ?? null,
        note_json: payload.noteJson ?? null,
        note_text: payload.noteText ?? null,
        occurred_at: payload.occurredAt,
        created_by: context.user.id,
      })
      .select(
        "id, org_id, goal_measure_id, value, note_json, note_text, occurred_at, created_by, created_at"
      )
      .single();

    if (error || !data) {
      return apiError(
        {
          code: API_ERROR.INTERNAL_ERROR,
          message: error?.message ?? "Unable to save goal measure update.",
        },
        requestId,
        500
      );
    }

    if (payload.value !== null && payload.value !== undefined) {
      await context.supabase
        .from("goal_measures")
        .update({ current_value: payload.value })
        .eq("org_id", context.orgId)
        .eq("id", measureId);
    }

    return apiSuccess(data, requestId, 201);
  }

  const parseResult = createMeasureUpdateSchema.safeParse(body);
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
