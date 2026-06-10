import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { validateSameOriginRequest } from "~/lib/csrf";
import { getDeliveryAreaByKey } from "~/lib/delivery";
import { prisma } from "~/lib/prisma";
import { getReferenceMessage, logError } from "~/lib/logger";
import { rateLimit } from "~/lib/rate-limit";
import { auth } from "~/server/auth";
import { getEffectiveProductPrice } from "~/server/pricing";
import { createOrderSchema } from "~/server/validations/order";

const orderSelect = {
  id: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  totalAmount: true,
  deliveryAreaKey: true,
  deliveryPrice: true,
  deliveryCity: true,
  deliveryAddress: true,
  deliveryNotes: true,
  pickupAgreementAccepted: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      quantity: true,
      priceAtPurchase: true,
      subtotalAmount: true,
      productNameAtPurchase: true,
      productSlugAtPurchase: true,
      productImagesAtPurchase: true,
    },
  },
} satisfies Prisma.OrderSelect;

type OrderWithItems = Prisma.OrderGetPayload<{
  select: typeof orderSelect;
}>;

function serializeOrder(order: OrderWithItems) {
  return {
    ...order,
    totalAmount: order.totalAmount.toString(),
    deliveryPrice: order.deliveryPrice.toString(),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      priceAtPurchase: item.priceAtPurchase.toString(),
      subtotalAmount: item.subtotalAmount.toString(),
    })),
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be logged in to view your orders." },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: orderSelect,
    });

    return NextResponse.json({
      orders: orders.map(serializeOrder),
    });
  } catch (error) {
    const errorId = logError("Failed to load customer orders.", error, {
      action: "orders.list",
      route: "/api/orders",
      userId,
    });

    return NextResponse.json(
      { message: getReferenceMessage("Failed to load orders.", errorId) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be logged in to place an order." },
      { status: 401 },
    );
  }

  const csrfResponse = validateSameOriginRequest(request);

  if (csrfResponse) {
    return csrfResponse;
  }

  const userId = session.user.id;

  const limited = await rateLimit(request, "orderCreate", userId);

  if (!limited.ok) {
    return limited.response;
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid order request." },
      { status: 400 },
    );
  }

  const {
    idempotencyKey,
    deliveryAreaKey,
    deliveryCity,
    deliveryAddress,
    deliveryNotes,
    pickupAgreementAccepted,
  } = parsed.data;

  const deliveryArea = getDeliveryAreaByKey(deliveryAreaKey);

  if (!deliveryArea) {
    return NextResponse.json(
      { message: "Please select a valid delivery area." },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          name: true,
          email: true,
          emailVerified: true,
          phone: true,
        },
      });

      if (!customer) {
        throw new Error("USER_NOT_FOUND");
      }

      if (!customer.emailVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      if (!customer.phone?.trim()) {
        throw new Error("PHONE_REQUIRED");
      }

      const existingOrder = await tx.order.findUnique({
        where: {
          userId_idempotencyKey: {
            userId,
            idempotencyKey,
          },
        },
        select: orderSelect,
      });

      if (existingOrder) {
        return existingOrder;
      }

      const cartItems = await tx.cartItem.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          quantity: true,
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              discountPrice: true,
              stock: true,
              images: true,
              isArchived: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw new Error("EMPTY_CART");
      }

      for (const item of cartItems) {
        if (item.product.isArchived) {
          throw new Error("PRODUCT_NOT_AVAILABLE");
        }

        if (item.quantity > item.product.stock) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const productsTotalAmount = cartItems.reduce((sum, item) => {
        const effectivePrice = getEffectiveProductPrice(item.product);

        return sum.plus(effectivePrice.mul(item.quantity));
      }, new Prisma.Decimal(0));

      // The browser sends only the delivery area key. Price comes from
      // server-side config so customers cannot lower delivery costs in devtools.
      const deliveryPrice = new Prisma.Decimal(deliveryArea.priceNis);
      const totalAmount = productsTotalAmount.plus(deliveryPrice);

      const createdOrder = await tx.order.create({
        data: {
          userId,
          idempotencyKey,
          totalAmount,
          deliveryAreaKey: deliveryArea.key,
          deliveryPrice,
          deliveryCity,
          deliveryAddress: deliveryAddress || null,
          deliveryNotes: deliveryNotes || null,
          pickupAgreementAccepted,
          paymentMethod: "CASH_ON_DELIVERY",
          paymentStatus: "UNPAID",
          customerNameAtPurchase: customer.name,
          customerEmailAtPurchase: customer.email,
          customerPhoneAtPurchase: customer.phone,
          items: {
            create: cartItems.map((item) => {
              const effectivePrice = getEffectiveProductPrice(item.product);

              return {
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: effectivePrice,
                subtotalAmount: effectivePrice.mul(item.quantity),
                productNameAtPurchase: item.product.name,
                productSlugAtPurchase: item.product.slug,
                productImagesAtPurchase: item.product.images,
              };
            }),
          },
        },
        select: orderSelect,
      });

      await tx.cartItem.deleteMany({
        where: {
          userId,
        },
      });

      return createdOrder;
    });

    return NextResponse.json({
      message:
        "Order placed successfully. The store owner will confirm it by WhatsApp or phone before processing.",
      order: serializeOrder(order),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { message: "Your account could not be found." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
      return NextResponse.json(
        { message: "Please verify your email before placing an order." },
        { status: 403 },
      );
    }

    if (error instanceof Error && error.message === "PHONE_REQUIRED") {
      return NextResponse.json(
        { message: "Please add a phone number before placing an order." },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "EMPTY_CART") {
      return NextResponse.json(
        { message: "Your cart is empty." },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "PRODUCT_NOT_AVAILABLE") {
      return NextResponse.json(
        { message: "One or more products are no longer available." },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { message: "One or more products do not have enough stock." },
        { status: 400 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingOrder = await prisma.order.findUnique({
        where: {
          userId_idempotencyKey: {
            userId,
            idempotencyKey,
          },
        },
        select: orderSelect,
      });

      if (existingOrder) {
        return NextResponse.json({
          message:
            "Order placed successfully. The store owner will confirm it by WhatsApp or phone before processing.",
          order: serializeOrder(existingOrder),
        });
      }
    }

    const errorId = logError("Failed to place customer order.", error, {
      action: "orders.create",
      route: "/api/orders",
      userId,
    });

    return NextResponse.json(
      { message: getReferenceMessage("Failed to place order.", errorId) },
      { status: 500 },
    );
  }
}
