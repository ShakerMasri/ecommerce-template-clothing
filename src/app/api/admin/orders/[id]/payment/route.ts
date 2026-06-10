import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "~/lib/admin";
import { prisma } from "~/lib/prisma";
import {
  adminOrderParamsSchema,
  updateAdminOrderPaymentSchema,
} from "~/server/validations/admin-order";
import { rateLimit } from "~/lib/rate-limit";
import { validateSameOriginRequest } from "~/lib/csrf";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const orderPaymentSelect = {
  id: true,
  status: true,
  totalAmount: true,
  paymentMethod: true,
  paymentStatus: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

type OrderPaymentResponse = Prisma.OrderGetPayload<{
  select: typeof orderPaymentSelect;
}>;

function serializeOrderPayment(order: OrderPaymentResponse) {
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
  const parsedBody = updateAdminOrderPaymentSchema.safeParse(body);

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
    const order = await prisma.order.findUnique({
      where: {
        id: parsedParams.data.id,
      },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 },
      );
    }

    if (order.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      return NextResponse.json(
        { message: "Only cash-on-delivery orders can be marked as paid here." },
        { status: 400 },
      );
    }

    if (order.status !== OrderStatus.DELIVERED) {
      return NextResponse.json(
        { message: "Only delivered orders can be marked as paid." },
        { status: 400 },
      );
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      const currentOrder = await prisma.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
        select: orderPaymentSelect,
      });

      return NextResponse.json({
        message: "Order is already marked as paid.",
        order: serializeOrderPayment(currentOrder),
      });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus: parsedBody.data.paymentStatus,
      },
      select: orderPaymentSelect,
    });

    return NextResponse.json({
      message: "Order payment status updated successfully.",
      order: serializeOrderPayment(updatedOrder),
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to update payment status." },
      { status: 500 },
    );
  }
}
