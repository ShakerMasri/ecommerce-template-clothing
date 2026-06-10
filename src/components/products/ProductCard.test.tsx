import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import type { ReactNode } from "react";

// Mock Next.js Link to avoid routing issues in tests
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ProductCard", () => {
  const mockProduct = {
    id: "1",
    name: "Test Product",
    price: "99.99",
    discountPrice: null,
    slug: "test-product",
    stock: 10,
    showStock: true,
    images: ["test.jpg"],
    category: {
      id: "cat-1",
      name: "Test Category",
      slug: "test-category",
    },
  };

  const mockLabels = {
    noImage: "No Image",
    featured: "Featured",
    soldOut: "Sold Out",
    out: "Out",
    left: "left",
    inStock: "In stock",
  };

  it("renders product name", () => {
    render(<ProductCard product={mockProduct} labels={mockLabels} />);
    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  it("renders product price", () => {
    render(<ProductCard product={mockProduct} labels={mockLabels} />);
    expect(screen.getByText(/99.99/)).toBeInTheDocument();
  });

  it("renders sale price with regular price crossed out", () => {
    render(
      <ProductCard
        product={{ ...mockProduct, discountPrice: "79.99" }}
        labels={mockLabels}
      />,
    );

    expect(screen.getByText(/79.99/)).toBeInTheDocument();
    expect(screen.getByText(/79.99/)).toHaveClass("text-orange-600");
    expect(screen.getByText(/99.99/)).toHaveClass("line-through");
  });

  it("renders category name", () => {
    render(<ProductCard product={mockProduct} labels={mockLabels} />);
    expect(screen.getByText("Test Category")).toBeInTheDocument();
  });

  it("hides the exact stock count when customer stock visibility is off", () => {
    render(
      <ProductCard
        product={{ ...mockProduct, showStock: false }}
        labels={mockLabels}
      />,
    );

    expect(screen.queryByText("10 left")).not.toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
  });
});
