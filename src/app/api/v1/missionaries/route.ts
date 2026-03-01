import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createMissionarySchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const regionTeamId = url.searchParams.get("regionTeamId");

  let query = context.supabase
    .from("missionaries")
    .select(
      "id, region_team_id, code_name, public_name, status, location_text, classification, updated_at"
    )
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (regionTeamId) query = query.eq("region_team_id", regionTeamId);

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

  const parseResult = createMissionarySchema.safeParse(await request.json());
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
    .from("missionaries")
    .insert({
      org_id: context.orgId,
      region_team_id: payload.regionTeamId,
      code_name: payload.codeName ?? null,
      public_name: payload.publicName ?? null,
      status: payload.status ?? "active",
      location_text: payload.locationText ?? null,
      classification: payload.classification ?? "sensitive",
    })
    .select(
      "id, region_team_id, code_name, public_name, status, location_text, classification, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create missionary record.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
