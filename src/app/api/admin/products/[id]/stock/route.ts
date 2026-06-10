import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "~/lib/admin";
import { validateSameOriginRequest } from "~/lib/csrf";
import { prisma } from "~/lib/prisma";
import { rateLimit } from "~/lib/rate-limit";

type StockRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const productParamsSchema = z.object({
  id: z.string().min(1, "Product ID is required."),
});

const updateProductStockSchema = z.object({
  stock: z.coerce
    .number()
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative."),
});

const productStockSelect = {
  id: true,
  name: true,
  slug: true,
  stock: true,
  isArchived: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

type ProductStockResponse = Prisma.ProductGetPayload<{
  select: typeof productStockSelect;
}>;

function serializeProductStock(product: ProductStockResponse) {
  return {
    ...product,
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function PATCH(request: Request, { params }: StockRouteProps) {
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

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = updateProductStockSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        message: "Invalid input.",
        errors: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.update({
      where: {
        id: parsedParams.data.id,
      },
      data: {
        stock: parsedBody.data.stock,
      },
      select: productStockSelect,
    });

    return NextResponse.json({
      message: "Product stock updated successfully.",
      product: serializeProductStock(product),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Failed to update product stock." },
      { status: 500 },
    );
  }
}
