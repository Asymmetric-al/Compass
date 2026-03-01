import { describe, expect, test } from "vitest";

import { GET } from "@/app/api/v1/health/route";

describe("health route", () => {
  test("returns ok status payload", async () => {
    const response = await GET();
    const body = (await response.json()) as {
      data: { status: string };
      error: null;
      meta: { requestId: string };
    };

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("ok");
    expect(body.error).toBeNull();
    expect(body.meta.requestId).toBeTruthy();
  });
});
