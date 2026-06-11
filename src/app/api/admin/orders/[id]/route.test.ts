import { Prisma } from "@prisma/client";
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

  it("returns variant snapshot fields for admin order details", async () => {
    mocks.prisma.order.findUnique.mockResolvedValue({
      id: validOrderId,
      status: "PENDING",
      totalAmount: new Prisma.Decimal("120.00"),
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "UNPAID",
      stockDeductedAt: new Date("2026-06-11T10:00:00.000Z"),
      adminNote: null,
      customerNameAtPurchase: "Test Customer",
      customerEmailAtPurchase: "customer@example.com",
      customerPhoneAtPurchase: "+970599000000",
      deliveryAreaKey: "west_bank_cities",
      deliveryPrice: new Prisma.Decimal("20.00"),
      deliveryCity: "Nablus",
      deliveryAddress: "Main street",
      deliveryNotes: null,
      pickupAgreementAccepted: false,
      createdAt: new Date("2026-06-11T09:00:00.000Z"),
      updatedAt: new Date("2026-06-11T10:00:00.000Z"),
      user: {
        id: "user-1",
        name: "Test Customer",
        email: "customer@example.com",
        phone: "+970599000000",
      },
      items: [
        {
          id: "item-1",
          quantity: 1,
          priceAtPurchase: new Prisma.Decimal("100.00"),
          subtotalAmount: new Prisma.Decimal("100.00"),
          productNameAtPurchase: "Classic cotton t-shirt",
          productSlugAtPurchase: "classic-cotton-t-shirt",
          productImagesAtPurchase: [],
          productId: "product-1",
          productVariantId: "variant-1",
          selectedSizeLabel: "M",
          selectedColorLabel: "Black",
          selectedSku: "shirt-black-m",
        },
      ],
    });

    const response = await GET(
      new Request(`http://localhost:3000/api/admin/orders/${validOrderId}`),
      createRouteContext(),
    );
    const body = (await response.json()) as {
      order: {
        stockDeductedAt: string | null;
        items: Array<{
          productVariantId: string | null;
          selectedSizeLabel: string | null;
          selectedColorLabel: string | null;
          selectedSku: string | null;
        }>;
      };
    };

    expect(response.status).toBe(200);
    expect(body.order.stockDeductedAt).toBe("2026-06-11T10:00:00.000Z");
    expect(body.order.items[0]).toMatchObject({
      productVariantId: "variant-1",
      selectedSizeLabel: "M",
      selectedColorLabel: "Black",
      selectedSku: "shirt-black-m",
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
