import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CheckInForm } from "@/components/checkins/checkin-form";

describe("CheckInForm", () => {
  test("renders weekly check-in prompts", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CheckInForm />
      </QueryClientProvider>
    );

    expect(screen.getByText("Weekly Check-in")).toBeInTheDocument();
    expect(
      screen.getByLabelText("What did you complete that mattered most?")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit check-in" })
    ).toBeInTheDocument();
  });
});
