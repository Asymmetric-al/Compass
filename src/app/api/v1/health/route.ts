import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  const requestId = crypto.randomUUID();
  return apiSuccess({ status: "ok" }, requestId);
}
