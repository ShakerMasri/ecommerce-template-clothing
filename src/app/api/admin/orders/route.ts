import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdmin } from "~/lib/admin";
import { prisma } from "~/lib/prisma";
import { adminOrdersQuerySchema } from "~/server/validations/admin-order";

const adminOrderSummarySelect = {
  id: true,
  status: true,
  totalAmount: true,
  paymentMethod: true,
  paymentStatus: true,
  customerNameAtPurchase: true,
  customerEmailAtPurchase: true,
  customerPhoneAtPurchase: true,
  deliveryAreaKey: true,
  deliveryPrice: true,
  deliveryCity: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  _count: {
    select: {
      items: true,
    },
  },
} satisfies Prisma.OrderSelect;

type AdminOrderSummary = Prisma.OrderGetPayload<{
  select: typeof adminOrderSummarySelect;
}>;

function serializeAdminOrderSummary(order: AdminOrderSummary) {
  const { _count, ...orderSummary } = order;

  return {
    ...orderSummary,
    totalAmount: order.totalAmount.toString(),
    deliveryPrice: order.deliveryPrice.toString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    itemCount: _count.items,
  };
}

type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

function buildAdminOrdersWhere(
  filters: AdminOrdersQuery,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.deliveryAreaKey) {
    where.deliveryAreaKey = filters.deliveryAreaKey;
  }

  const q = filters.q?.trim();

  if (q) {
    where.OR = [
      {
        id: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        customerNameAtPurchase: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        customerEmailAtPurchase: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        customerPhoneAtPurchase: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        deliveryCity: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        user: {
          is: {
            OR: [
              {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      },
    ];
  }

  return where;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }

  const url = new URL(request.url);

  const parsed = adminOrdersQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    paymentStatus: url.searchParams.get("paymentStatus") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    deliveryAreaKey: url.searchParams.get("deliveryAreaKey") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid query params.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { page, limit } = parsed.data;
  const where = buildAdminOrdersWhere(parsed.data);
  const skip = (page - 1) * limit;

  try {
    const [total, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        select: adminOrderSummarySelect,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      orders: orders.map(serializeAdminOrderSummary),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to load orders." },
      { status: 500 },
    );
  }
}
