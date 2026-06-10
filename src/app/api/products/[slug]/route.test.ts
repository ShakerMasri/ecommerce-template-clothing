import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  productFindFirst: vi.fn(),
}));

vi.mock("~/lib/prisma", () => ({
  prisma: {
    product: {
      findFirst: mocks.productFindFirst,
    },
  },
}));

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

type ProductResponse = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: string;
    discountPrice: string | null;
    stock: number;
    showStock: boolean;
    images: string[];
    isFeatured: boolean;
    category: ProductCategory;
  };
};

type ErrorResponse = {
  message: string;
};

function createRequest(path: string) {
  return new Request(`http://localhost:3000${path}`);
}

function createSlugParams(slug: string) {
  return {
    params: Promise.resolve({ slug }),
  };
}

describe("GET /api/products/[slug]", () => {
  const category: ProductCategory = {
    id: "category-1",
    name: "Figures",
    slug: "figures",
  };

  const product = {
    id: "product-1",
    name: "Test Product",
    slug: "test-product",
    description: "A test product",
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
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    category,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.productFindFirst.mockResolvedValue(product);
  });

  it("returns product by slug", async () => {
    const response = await GET(
      createRequest("/api/products/test-product"),
      createSlugParams("test-product"),
    );
    const body = (await response.json()) as ProductResponse;

    expect(response.status).toBe(200);
    expect(body.product.name).toBe("Test Product");
    expect(body.product.slug).toBe("test-product");
    expect(body.product.price).toBe("99.99");
    expect(body.product.discountPrice).toBe("79.99");
    expect(body.product.showStock).toBe(false);
  });

  it("only returns non-archived product with matching slug", async () => {
    await GET(
      createRequest("/api/products/test-product"),
      createSlugParams("test-product"),
    );

    expect(mocks.productFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: "test-product",
          isArchived: false,
        },
        select: expect.objectContaining({
          discountPrice: true,
          showStock: true,
        }),
      }),
    );
  });

  it("returns 400 for invalid slug", async () => {
    const response = await GET(
      createRequest("/api/products/Invalid Slug!"),
      createSlugParams("Invalid Slug!"),
    );
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid product slug.");
    expect(mocks.productFindFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when product does not exist", async () => {
    mocks.productFindFirst.mockResolvedValue(null);

    const response = await GET(
      createRequest("/api/products/missing-product"),
      createSlugParams("missing-product"),
    );
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(404);
    expect(body.message).toBe("Product not found.");
  });

  it("returns 500 if product fails to load", async () => {
    mocks.productFindFirst.mockRejectedValue(new Error("Database error"));

    const response = await GET(
      createRequest("/api/products/test-product"),
      createSlugParams("test-product"),
    );
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(500);
    expect(body.message).toBe("Failed to load product.");
  });
});
