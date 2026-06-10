import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  rateLimit: vi.fn(),
  validateSameOriginRequest: vi.fn(),
  prisma: {
    product: {
      count: vi.fn(),
    },
    category: {
      delete: vi.fn(),
      update: vi.fn(),
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

import { DELETE, PATCH } from "./route";

const routeProps = {
  params: Promise.resolve({
    id: "category-1",
  }),
};

function createRequest(method: "DELETE" | "PATCH", body?: unknown) {
  return new Request("http://localhost:3000/api/admin/categories/category-1", {
    method,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("admin category item route", () => {
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

  it("updates a category with valid input", async () => {
    mocks.prisma.category.update.mockResolvedValue({
      id: "category-1",
      name: "Collectibles",
      slug: "collectibles",
    });

    const response = await PATCH(
      createRequest("PATCH", {
        name: "Collectibles",
        slug: "collectibles",
      }),
      routeProps,
    );

    const body = (await response.json()) as { category: { slug: string } };

    expect(response.status).toBe(200);
    expect(body.category.slug).toBe("collectibles");
  });

  it("rejects empty category updates", async () => {
    const response = await PATCH(createRequest("PATCH", {}), routeProps);
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid input.");
    expect(mocks.prisma.category.update).not.toHaveBeenCalled();
  });

  it("does not delete categories that still have products", async () => {
    mocks.prisma.product.count.mockResolvedValue(1);

    const response = await DELETE(createRequest("DELETE"), routeProps);
    const body = (await response.json()) as {
      errors: { _form: string[] };
    };

    expect(response.status).toBe(409);
    expect(body.errors._form[0]).toBe("Category is used by existing products.");
    expect(mocks.prisma.category.delete).not.toHaveBeenCalled();
  });

  it("deletes categories with no related products", async () => {
    mocks.prisma.product.count.mockResolvedValue(0);
    mocks.prisma.category.delete.mockResolvedValue({ id: "category-1" });

    const response = await DELETE(createRequest("DELETE"), routeProps);
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(body.message).toBe("Category deleted successfully.");
    expect(mocks.prisma.category.delete).toHaveBeenCalledWith({
      where: {
        id: "category-1",
      },
    });
  });
});
