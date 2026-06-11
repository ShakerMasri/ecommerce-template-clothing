import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  rateLimit: vi.fn(),
  validateSameOriginRequest: vi.fn(),
  prisma: {
    productVariant: {
      findUnique: vi.fn(),
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

vi.mock("~/lib/logger", () => ({
  getReferenceMessage: (message: string, errorId: string) =>
    `${message} Reference: ${errorId}`,
  logError: vi.fn(() => "err_test"),
}));

import { DELETE, PATCH } from "./route";

const productId = "clh1q2w3e000008l4a5b6c7d8";
const variantId = "clh1q2w3e000108l4a5b6c7d9";

const routeParams = {
  params: Promise.resolve({ id: productId, variantId }),
};

function createPatchRequest(body: unknown) {
  return new Request(
    `http://localhost:3000/api/admin/products/${productId}/variants/${variantId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    },
  );
}

function createDeleteRequest() {
  return new Request(
    `http://localhost:3000/api/admin/products/${productId}/variants/${variantId}`,
    {
      method: "DELETE",
      headers: {
        origin: "http://localhost:3000",
      },
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
    sku: "shirt-m-black",
    stock: 5,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

describe("admin single product variant route", () => {
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
    mocks.prisma.productVariant.findUnique.mockResolvedValue({
      id: variantId,
      productId,
      sizeLabel: "M",
      colorLabel: "Black",
    });
  });

  it("updates a variant owned by the route product", async () => {
    mocks.prisma.productVariant.update.mockResolvedValue(
      createVariant({ stock: 9, colorLabel: "Navy", colorKey: "navy" }),
    );

    const response = await PATCH(
      createPatchRequest({ colorLabel: " Navy ", stock: "9" }),
      routeParams,
    );
    const body = (await response.json()) as {
      variant: { colorLabel: string; stock: number };
    };

    expect(response.status).toBe(200);
    expect(body.variant.colorLabel).toBe("Navy");
    expect(body.variant.stock).toBe(9);
    expect(mocks.prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: variantId },
        data: expect.objectContaining({
          colorLabel: "Navy",
          colorKey: "navy",
          stock: 9,
        }),
      }),
    );
  });

  it("rejects updates for a variant owned by another product", async () => {
    mocks.prisma.productVariant.findUnique.mockResolvedValue({
      id: variantId,
      productId: "clh1q2w3e000208l4a5b6c7e0",
      sizeLabel: "M",
      colorLabel: "Black",
    });

    const response = await PATCH(
      createPatchRequest({ colorLabel: "Navy", stock: "9" }),
      routeParams,
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(404);
    expect(body.message).toBe("Not found.");
    expect(mocks.prisma.productVariant.update).not.toHaveBeenCalled();
  });

  it("returns SKU uniqueness errors clearly", async () => {
    mocks.prisma.productVariant.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["sku"] },
      }),
    );

    const response = await PATCH(
      createPatchRequest({ sku: "duplicate-sku" }),
      routeParams,
    );
    const body = (await response.json()) as { errors: Record<string, string[]> };

    expect(response.status).toBe(400);
    expect(body.errors.sku?.[0]).toContain("already used");
  });

  it("soft-deactivates a variant instead of hard-deleting it", async () => {
    mocks.prisma.productVariant.update.mockResolvedValue(
      createVariant({ isActive: false }),
    );

    const response = await DELETE(createDeleteRequest(), routeParams);
    const body = (await response.json()) as { variant: { isActive: boolean } };

    expect(response.status).toBe(200);
    expect(body.variant.isActive).toBe(false);
    expect(mocks.prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: variantId },
        data: { isActive: false },
      }),
    );
  });
});
