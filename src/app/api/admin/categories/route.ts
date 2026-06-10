import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "~/lib/admin";
import { getReferenceMessage, logError } from "~/lib/logger";
import { prisma } from "~/lib/prisma";
import { createCategorySchema } from "~/lib/validations";
import { rateLimit } from "~/lib/rate-limit";
import { validateSameOriginRequest } from "~/lib/csrf";
import { adminCategoriesQuerySchema } from "~/server/validations/product";

const adminCategorySelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect;

const adminCategoryListSelect = {
  ...adminCategorySelect,
  _count: {
    select: {
      products: true,
    },
  },
} satisfies Prisma.CategorySelect;

function getCategoryOrderBy(
  sort: "name_asc" | "name_desc" | "newest" | "oldest",
): Prisma.CategoryOrderByWithRelationInput {
  switch (sort) {
    case "name_desc":
      return { name: "desc" };
    case "newest":
      return { createdAt: "desc" };
    case "oldest":
      return { createdAt: "asc" };
    case "name_asc":
    default:
      return { name: "asc" };
  }
}

function buildCategoryWhere(filters: {
  q?: string;
  usage: "all" | "with_products" | "empty";
}) {
  const where: Prisma.CategoryWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.usage === "with_products") {
    where.products = { some: {} };
  }

  if (filters.usage === "empty") {
    where.products = { none: {} };
  }

  return where;
}

export async function POST(request: Request) {
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

  const body: unknown = await request.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid input.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.category.create({
      data: parsed.data,
      select: adminCategorySelect,
    });

    return NextResponse.json({
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
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

    const errorId = logError("Failed to create admin category.", error, {
      action: "admin.categories.create",
      route: "/api/admin/categories",
      adminUserId: admin.user.id,
    });

    return NextResponse.json(
      { message: getReferenceMessage("Failed to create category.", errorId) },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }

  const url = new URL(request.url);
  const parsedQuery = adminCategoriesQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        message: "Invalid filters.",
        errors: parsedQuery.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const filters = parsedQuery.data;
  const where = buildCategoryWhere(filters);
  const skip = (filters.page - 1) * filters.limit;

  try {
    const [total, categories] = await prisma.$transaction([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        orderBy: getCategoryOrderBy(filters.sort),
        skip,
        take: filters.limit,
        select: adminCategoryListSelect,
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / filters.limit));

    return NextResponse.json({
      categories,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    const errorId = logError("Failed to load admin categories.", error, {
      action: "admin.categories.list",
      route: "/api/admin/categories",
      adminUserId: admin.user.id,
    });

    return NextResponse.json(
      { message: getReferenceMessage("Failed to load categories.", errorId) },
      { status: 500 },
    );
  }
}
