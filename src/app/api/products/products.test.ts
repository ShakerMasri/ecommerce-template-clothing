import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  categoryFindMany: vi.fn(),
}));

vi.mock("~/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: mocks.productFindMany,
    },
    category: {
      findMany: mocks.categoryFindMany,
    },
  },
}));

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

type ProductResponse = {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: string;
    discountPrice: string | null;
    stock: number;
    showStock: boolean;
    images: string[];
    isFeatured: boolean;
    category: ProductCategory;
  }>;
  categories: ProductCategory[];
};

type ErrorResponse = {
  message: string;
};

function createRequest(path: string) {
  return new Request(`http://localhost:3000${path}`);
}

describe("GET /api/products", () => {
  const categories: ProductCategory[] = [
    {
      id: "category-1",
      name: "Figures",
      slug: "figures",
    },
  ];

  const products = [
    {
      id: "product-1",
      name: "Test Product",
      slug: "test-product",
      price: {
        toString: () => "99.99",
      },
      discountPrice: {
        toString: () => "79.99",
      },
      stock: 10,
      showStock: false,
      images: ["https://res.cloudinary.com/demo/image/upload/test.jpg"],
      isFeatured: true,
      category: categories[0],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.productFindMany.mockResolvedValue(products);
    mocks.categoryFindMany.mockResolvedValue(categories);
  });

  it("returns products and categories", async () => {
    const response = await GET(createRequest("/api/products"));
    const body = (await response.json()) as ProductResponse;

    expect(response.status).toBe(200);
    expect(body.products).toHaveLength(1);
    expect(body.categories).toHaveLength(1);
    expect(body.products[0]?.name).toBe("Test Product");
    expect(body.products[0]?.price).toBe("99.99");
    expect(body.products[0]?.discountPrice).toBe("79.99");
    expect(body.products[0]?.showStock).toBe(false);
  });

  it("only returns non-archived products", async () => {
    await GET(createRequest("/api/products"));

    expect(mocks.productFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isArchived: false,
        },
        select: expect.objectContaining({
          discountPrice: true,
          showStock: true,
        }),
      }),
    );
  });

  it("filters products by category slug", async () => {
    await GET(createRequest("/api/products?category=figures"));

    expect(mocks.productFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isArchived: false,
          category: {
            slug: "figures",
          },
        },
      }),
    );
  });

  it("returns 400 for invalid category query", async () => {
    const response = await GET(
      createRequest("/api/products?category=Invalid Category!"),
    );
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid query parameters.");
    expect(mocks.productFindMany).not.toHaveBeenCalled();
    expect(mocks.categoryFindMany).not.toHaveBeenCalled();
  });

  it("returns 500 if products fail to load", async () => {
    mocks.productFindMany.mockRejectedValue(new Error("Database error"));

    const response = await GET(createRequest("/api/products"));
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(500);
    expect(body.message).toBe("Failed to load products.");
  });
});
