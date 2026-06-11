import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    user: {
      findUnique: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    cartItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      updateMany: vi.fn(),
    },
  };

  return {
    auth: vi.fn(),
    rateLimit: vi.fn(),
    validateSameOriginRequest: vi.fn(),
    getDeliveryAreaByKey: vi.fn(),
    isDeliveryAreaKey: vi.fn(),
    tx,
    prisma: {
      $transaction: vi.fn(),
      order: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock("~/server/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("~/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
}));

vi.mock("~/lib/csrf", () => ({
  validateSameOriginRequest: mocks.validateSameOriginRequest,
}));

vi.mock("~/lib/delivery", () => ({
  getDeliveryAreaByKey: mocks.getDeliveryAreaByKey,
  isDeliveryAreaKey: mocks.isDeliveryAreaKey,
}));

vi.mock("~/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

import { POST } from "./route";

function createRequest(body: unknown) {
  return new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

function createOrderInput() {
  return {
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    deliveryAreaKey: "west_bank_cities",
    deliveryCity: "Ramallah",
    deliveryAddress: "Main street, building 12",
    deliveryNotes: "Call before arriving",
    pickupAgreementAccepted: false,
  };
}

describe("customer order route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.auth.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    mocks.rateLimit.mockResolvedValue({
      ok: true,
    });

    mocks.validateSameOriginRequest.mockReturnValue(null);

    mocks.getDeliveryAreaByKey.mockReturnValue({
      key: "west_bank_cities",
      priceNis: 20,
    });

    mocks.isDeliveryAreaKey.mockReturnValue(true);

    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => Promise<unknown>) => {
        return callback(mocks.tx);
      },
    );

    mocks.tx.user.findUnique.mockResolvedValue({
      name: "Test Customer",
      email: "customer@example.com",
      emailVerified: true,
      phone: "+970599000000",
    });

    mocks.tx.order.findUnique.mockResolvedValue(null);
    mocks.tx.cartItem.findMany.mockResolvedValue([
      {
        id: "cart-item-1",
        quantity: 2,
        productId: "product-1",
        productVariantId: null,
        productVariant: null,
        product: {
          id: "product-1",
          name: "Figure",
          slug: "figure",
          price: new Prisma.Decimal("50.00"),
          discountPrice: new Prisma.Decimal("40.00"),
          stock: 5,
          images: ["https://example.com/image.jpg"],
          isArchived: false,
          variants: [],
        },
      },
    ]);

    mocks.tx.order.create.mockResolvedValue({
      id: "order-1",
      status: "PENDING",
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "UNPAID",
      totalAmount: new Prisma.Decimal("100.00"),
      deliveryAreaKey: "west_bank_cities",
      deliveryPrice: new Prisma.Decimal("20.00"),
      deliveryCity: "Ramallah",
      deliveryAddress: "Main street, building 12",
      deliveryNotes: "Call before arriving",
      pickupAgreementAccepted: false,
      createdAt: new Date("2026-05-24T10:00:00.000Z"),
      items: [
        {
          id: "order-item-1",
          quantity: 2,
          priceAtPurchase: new Prisma.Decimal("40.00"),
          subtotalAmount: new Prisma.Decimal("80.00"),
          productNameAtPurchase: "Figure",
          productSlugAtPurchase: "figure",
          productImagesAtPurchase: ["https://example.com/image.jpg"],
          productVariantId: null,
          selectedSizeLabel: null,
          selectedColorLabel: null,
          selectedSku: null,
        },
      ],
    });

    mocks.tx.cartItem.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("creates a pending order without deducting stock", async () => {
    const response = await POST(createRequest(createOrderInput()));
    const body = (await response.json()) as {
      message: string;
      order: {
        status: string;
      };
    };

    expect(response.status).toBe(200);
    expect(body.order.status).toBe("PENDING");
    expect(body.message).toContain("confirm it by WhatsApp or phone");
    expect(mocks.tx.product.updateMany).not.toHaveBeenCalled();
    expect(mocks.tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deliveryAreaKey: "west_bank_cities",
          items: expect.objectContaining({
            create: [
              expect.objectContaining({
                productId: "product-1",
                productVariantId: null,
                quantity: 2,
                priceAtPurchase: new Prisma.Decimal("40.00"),
                subtotalAmount: new Prisma.Decimal("80.00"),
                selectedSizeLabel: null,
                selectedColorLabel: null,
                selectedSku: null,
              }),
            ],
          }),
        }),
      }),
    );

    const createPayload = mocks.tx.order.create.mock.calls[0]?.[0];

    expect(createPayload?.data.deliveryPrice.toString()).toBe("20");
    expect(createPayload?.data.totalAmount.toString()).toBe("100");
  });

  it("snapshots selected variant details for variant cart items", async () => {
    mocks.tx.cartItem.findMany.mockResolvedValue([
      {
        id: "cart-item-1",
        quantity: 2,
        productId: "product-1",
        productVariantId: "variant-1",
        productVariant: {
          id: "variant-1",
          productId: "product-1",
          sizeLabel: "M",
          colorLabel: "Black",
          sku: "shirt-black-m",
          stock: 5,
          isActive: true,
        },
        product: {
          id: "product-1",
          name: "Classic cotton t-shirt",
          slug: "classic-cotton-t-shirt",
          price: new Prisma.Decimal("50.00"),
          discountPrice: new Prisma.Decimal("40.00"),
          stock: 0,
          images: ["https://example.com/image.jpg"],
          isArchived: false,
          variants: [{ id: "variant-1" }],
        },
      },
    ]);

    const response = await POST(createRequest(createOrderInput()));

    expect(response.status).toBe(200);
    expect(mocks.tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: expect.objectContaining({
            create: [
              expect.objectContaining({
                productId: "product-1",
                productVariantId: "variant-1",
                selectedSizeLabel: "M",
                selectedColorLabel: "Black",
                selectedSku: "shirt-black-m",
              }),
            ],
          }),
        }),
      }),
    );
  });

  it("requires a variant when the product has active variants", async () => {
    mocks.tx.cartItem.findMany.mockResolvedValue([
      {
        id: "cart-item-1",
        quantity: 1,
        productId: "product-1",
        productVariantId: null,
        productVariant: null,
        product: {
          id: "product-1",
          name: "Classic cotton t-shirt",
          slug: "classic-cotton-t-shirt",
          price: new Prisma.Decimal("50.00"),
          discountPrice: null,
          stock: 10,
          images: [],
          isArchived: false,
          variants: [{ id: "variant-1" }],
        },
      },
    ]);

    const response = await POST(createRequest(createOrderInput()));
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toContain("selected size or color");
    expect(mocks.tx.order.create).not.toHaveBeenCalled();
  });

  it("rejects client-supplied delivery prices", async () => {
    const response = await POST(
      createRequest({
        ...createOrderInput(),
        deliveryPrice: 0,
      }),
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid order request.");
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.tx.order.create).not.toHaveBeenCalled();
  });
});
