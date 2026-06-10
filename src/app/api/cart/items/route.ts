import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { auth } from "~/server/auth";
import { addCartItemSchema } from "~/server/validations/cart";
import { rateLimit } from "~/lib/rate-limit";
import { validateSameOriginRequest } from "~/lib/csrf";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be logged in to add items to your cart." },
      { status: 401 },
    );
  }
  const csrfResponse = validateSameOriginRequest(request);

  if (csrfResponse) {
    return csrfResponse;
  }

  const userId = session.user.id;

  const limited = await rateLimit(request, "cartMutation", userId);

  if (!limited.ok) {
    return limited.response;
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = addCartItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid cart item data." },
      { status: 400 },
    );
  }

  const { productId, quantity } = parsed.data;

  try {
    const cartItem = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
          stock: true,
          isArchived: true,
        },
      });

      if (!product || product.isArchived) {
        throw new Error("PRODUCT_NOT_AVAILABLE");
      }

      if (quantity > product.stock) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (existingCartItem) {
        const nextQuantity = existingCartItem.quantity + quantity;

        if (nextQuantity > product.stock) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        return tx.cartItem.update({
          where: {
            id: existingCartItem.id,
          },
          data: {
            quantity: nextQuantity,
          },
        });
      }

      return tx.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
        },
      });
    });

    return NextResponse.json({
      message: "Item added to cart.",
      cartItem,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_AVAILABLE") {
      return NextResponse.json(
        { message: "Product is not available." },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { message: "Not enough stock available." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to add item to cart." },
      { status: 500 },
    );
  }
}
