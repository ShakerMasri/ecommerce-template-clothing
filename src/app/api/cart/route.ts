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
        productVariantId: true,
        productVariant: {
          select: {
            id: true,
            sizeLabel: true,
            colorLabel: true,
            stock: true,
            isActive: true,
          },
        },
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
            variants: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                stock: true,
              },
            },
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

    const safeCartItems = cartItems.map((item) => {
      const hasActiveVariants = item.product.variants.length > 0;
      const variantStock = item.product.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
      );
      const selectedVariant = item.productVariant?.isActive
        ? item.productVariant
        : null;
      const availableStock = selectedVariant
        ? selectedVariant.stock
        : hasActiveVariants
          ? 0
          : item.product.stock;

      return {
        id: item.id,
        quantity: item.quantity,
        productVariantId: item.productVariantId,
        productVariant: selectedVariant
          ? {
              id: selectedVariant.id,
              sizeLabel: selectedVariant.sizeLabel,
              colorLabel: selectedVariant.colorLabel,
              stock: selectedVariant.stock,
              isActive: selectedVariant.isActive,
            }
          : null,
        availableStock,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price.toString(),
          discountPrice: item.product.discountPrice?.toString() ?? null,
          stock: hasActiveVariants ? variantStock : item.product.stock,
          images: item.product.images,
          isArchived: item.product.isArchived,
          hasVariants: hasActiveVariants,
          category: item.product.category,
        },
      };
    });

    return NextResponse.json({ cartItems: safeCartItems, customer });
  } catch {
    return NextResponse.json(
      { message: "Failed to load cart." },
      { status: 500 },
    );
  }
}
