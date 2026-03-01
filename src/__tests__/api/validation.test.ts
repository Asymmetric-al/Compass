import { describe, expect, test } from "vitest";

import {
  createAimSchema,
  createCommitmentSchema,
  createGoalSchema,
  createMeasureSchema,
  updateGoalSchema,
  upsertCheckinSchema,
} from "@/lib/validation/api";

describe("API validation schemas", () => {
  test("validates aim creation payload", () => {
    const result = createAimSchema.safeParse({
      title: "Strengthen missionary care",
      scope: "org",
    });

    expect(result.success).toBe(true);
  });

  test("rejects empty commitment title", () => {
    const result = createCommitmentSchema.safeParse({
      title: "",
    });

    expect(result.success).toBe(false);
  });

  test("validates measure creation payload", () => {
    const result = createMeasureSchema.safeParse({
      aimId: "02e0b6df-3b52-4b0d-8df9-976f5ff68ef1",
      kind: "lead",
      name: "Weekly coaching touchpoints",
    });

    expect(result.success).toBe(true);
  });

  test("validates check-in payload", () => {
    const result = upsertCheckinSchema.safeParse({
      weekStart: "2026-03-02",
      highlightsJson: { text: "Field coaching sessions completed" },
    });

    expect(result.success).toBe(true);
  });

  test("rejects goal payload when date range is invalid", () => {
    const result = createGoalSchema.safeParse({
      scopeType: "user",
      title: "Develop weekly coaching cadence",
      timeboxType: "monthly",
      startDate: "2026-03-31",
      endDate: "2026-03-01",
    });

    expect(result.success).toBe(false);
  });

  test("allows partial goal updates without requiring date fields", () => {
    const result = updateGoalSchema.safeParse({
      title: "Updated goal title",
      status: "active",
    });

    expect(result.success).toBe(true);
  });
});
