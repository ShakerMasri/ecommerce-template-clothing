import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { rateLimit } from "~/lib/rate-limit";
import { productQuerySchema } from "~/server/validations/product";

export async function GET(request: Request) {
  const limited = await rateLimit(request, "publicRead");

  if (!limited.ok) {
    return limited.response;
  }

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
          images: true,
          isFeatured: true,
          showStock: true,
          _count: {
            select: {
              variants: true,
            },
          },
          variants: {
            where: {
              isActive: true,
            },
            select: {
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

    const safeProducts = products.map((product) => {
      const activeVariantStock = product.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0,
      );
      const hasVariants = product._count.variants > 0;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        stock: product.showStock ? activeVariantStock : null,
        isInStock: activeVariantStock > 0,
        images: product.images,
        isFeatured: product.isFeatured,
        showStock: product.showStock,
        category: product.category,
        hasVariants,
        price: product.price.toString(),
        discountPrice: product.discountPrice?.toString() ?? null,
      };
    });

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
