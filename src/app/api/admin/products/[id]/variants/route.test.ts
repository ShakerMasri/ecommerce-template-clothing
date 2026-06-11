import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  rateLimit: vi.fn(),
  validateSameOriginRequest: vi.fn(),
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
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

vi.mock("~/lib/logger", () => ({
  getReferenceMessage: (message: string, errorId: string) =>
    `${message} Reference: ${errorId}`,
  logError: vi.fn(() => "err_test"),
}));

import { GET, POST } from "./route";

const productId = "clh1q2w3e000008l4a5b6c7d8";
const variantId = "clh1q2w3e000108l4a5b6c7d9";

const routeParams = {
  params: Promise.resolve({ id: productId }),
};

function createGetRequest() {
  return new Request(
    `http://localhost:3000/api/admin/products/${productId}/variants`,
  );
}

function createPostRequest(body: unknown) {
  return new Request(
    `http://localhost:3000/api/admin/products/${productId}/variants`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    },
  );
}

function createVariant(overrides: Record<string, unknown> = {}) {
  return {
    id: variantId,
    productId,
    sizeLabel: "M",
    colorLabel: "Black",
    sizeKey: "m",
    colorKey: "black",
    stock: 5,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

describe("admin product variants collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireAdmin.mockResolvedValue({
      ok: true,
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    mocks.rateLimit.mockResolvedValue({ ok: true });
    mocks.validateSameOriginRequest.mockReturnValue(null);
    mocks.prisma.product.findUnique.mockResolvedValue({ id: productId });
  });

  it("lists variants for an admin product", async () => {
    mocks.prisma.productVariant.findMany.mockResolvedValue([createVariant()]);

    const response = await GET(createGetRequest(), routeParams);
    const body = (await response.json()) as {
      variants: Array<{ id: string; createdAt: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.variants[0]?.id).toBe(variantId);
    expect(body.variants[0]?.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(mocks.prisma.productVariant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    );
  });

  it("creates a variant with normalized keys", async () => {
    mocks.prisma.productVariant.create.mockResolvedValue(createVariant());

    const response = await POST(
      createPostRequest({
        sizeLabel: " Medium ",
        colorLabel: " Black ",
        stock: "5",
        sortOrder: "0",
        isActive: true,
      }),
      routeParams,
    );
    const body = (await response.json()) as {
      variant: { id: string; sizeKey: string; colorKey: string };
    };

    expect(response.status).toBe(201);
    expect(body.variant.id).toBe(variantId);
    expect(mocks.prisma.productVariant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId,
          sizeLabel: "Medium",
          colorLabel: "Black",
          sizeKey: "medium",
          colorKey: "black",
          stock: 5,
        }),
      }),
    );
  });

  it("rejects duplicate size/color combinations", async () => {
    mocks.prisma.productVariant.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["productId", "sizeKey", "colorKey"] },
      }),
    );

    const response = await POST(
      createPostRequest({
        sizeLabel: "M",
        colorLabel: "Black",
        stock: "5",
      }),
      routeParams,
    );
    const body = (await response.json()) as { errors: Record<string, string[]> };

    expect(response.status).toBe(400);
    expect(body.errors._form?.[0]).toContain("same size and color");
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

    const response = await GET(createGetRequest(), routeParams);
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(404);
    expect(body.message).toBe("Not found.");
    expect(mocks.prisma.productVariant.findMany).not.toHaveBeenCalled();
  });
});
