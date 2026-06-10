import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "~/lib/admin";
import { getReferenceMessage, logError } from "~/lib/logger";
import { prisma } from "~/lib/prisma";
import { createProductSchema } from "~/lib/validations";
import { rateLimit } from "~/lib/rate-limit";
import { validateSameOriginRequest } from "~/lib/csrf";
import { adminProductsQuerySchema } from "~/server/validations/product";

const adminProductSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  discountPrice: true,
  stock: true,
  images: true,
  isArchived: true,
  isFeatured: true,
  showStock: true,
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

function serializeProduct(product: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
  stock: number;
  images: string[];
  isArchived: boolean;
  isFeatured: boolean;
  showStock: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}) {
  return {
    ...product,
    price: product.price.toString(),
    discountPrice: product.discountPrice?.toString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function getProductOrderBy(
  sort:
    | "newest"
    | "oldest"
    | "name_asc"
    | "name_desc"
    | "price_asc"
    | "price_desc"
    | "stock_asc"
    | "stock_desc",
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name_asc":
      return { name: "asc" };
    case "name_desc":
      return { name: "desc" };
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "stock_asc":
      return { stock: "asc" };
    case "stock_desc":
      return { stock: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

function buildProductWhere(filters: {
  q?: string;
  categoryId?: string;
  status: "all" | "active" | "archived";
  stock: "all" | "in_stock" | "out_of_stock" | "low_stock";
}) {
  const where: Prisma.ProductWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.status === "active") {
    where.isArchived = false;
  }

  if (filters.status === "archived") {
    where.isArchived = true;
  }

  if (filters.stock === "in_stock") {
    where.stock = { gt: 0 };
  }

  if (filters.stock === "out_of_stock") {
    where.stock = 0;
  }

  if (filters.stock === "low_stock") {
    where.stock = { gt: 0, lte: 5 };
  }

  return where;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }

  const url = new URL(request.url);
  const parsedQuery = adminProductsQuerySchema.safeParse(
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
  const where = buildProductWhere(filters);
  const skip = (filters.page - 1) * filters.limit;

  try {
    const [total, products, activeProducts, archivedProducts] =
      await prisma.$transaction([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          orderBy: getProductOrderBy(filters.sort),
          skip,
          take: filters.limit,
          select: adminProductSelect,
        }),
        prisma.product.count({ where: { isArchived: false } }),
        prisma.product.count({ where: { isArchived: true } }),
      ]);

    const totalPages = Math.max(1, Math.ceil(total / filters.limit));

    return NextResponse.json({
      products: products.map(serializeProduct),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
      summary: {
        activeProducts,
        archivedProducts,
      },
    });
  } catch (error) {
    const errorId = logError("Failed to load admin products.", error, {
      action: "admin.products.list",
      route: "/api/admin/products",
      adminUserId: admin.user.id,
    });

    return NextResponse.json(
      { message: getReferenceMessage("Failed to load products.", errorId) },
      { status: 500 },
    );
  }
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
  const parsed = createProductSchema.safeParse(body);

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
    const category = await prisma.category.findUnique({
      where: {
        id: parsed.data.categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          message: "Invalid input.",
          errors: {
            categoryId: ["Category not found."],
          },
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: parsed.data,
      select: adminProductSelect,
    });

    return NextResponse.json(
      {
        message: "Product created successfully.",
        product: serializeProduct(product),
      },
      { status: 201 },
    );
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

    const errorId = logError("Failed to create admin product.", error, {
      action: "admin.products.create",
      route: "/api/admin/products",
      adminUserId: admin.user.id,
    });

    return NextResponse.json(
      { message: getReferenceMessage("Failed to create product.", errorId) },
      { status: 500 },
    );
  }
}
