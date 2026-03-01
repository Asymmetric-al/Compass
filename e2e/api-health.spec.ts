import { expect, test } from "@playwright/test";

test("health endpoint returns ok response envelope", async ({ request }) => {
  const response = await request.get("/api/v1/health");
  const body = (await response.json()) as {
    data: { status: string };
    error: null;
    meta: { requestId: string };
  };

  expect(response.ok()).toBeTruthy();
  expect(body.data.status).toBe("ok");
  expect(body.error).toBeNull();
  expect(body.meta.requestId).toBeTruthy();
});
