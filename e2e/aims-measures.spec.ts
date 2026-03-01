import { expect, test } from "@playwright/test";

test("aims page renders aim creation controls", async ({ page }) => {
  await page.goto("/aims");

  await expect(page.getByRole("heading", { name: "Aims" })).toBeVisible();
  await expect(page.getByLabel("Aim title")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create aim" })).toBeVisible();
});
