import { expect, test } from "@playwright/test";

test("missionary API denies unauthenticated access", async ({ request }) => {
  const response = await request.get("/api/v1/admin/missionaries");
  const contentType = response.headers()["content-type"] ?? "";
  expect(contentType).toContain("application/json");

  const body = (await response.json()) as {
    data: null;
    error: { code: string; message: string };
  };

  expect(response.status()).toBe(401);
  expect(body.error.code).toBe("UNAUTHORIZED");
});
