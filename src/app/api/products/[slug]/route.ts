import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { productSlugSchema } from "~/server/validations/product";

type ProductRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, { params }: ProductRouteProps) {
  const { slug } = await params;

  const parsed = productSlugSchema.safeParse({ slug });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid product slug." },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        slug: parsed.data.slug,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        discountPrice: true,
        stock: true,
        images: true,
        isFeatured: true,
        showStock: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            sizeLabel: true,
            colorLabel: true,
            stock: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 },
      );
    }

    const variantStock = product.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0,
    );
    const hasVariants = product.variants.length > 0;

    return NextResponse.json({
      product: {
        ...product,
        stock: hasVariants ? variantStock : product.stock,
        hasVariants,
        price: product.price.toString(),
        discountPrice: product.discountPrice?.toString() ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to load product." },
      { status: 500 },
    );
  }
}
