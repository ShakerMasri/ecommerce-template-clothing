import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "~/lib/admin";
import { validateSameOriginRequest } from "~/lib/csrf";
import { prisma } from "~/lib/prisma";
import { rateLimit } from "~/lib/rate-limit";

type RestoreProductRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const productParamsSchema = z.object({
  id: z.string().min(1, "Product ID is required."),
});

const adminProductSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  stock: true,
  images: true,
  isArchived: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProductSelect;

type AdminProduct = Prisma.ProductGetPayload<{
  select: typeof adminProductSelect;
}>;

function serializeProduct(product: AdminProduct) {
  return {
    ...product,
    price: product.price.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function POST(
  request: Request,
  { params }: RestoreProductRouteProps,
) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }
  const csrfResponse = validateSameOriginRequest(request);

  if (csrfResponse) {
    return csrfResponse;
  }

  const limited = await rateLimit(request, "adminMutation", admin.user.id);

  if (!limited.ok) {
    return limited.response;
  }

  const { id } = await params;
  const parsedParams = productParamsSchema.safeParse({ id });

  if (!parsedParams.success) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  try {
    const product = await prisma.product.update({
      where: {
        id: parsedParams.data.id,
      },
      data: {
        isArchived: false,
      },
      select: adminProductSelect,
    });

    return NextResponse.json({
      message: "Product restored successfully.",
      product: serializeProduct(product),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Failed to restore product." },
      { status: 500 },
    );
  }
}
