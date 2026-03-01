import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import Home from "../app/page";

describe("Home page", () => {
  test("renders the heading", () => {
    const { getByRole } = render(<Home />);
    const heading = getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Compass");
  });

  test("renders the subtitle", () => {
    const { getByText } = render(<Home />);
    expect(getByText("Built with Next.js 16 and Turbopack")).toBeTruthy();
  });

  test("renders the Get Started link", () => {
    const { getByText } = render(<Home />);
    const link = getByText("Get Started");
    expect(link.getAttribute("href")).toBe("https://nextjs.org/docs");
  });
});
