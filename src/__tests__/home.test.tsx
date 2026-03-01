import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../app/page";

describe("Home page", () => {
  test("renders the heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Compass");
  });

  test("renders the subtitle", () => {
    render(<Home />);
    expect(
      screen.getByText("Built with Next.js 16 and Turbopack")
    ).toBeInTheDocument();
  });

  test("renders the Get Started link", () => {
    render(<Home />);
    const link = screen.getByText("Get Started");
    expect(link).toHaveAttribute("href", "https://nextjs.org/docs");
  });
});
