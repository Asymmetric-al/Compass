import { expect, test } from "@playwright/test";

test("login page renders core authentication actions", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("Welcome to Compass")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create account" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" })
  ).toBeVisible();
});
