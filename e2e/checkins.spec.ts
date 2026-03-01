import { expect, test } from "@playwright/test";

test("check-ins page renders weekly reflection fields", async ({ page }) => {
  await page.goto("/check-ins");

  await expect(page.getByText("Weekly Check-in")).toBeVisible();
  await expect(
    page.getByLabel("What did you complete that mattered most?")
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit check-in" })
  ).toBeVisible();
});
