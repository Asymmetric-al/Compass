import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { reorderCommitmentsSchema } from "@/lib/validation/api";

export async function POST(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = reorderCommitmentsSchema.safeParse(await request.json());
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

  const updates = parseResult.data.items.map((item) =>
    context.supabase
      .from("commitments")
      .update({ priority_rank: item.priorityRank })
      .eq("org_id", context.orgId)
      .eq("id", item.commitmentId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error);
  if (firstError?.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: firstError.error.message },
      requestId,
      500
    );
  }

  return apiSuccess({ updated: parseResult.data.items.length }, requestId);
}
