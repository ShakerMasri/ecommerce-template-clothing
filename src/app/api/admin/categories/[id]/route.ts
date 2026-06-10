import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "~/lib/admin";
import { prisma } from "~/lib/prisma";
import { createCategorySchema } from "~/lib/validations";
import { rateLimit } from "~/lib/rate-limit";
import { validateSameOriginRequest } from "~/lib/csrf";

type CategoryRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const paramsSchema = z.object({
  id: z.string().min(1),
});

// reuse schema but partial for update
const updateCategorySchema = createCategorySchema.partial();
function categoryInUseResponse() {
  return NextResponse.json(
    {
      message: "Cannot delete category.",
      errors: {
        _form: ["Category is used by existing products."],
      },
    },
    { status: 409 },
  );
}

export async function PATCH(request: Request, { params }: CategoryRouteProps) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const csrfResponse = validateSameOriginRequest(request);

  if (csrfResponse) {
    return csrfResponse;
  }
  const limited = await rateLimit(request, "adminMutation", admin.user.id);

  if (!limited.ok) {
    return limited.response;
  }

  const { id } = await params;
  const parsedParams = paramsSchema.safeParse({ id });

  if (!parsedParams.success) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = updateCategorySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        message: "Invalid input.",
        errors: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (Object.keys(parsedBody.data).length === 0) {
    return NextResponse.json(
      {
        message: "Invalid input.",
        errors: { _form: ["At least one field is required."] },
      },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.category.update({
      where: { id: parsedParams.data.id },
      data: parsedBody.data,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json({
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message: "Invalid input.",
          errors: {
            slug: ["This slug is already used."],
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to update category." },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request, { params }: CategoryRouteProps) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const csrfResponse = validateSameOriginRequest(request);

  if (csrfResponse) {
    return csrfResponse;
  }
  const limited = await rateLimit(request, "adminMutation", admin.user.id);

  if (!limited.ok) {
    return limited.response;
  }

  const { id } = await params;
  const parsedParams = paramsSchema.safeParse({ id });

  if (!parsedParams.success) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  try {
    // 🔴 IMPORTANT: check if category is used
    const productCount = await prisma.product.count({
      where: {
        categoryId: parsedParams.data.id,
      },
    });

    if (productCount > 0) {
      return categoryInUseResponse();
    }

    await prisma.category.delete({
      where: {
        id: parsedParams.data.id,
      },
    });

    return NextResponse.json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return categoryInUseResponse();
    }

    return NextResponse.json(
      { message: "Failed to delete category." },
      { status: 500 },
    );
  }
}
