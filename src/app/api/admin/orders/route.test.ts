import { OrderStatus, PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("~/lib/admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("~/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

import { GET } from "./route";

describe("admin orders list route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireAdmin.mockResolvedValue({
      ok: true,
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    mocks.prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) => {
      return Promise.all(queries);
    });

    mocks.prisma.order.count.mockResolvedValue(0);
    mocks.prisma.order.findMany.mockResolvedValue([]);
  });

  it("paginates orders on the server", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/admin/orders?page=2&limit=10"),
    );
    const body = (await response.json()) as {
      pagination: { page: number; limit: number; total: number };
    };

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasPreviousPage: true,
      hasNextPage: false,
    });
    expect(mocks.prisma.order.count).toHaveBeenCalledWith({
      where: {},
    });
    expect(mocks.prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
  });

  it("passes validated filters to Prisma", async () => {
    const response = await GET(
      new Request(
        `http://localhost:3000/api/admin/orders?status=${OrderStatus.PENDING}&paymentStatus=${PaymentStatus.UNPAID}&q=059`,
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.prisma.order.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        OR: expect.any(Array),
      }),
    });
  });

  it("rejects invalid query params", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/admin/orders?limit=500"),
    );

    expect(response.status).toBe(400);
    expect(mocks.prisma.order.findMany).not.toHaveBeenCalled();
  });
});
