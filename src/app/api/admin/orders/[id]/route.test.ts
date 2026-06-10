import { beforeEach, describe, expect, it, vi } from "vitest";

const validOrderId = "clh1q2w3e000008l4a5b6c7d8";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prisma: {
    order: {
      findUnique: vi.fn(),
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

function createRouteContext() {
  return {
    params: Promise.resolve({ id: validOrderId }),
  };
}

describe("admin order detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireAdmin.mockResolvedValue({
      ok: true,
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  it("returns 404 when the order does not exist", async () => {
    mocks.prisma.order.findUnique.mockResolvedValue(null);

    const response = await GET(
      new Request(`http://localhost:3000/api/admin/orders/${validOrderId}`),
      createRouteContext(),
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(404);
    expect(body.message).toBe("Order not found.");
  });
});
