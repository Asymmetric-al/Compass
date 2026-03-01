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

  test("today workflow can create and complete a work item", async ({
    page,
  }) => {
    const uniqueWorkItemTitle = `E2E Fixture: Work item ${Date.now()}`;
    await page.goto("/today");

    const addInput = page.getByPlaceholder("Add work item...");
    await addInput.fill(uniqueWorkItemTitle);
    const addButton = addInput.locator("xpath=following-sibling::button[1]");

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/work-items") &&
        response.request().method() === "POST"
    );
    await addButton.click();
    const createApiResponse = await createResponse;
    const createApiBody = (await createApiResponse.json()) as {
      error: { code: string; message: string } | null;
    };
    expect(
      createApiResponse.status(),
      createApiBody.error?.message ?? "unexpected create work item error"
    ).toBe(201);
    await page.reload();

    const workItemCard = page.getByText(uniqueWorkItemTitle).first();
    await expect(workItemCard).toBeVisible();
    await page.getByRole("tab", { name: "List" }).click();
    await page
      .getByRole("row", { name: new RegExp(uniqueWorkItemTitle) })
      .click();
    await expect(page.getByText("Work item detail")).toBeVisible();

    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/work-items/") &&
        response.request().method() === "PATCH" &&
        response.status() === 200
    );

    await page.getByRole("button", { name: "Toggle done" }).click();
    await updateResponse;
    await expect(page.getByText("Status: done")).toBeVisible();
  });

  test("goals workflow can create personal goal", async ({ page }) => {
    const createdGoalTitle = `E2E Fixture: User goal ${Date.now()}`;

    await page.goto("/goals/my");
    await page.getByRole("button", { name: "Create goal" }).click();
    await page.getByLabel("Title").fill(createdGoalTitle);

    const today = new Date();
    const quarterFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
    await page.getByLabel("Start date").fill(today.toISOString().slice(0, 10));
    await page
      .getByLabel("End date")
      .fill(quarterFromNow.toISOString().slice(0, 10));

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/goals") &&
        response.request().method() === "POST"
    );

    await page.getByRole("button", { name: "Save goal" }).click();
    const createGoalResponse = await createResponse;
    const createGoalBody = (await createGoalResponse.json()) as {
      error: { code: string; message: string } | null;
    };
    expect(
      createGoalResponse.status(),
      createGoalBody.error?.message ?? "unexpected create goal error"
    ).toBe(201);
    await expect(page.getByText(createdGoalTitle)).toBeVisible();
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

    await page.goto("/goals/my");
    await expect(page.getByText(fixtures.seededGoalTitle)).toBeVisible();
  });
});
