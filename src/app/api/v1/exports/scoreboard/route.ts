import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError } from "@/lib/api/response";

function escapeCsvValue(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export async function GET() {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const { authorized, error: authzError } = await isOrgAdmin(
    context.supabase,
    context.orgId,
    context.user.id
  );
  if (authzError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: authzError.message },
      requestId,
      500
    );
  }
  if (!authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Admin role required." },
      requestId,
      403
    );
  }

  const [aimsResult, measuresResult, commitmentsResult] = await Promise.all([
    context.supabase
      .from("aims")
      .select("id, title, scope, classification")
      .eq("org_id", context.orgId),
    context.supabase
      .from("measures")
      .select("id, aim_id, kind, name, cadence")
      .eq("org_id", context.orgId),
    context.supabase
      .from("commitments")
      .select("id, aim_id, title, status, priority_rank, weight")
      .eq("org_id", context.orgId),
  ]);

  if (aimsResult.error || measuresResult.error || commitmentsResult.error) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message:
          aimsResult.error?.message ??
          measuresResult.error?.message ??
          commitmentsResult.error?.message ??
          "Unable to build export.",
      },
      requestId,
      500
    );
  }

  const lines: string[] = [];
  lines.push(
    "section,id,aim_id,title,type_or_scope,status_or_cadence,extra_1,extra_2"
  );

  for (const aim of aimsResult.data ?? []) {
    lines.push(
      [
        "aim",
        escapeCsvValue(aim.id),
        "",
        escapeCsvValue(aim.title),
        escapeCsvValue(aim.scope),
        "",
        escapeCsvValue(aim.classification),
        "",
      ].join(",")
    );
  }

  for (const measure of measuresResult.data ?? []) {
    lines.push(
      [
        "measure",
        escapeCsvValue(measure.id),
        escapeCsvValue(measure.aim_id),
        escapeCsvValue(measure.name),
        escapeCsvValue(measure.kind),
        escapeCsvValue(measure.cadence),
        "",
        "",
      ].join(",")
    );
  }

  for (const commitment of commitmentsResult.data ?? []) {
    lines.push(
      [
        "commitment",
        escapeCsvValue(commitment.id),
        escapeCsvValue(commitment.aim_id),
        escapeCsvValue(commitment.title),
        "",
        escapeCsvValue(commitment.status),
        escapeCsvValue(commitment.priority_rank),
        escapeCsvValue(commitment.weight),
      ].join(",")
    );
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="compass-scoreboard.csv"',
    },
  });
}
