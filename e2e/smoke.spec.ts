import { test, expect } from "@playwright/test";

test("homepage loads and displays heading", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByText("Today’s commitments")).toBeVisible();
});
