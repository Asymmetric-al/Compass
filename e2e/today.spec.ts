import { expect, test } from "@playwright/test";

test("today page shows commitments workflow controls", async ({ page }) => {
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByPlaceholder("Search board items...")).toBeVisible();
  await expect(page.getByPlaceholder("Add work item...")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
});
