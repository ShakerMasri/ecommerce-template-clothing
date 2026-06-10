import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  rateLimit: vi.fn(),
  validateSameOriginRequest: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    category: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("~/lib/admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("~/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
}));

vi.mock("~/lib/csrf", () => ({
  validateSameOriginRequest: mocks.validateSameOriginRequest,
}));

vi.mock("~/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

import { GET, POST } from "./route";

function createRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/categories", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

function createGetRequest(query = "") {
  return new Request(`http://localhost:3000/api/admin/categories${query}`);
}

describe("admin category collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireAdmin.mockResolvedValue({
      ok: true,
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    mocks.rateLimit.mockResolvedValue({
      ok: true,
    });

    mocks.validateSameOriginRequest.mockReturnValue(null);
  });

  it("loads filtered categories for admins", async () => {
    mocks.prisma.category.count.mockResolvedValue(1);
    mocks.prisma.category.findMany.mockResolvedValue([
      {
        id: "category-1",
        name: "Figures",
        slug: "figures",
        _count: {
          products: 2,
        },
      },
    ]);
    mocks.prisma.$transaction.mockImplementation(async (operations) =>
      Promise.all(operations),
    );

    const response = await GET(
      createGetRequest("?q=fig&usage=with_products&page=1&limit=10"),
    );
    const body = (await response.json()) as {
      categories: Array<{ slug: string; _count: { products: number } }>;
      pagination: { total: number; page: number; limit: number };
    };

    expect(response.status).toBe(200);
    expect(body.categories[0]?.slug).toBe("figures");
    expect(body.categories[0]?._count.products).toBe(2);
    expect(body.pagination.total).toBe(1);
    expect(mocks.prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        where: expect.objectContaining({
          products: { some: {} },
        }),
      }),
    );
  });

  it("rejects invalid category filters", async () => {
    const response = await GET(createGetRequest("?usage=bad&limit=500"));
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid filters.");
    expect(mocks.prisma.category.findMany).not.toHaveBeenCalled();
  });

  it("creates a category with valid input", async () => {
    mocks.prisma.category.create.mockResolvedValue({
      id: "category-1",
      name: "Figures",
      slug: "figures",
    });

    const response = await POST(
      createRequest({
        name: "Figures",
        slug: "figures",
      }),
    );

    const body = (await response.json()) as { category: { slug: string } };

    expect(response.status).toBe(200);
    expect(body.category.slug).toBe("figures");
    expect(mocks.prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: "Figures",
          slug: "figures",
        },
      }),
    );
  });

  it("rejects invalid category input", async () => {
    const response = await POST(
      createRequest({
        name: "A",
        slug: "Bad Slug!",
      }),
    );

    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid input.");
    expect(mocks.prisma.category.create).not.toHaveBeenCalled();
  });

  it("hides the route from non-admin users", async () => {
    const notFoundResponse = Response.json(
      {
        message: "Not found.",
      },
      { status: 404 },
    );

    mocks.requireAdmin.mockResolvedValue({
      ok: false,
      response: notFoundResponse,
    });

    const response = await GET(createGetRequest());
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(404);
    expect(body.message).toBe("Not found.");
  });
});
