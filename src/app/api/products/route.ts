import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { productQuerySchema } from "~/server/validations/product";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = productQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid query parameters." },
      { status: 400 },
    );
  }

  const { category } = parsed.data;

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isArchived: false,
          ...(category
            ? {
                category: {
                  slug: category,
                },
              }
            : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          discountPrice: true,
          stock: true,
          images: true,
          isFeatured: true,
          showStock: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),

      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
    ]);

    const safeProducts = products.map((product) => ({
      ...product,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString() ?? null,
    }));

    return NextResponse.json({
      products: safeProducts,
      categories,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to load products." },
      { status: 500 },
    );
  }
}
