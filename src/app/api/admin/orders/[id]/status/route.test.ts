import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const validOrderId = "clh1q2w3e000008l4a5b6c7d8";

const mocks = vi.hoisted(() => {
  const tx = {
    order: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      updateMany: vi.fn(),
    },
    product: {
      updateMany: vi.fn(),
    },
  };

  return {
    requireAdmin: vi.fn(),
    rateLimit: vi.fn(),
    validateSameOriginRequest: vi.fn(),
    tx,
    prisma: {
      $transaction: vi.fn(),
    },
  };
});

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

import { PATCH } from "./route";

function createRequest(status: OrderStatus) {
  return new Request(`http://localhost:3000/api/admin/orders/${validOrderId}/status`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify({ status }),
  });
}

function createRouteContext() {
  return {
    params: Promise.resolve({ id: validOrderId }),
  };
}

function createSavedOrder(status: OrderStatus) {
  return {
    id: validOrderId,
    status,
    totalAmount: new Prisma.Decimal("120.00"),
    paymentMethod: "CASH_ON_DELIVERY",
    paymentStatus: PaymentStatus.UNPAID,
    adminNote: null,
    updatedAt: new Date("2026-05-24T10:00:00.000Z"),
  };
}

describe("admin order status route", () => {
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

    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => Promise<unknown>) => {
        return callback(mocks.tx);
      },
    );

    mocks.tx.product.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.order.updateMany.mockResolvedValue({ count: 1 });
  });

  it("deducts stock when an admin confirms a new pending order", async () => {
    mocks.tx.order.findUnique.mockResolvedValue({
      id: validOrderId,
      status: OrderStatus.PENDING,
      stockDeductedAt: null,
      items: [
        {
          productId: "product-1",
          quantity: 2,
        },
      ],
    });

    mocks.tx.order.findUniqueOrThrow.mockResolvedValue(
      createSavedOrder(OrderStatus.PROCESSING),
    );

    const response = await PATCH(
      createRequest(OrderStatus.PROCESSING),
      createRouteContext(),
    );
    const body = (await response.json()) as { order: { status: OrderStatus } };

    expect(response.status).toBe(200);
    expect(body.order.status).toBe(OrderStatus.PROCESSING);
    expect(mocks.tx.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: "product-1",
        isArchived: false,
        stock: {
          gte: 2,
        },
      },
      data: {
        stock: {
          decrement: 2,
        },
      },
    });
    expect(mocks.tx.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: validOrderId,
        status: OrderStatus.PENDING,
        stockDeductedAt: null,
      },
      data: {
        status: OrderStatus.PROCESSING,
        stockDeductedAt: expect.any(Date),
      },
    });
  });

  it("does not deduct stock again for old pending orders already marked as deducted", async () => {
    mocks.tx.order.findUnique.mockResolvedValue({
      id: validOrderId,
      status: OrderStatus.PENDING,
      stockDeductedAt: new Date("2026-05-20T10:00:00.000Z"),
      items: [
        {
          productId: "product-1",
          quantity: 2,
        },
      ],
    });

    mocks.tx.order.findUniqueOrThrow.mockResolvedValue(
      createSavedOrder(OrderStatus.PROCESSING),
    );

    const response = await PATCH(
      createRequest(OrderStatus.PROCESSING),
      createRouteContext(),
    );

    expect(response.status).toBe(200);
    expect(mocks.tx.product.updateMany).not.toHaveBeenCalled();
    expect(mocks.tx.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: validOrderId,
        status: OrderStatus.PENDING,
      },
      data: {
        status: OrderStatus.PROCESSING,
      },
    });
  });

  it("fails confirmation without changing the order when stock is not enough", async () => {
    mocks.tx.order.findUnique.mockResolvedValue({
      id: validOrderId,
      status: OrderStatus.PENDING,
      stockDeductedAt: null,
      items: [
        {
          productId: "product-1",
          quantity: 3,
        },
      ],
    });

    mocks.tx.product.updateMany.mockResolvedValue({ count: 0 });

    const response = await PATCH(
      createRequest(OrderStatus.PROCESSING),
      createRouteContext(),
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(409);
    expect(body.message).toContain("do not have enough stock");
    expect(mocks.tx.order.updateMany).not.toHaveBeenCalled();
  });

  it("does not restock when cancelling a new pending order that did not deduct stock", async () => {
    mocks.tx.order.findUnique.mockResolvedValue({
      id: validOrderId,
      status: OrderStatus.PENDING,
      stockDeductedAt: null,
      items: [
        {
          productId: "product-1",
          quantity: 1,
        },
      ],
    });

    mocks.tx.order.findUniqueOrThrow.mockResolvedValue(
      createSavedOrder(OrderStatus.CANCELLED),
    );

    const response = await PATCH(
      createRequest(OrderStatus.CANCELLED),
      createRouteContext(),
    );

    expect(response.status).toBe(200);
    expect(mocks.tx.product.updateMany).not.toHaveBeenCalled();
    expect(mocks.tx.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: validOrderId,
        status: OrderStatus.PENDING,
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
  });

  it("restocks when cancelling an order that already deducted stock", async () => {
    mocks.tx.order.findUnique.mockResolvedValue({
      id: validOrderId,
      status: OrderStatus.PROCESSING,
      stockDeductedAt: new Date("2026-05-24T10:00:00.000Z"),
      items: [
        {
          productId: "product-1",
          quantity: 1,
        },
      ],
    });

    mocks.tx.order.findUniqueOrThrow.mockResolvedValue(
      createSavedOrder(OrderStatus.CANCELLED),
    );

    const response = await PATCH(
      createRequest(OrderStatus.CANCELLED),
      createRouteContext(),
    );

    expect(response.status).toBe(200);
    expect(mocks.tx.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      data: {
        stock: {
          increment: 1,
        },
      },
    });
    expect(mocks.tx.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: validOrderId,
        status: OrderStatus.PROCESSING,
      },
      data: {
        status: OrderStatus.CANCELLED,
        stockDeductedAt: null,
      },
    });
  });
});
