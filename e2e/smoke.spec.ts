import { test, expect } from "@playwright/test";

test("homepage loads and displays heading", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByPlaceholder("Search board items...")).toBeVisible();
});
