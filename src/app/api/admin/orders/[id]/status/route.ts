import { OrderStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "~/lib/admin";
import { getReferenceMessage, logError } from "~/lib/logger";
import { validateSameOriginRequest } from "~/lib/csrf";
import { prisma } from "~/lib/prisma";
import { rateLimit } from "~/lib/rate-limit";
import {
  adminOrderParamsSchema,
  updateAdminOrderStatusSchema,
} from "~/server/validations/admin-order";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const orderStatusSelect = {
  id: true,
  status: true,
  totalAmount: true,
  paymentMethod: true,
  paymentStatus: true,
  adminNote: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

type OrderStatusResponse = Prisma.OrderGetPayload<{
  select: typeof orderStatusSelect;
}>;

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

function canChangeStatus(from: OrderStatus, to: OrderStatus) {
  if (from === to) {
    return true;
  }

  return allowedStatusTransitions[from].includes(to);
}

function serializeOrderStatus(order: OrderStatusResponse) {
  return {
    ...order,
    totalAmount: order.totalAmount.toString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
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
  const parsedParams = adminOrderParamsSchema.safeParse({ id });

  if (!parsedParams.success) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = updateAdminOrderStatusSchema.safeParse(body);

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
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id: parsedParams.data.id,
        },
        select: {
          id: true,
          status: true,
          stockDeductedAt: true,
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const nextStatus = parsedBody.data.status;

      if (!canChangeStatus(order.status, nextStatus)) {
        throw new Error("ILLEGAL_STATUS_TRANSITION");
      }

      if (order.status === nextStatus) {
        const currentOrder = await tx.order.findUniqueOrThrow({
          where: {
            id: order.id,
          },
          select: orderStatusSelect,
        });

        return currentOrder;
      }

      const isAdminConfirmation =
        order.status === OrderStatus.PENDING &&
        nextStatus === OrderStatus.PROCESSING;

      if (isAdminConfirmation && !order.stockDeductedAt) {
        for (const item of order.items) {
          if (!item.productId) {
            throw new Error("PRODUCT_LINK_MISSING");
          }

          const updateProductResult = await tx.product.updateMany({
            where: {
              id: item.productId,
              isArchived: false,
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          if (updateProductResult.count !== 1) {
            throw new Error("INSUFFICIENT_STOCK");
          }
        }

        const updateOrderResult = await tx.order.updateMany({
          where: {
            id: order.id,
            status: order.status,
            stockDeductedAt: null,
          },
          data: {
            status: nextStatus,
            stockDeductedAt: new Date(),
          },
        });

        if (updateOrderResult.count !== 1) {
          throw new Error("ORDER_STATUS_CHANGED");
        }
      } else {
        const updateData: Prisma.OrderUpdateManyMutationInput = {
          status: nextStatus,
        };

        if (nextStatus === OrderStatus.CANCELLED && order.stockDeductedAt) {
          for (const item of order.items) {
            if (!item.productId) {
              continue;
            }

            await tx.product.updateMany({
              where: {
                id: item.productId,
              },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }

          updateData.stockDeductedAt = null;
        }

        const updateOrderResult = await tx.order.updateMany({
          where: {
            id: order.id,
            status: order.status,
          },
          data: updateData,
        });

        if (updateOrderResult.count !== 1) {
          throw new Error("ORDER_STATUS_CHANGED");
        }
      }

      const savedOrder = await tx.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
        select: orderStatusSelect,
      });

      return savedOrder;
    });

    return NextResponse.json({
      message: "Order status updated successfully.",
      order: serializeOrderStatus(updatedOrder),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "ILLEGAL_STATUS_TRANSITION"
    ) {
      return NextResponse.json(
        { message: "This order status change is not allowed." },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "ORDER_STATUS_CHANGED") {
      return NextResponse.json(
        {
          message:
            "Order was updated by another request. Refresh and try again.",
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "PRODUCT_LINK_MISSING") {
      return NextResponse.json(
        {
          message:
            "One or more order items are no longer linked to products. Cancel this order or handle it manually.",
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        {
          message:
            "One or more products are unavailable or do not have enough stock to confirm this order.",
        },
        { status: 409 },
      );
    }

    const errorId = logError("Failed to update admin order status.", error, {
      action: "admin.orders.status.update",
      route: "/api/admin/orders/[id]/status",
      adminUserId: admin.user.id,
      orderId: parsedParams.data.id,
    });

    return NextResponse.json(
      {
        message: getReferenceMessage(
          "Failed to update order status.",
          errorId,
        ),
      },
      { status: 500 },
    );
  }
}
