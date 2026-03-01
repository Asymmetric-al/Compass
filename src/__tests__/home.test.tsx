import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import TodayPage from "@/app/(app)/today/page";

describe("Today page", () => {
  function renderWithProviders() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TodayPage />
      </QueryClientProvider>
    );
  }

  test("renders stewardship-focused title", () => {
    renderWithProviders();
    expect(screen.getByText("Today's commitments")).toBeInTheDocument();
  });

  test("renders ministry-first description", () => {
    renderWithProviders();
    expect(
      screen.getByText(
        "Work from top priority and weight so stewardship stays focused."
      )
    ).toBeInTheDocument();
  });
});
