import { expect, test } from "@playwright/test";

test("today page shows commitments workflow controls", async ({ page }) => {
  await page.goto("/today");

  await expect(page.getByText("Today's commitments")).toBeVisible();
  await expect(page.getByLabel("Add commitment")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
});
