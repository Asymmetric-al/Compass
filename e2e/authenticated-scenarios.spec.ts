import { expect, test } from "@playwright/test";

import {
  E2E_AUTH_EMAIL,
  E2E_AUTH_PASSWORD,
  ensureAuthFixtureData,
} from "./support/auth-fixtures";

test.describe("authenticated seeded workflows", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await ensureAuthFixtureData();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(E2E_AUTH_EMAIL);
    await page.locator("#password").fill(E2E_AUTH_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/today$/);
  });

  test("today workflow can progress seeded commitment", async ({ page }) => {
    const fixtures = await ensureAuthFixtureData();

    await page.goto("/today");

    const commitmentCard = page
      .locator("div.rounded-md.border.p-3")
      .filter({ hasText: fixtures.seededCommitmentTitle });
    await expect(commitmentCard).toBeVisible();
    await expect(commitmentCard.getByText("planned")).toBeVisible();

    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/commitments/") &&
        response.request().method() === "PATCH" &&
        response.status() === 200
    );

    await commitmentCard
      .getByRole("button", { name: "Mark in progress" })
      .click();
    await updateResponse;
    await expect(commitmentCard).toHaveCount(0);
  });

  test("aims workflow can create personal aim", async ({ page }) => {
    const createdAimTitle = `E2E Fixture: User aim ${Date.now()}`;

    await page.goto("/aims");
    await page.getByLabel("Aim title").fill(createdAimTitle);
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "User" }).click();

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/aims") &&
        response.request().method() === "POST" &&
        response.status() === 201
    );

    await page.getByRole("button", { name: "Create aim" }).click();
    await createResponse;
    await expect(page.getByText(createdAimTitle)).toBeVisible();
  });

  test("weekly check-in submits successfully", async ({ page }) => {
    await page.goto("/check-ins");

    await page
      .getByLabel("What did you complete that mattered most?")
      .fill("E2E Fixture: completed two coaching conversations.");
    await page
      .getByLabel("What moved in your lead measures?")
      .fill("E2E Fixture: increased weekly partner follow-up consistency.");
    await page
      .getByLabel("Where are you stuck?")
      .fill("E2E Fixture: translation bandwidth remains limited.");
    await page
      .getByLabel("What do you need from the team?")
      .fill("E2E Fixture: help identifying two bilingual mentors.");
    await page
      .getByLabel("What are you asking God to do?")
      .fill("E2E Fixture: wisdom for sustainable pacing.");

    const submitResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/checkins") &&
        response.request().method() === "POST"
    );

    await page.getByRole("button", { name: "Submit check-in" }).click();
    const response = await submitResponse;
    const body = (await response.json()) as {
      data: { week_start: string };
      error: null;
    };

    expect(response.status()).toBe(201);
    expect(body.error).toBeNull();
    expect(body.data.week_start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(
      page.getByLabel("What did you complete that mattered most?")
    ).toHaveValue("");
  });

  test("stories and prayer pages render seeded records", async ({ page }) => {
    const fixtures = await ensureAuthFixtureData();

    await page.goto("/stories");
    await expect(page.getByText(fixtures.seededStoryTitle)).toBeVisible();

    await page.goto("/prayer");
    await expect(page.getByText(fixtures.seededPrayerText)).toBeVisible();
  });
});
