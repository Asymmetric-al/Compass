import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import TodayPage from "@/app/(app)/today/page";

describe("Today page", () => {
  test("renders stewardship-focused title", () => {
    render(<TodayPage />);
    expect(screen.getByText("Today’s commitments")).toBeInTheDocument();
  });

  test("renders ministry-first description", () => {
    render(<TodayPage />);
    expect(
      screen.getByText(
        "Focus on the highest-priority, highest-weight commitments connected to stewardship measures."
      )
    ).toBeInTheDocument();
  });
});
