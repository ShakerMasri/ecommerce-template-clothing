import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OptimizedImage } from "./OptimizedImage";

describe("OptimizedImage", () => {
  it("renders with correct alt text", () => {
    render(<OptimizedImage src="test.jpg" alt="Test image" />);
    expect(screen.getByAltText("Test image")).toBeInTheDocument();
  });

  it("applies className if provided", () => {
    const { container } = render(
      <OptimizedImage src="test.jpg" alt="Test" className="custom-class" />,
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("renders alt text correctly", () => {
    render(<OptimizedImage src="test.jpg" alt="Custom alt text" />);
    expect(screen.getByAltText("Custom alt text")).toBeInTheDocument();
  });
});
