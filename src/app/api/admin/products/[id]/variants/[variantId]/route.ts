import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "~/lib/admin";
import { validateSameOriginRequest } from "~/lib/csrf";
import { getReferenceMessage, logError } from "~/lib/logger";
import { prisma } from "~/lib/prisma";
import { rateLimit } from "~/lib/rate-limit";
import {
  productVariantParamsSchema,
  updateProductVariantSchema,
} from "~/server/validations/product-variant";

type ProductVariantRouteProps = {
  params: Promise<{
    id: string;
    variantId: string;
  }>;
};

const adminProductVariantSelect = {
  id: true,
  productId: true,
  sizeLabel: true,
  colorLabel: true,
  sizeKey: true,
  colorKey: true,
  stock: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductVariantSelect;

type AdminProductVariant = Prisma.ProductVariantGetPayload<{
  select: typeof adminProductVariantSelect;
}>;

function serializeProductVariant(variant: AdminProductVariant) {
  return {
    ...variant,
    createdAt: variant.createdAt.toISOString(),
    updatedAt: variant.updatedAt.toISOString(),
  };
}

function notFoundResponse() {
  return NextResponse.json({ message: "Not found." }, { status: 404 });
}

function getUniqueVariantError(): Record<string, string[]> {
  return {
    _form: ["This product already has a variant with the same size and color."],
  };
}

async function findVariantForProduct(productId: string, variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, productId: true, sizeLabel: true, colorLabel: true },
  });

  if (variant?.productId !== productId) {
    return null;
  }

  return variant;
}

export async function PATCH(
  request: Request,
  { params }: ProductVariantRouteProps,
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

  const { id, variantId } = await params;
  const parsedParams = productVariantParamsSchema.safeParse({ id, variantId });

  if (!parsedParams.success || !parsedParams.data.variantId) {
    return notFoundResponse();
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = updateProductVariantSchema.safeParse(body);

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
    const existingVariant = await findVariantForProduct(
      parsedParams.data.id,
      parsedParams.data.variantId,
    );

    if (!existingVariant) {
      return notFoundResponse();
    }

    const nextSizeLabel =
      parsedBody.data.sizeLabel !== undefined
        ? parsedBody.data.sizeLabel
        : existingVariant.sizeLabel;
    const nextColorLabel =
      parsedBody.data.colorLabel !== undefined
        ? parsedBody.data.colorLabel
        : existingVariant.colorLabel;

    if (!nextSizeLabel && !nextColorLabel) {
      return NextResponse.json(
        {
          message: "Invalid input.",
          errors: {
            _form: ["At least a size or color is required."],
          },
        },
        { status: 400 },
      );
    }

    const variant = await prisma.productVariant.update({
      where: { id: parsedParams.data.variantId },
      data: parsedBody.data,
      select: adminProductVariantSelect,
    });

    return NextResponse.json({
      message: "Variant updated successfully.",
      variant: serializeProductVariant(variant),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message: "Invalid input.",
          errors: getUniqueVariantError(),
        },
        { status: 400 },
      );
    }

    const errorId = logError("Failed to update product variant.", error, {
      action: "admin.productVariants.update",
      route: "/api/admin/products/[id]/variants/[variantId]",
      adminUserId: admin.user.id,
      productId: parsedParams.data.id,
      variantId: parsedParams.data.variantId,
    });

    return NextResponse.json(
      { message: getReferenceMessage("Failed to update variant.", errorId) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: ProductVariantRouteProps,
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

  const { id, variantId } = await params;
  const parsedParams = productVariantParamsSchema.safeParse({ id, variantId });

  if (!parsedParams.success || !parsedParams.data.variantId) {
    return notFoundResponse();
  }

  try {
    const existingVariant = await findVariantForProduct(
      parsedParams.data.id,
      parsedParams.data.variantId,
    );

    if (!existingVariant) {
      return notFoundResponse();
    }

    const variant = await prisma.productVariant.update({
      where: { id: parsedParams.data.variantId },
      data: { isActive: false },
      select: adminProductVariantSelect,
    });

    return NextResponse.json({
      message: "Variant deactivated successfully.",
      variant: serializeProductVariant(variant),
    });
  } catch (error) {
    const errorId = logError("Failed to deactivate product variant.", error, {
      action: "admin.productVariants.deactivate",
      route: "/api/admin/products/[id]/variants/[variantId]",
      adminUserId: admin.user.id,
      productId: parsedParams.data.id,
      variantId: parsedParams.data.variantId,
    });

    return NextResponse.json(
      {
        message: getReferenceMessage("Failed to deactivate variant.", errorId),
      },
      { status: 500 },
    );
  }
}
