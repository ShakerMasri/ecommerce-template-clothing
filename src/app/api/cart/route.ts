import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { auth } from "~/server/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be logged in to view your cart." },
      { status: 401 },
    );
  }

  try {
    const customer = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Your account could not be found." },
        { status: 401 },
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        quantity: true,
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
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const safeCartItems = cartItems.map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: item.product.price.toString(),
        discountPrice: item.product.discountPrice?.toString() ?? null,
      },
    }));

    return NextResponse.json({ cartItems: safeCartItems, customer });
  } catch {
    return NextResponse.json(
      { message: "Failed to load cart." },
      { status: 500 },
    );
  }
}
