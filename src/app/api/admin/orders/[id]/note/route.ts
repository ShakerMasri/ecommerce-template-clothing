import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "~/lib/admin";
import { prisma } from "~/lib/prisma";
import {
  adminOrderParamsSchema,
  updateAdminOrderNoteSchema,
} from "~/server/validations/admin-order";
import { rateLimit } from "~/lib/rate-limit";
import { validateSameOriginRequest } from "~/lib/csrf";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const orderNoteSelect = {
  id: true,
  adminNote: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

type OrderNoteResponse = Prisma.OrderGetPayload<{
  select: typeof orderNoteSelect;
}>;

function serializeOrderNote(order: OrderNoteResponse) {
  return {
    ...order,
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
  const parsedBody = updateAdminOrderNoteSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        message: "Invalid input.",
        errors: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const adminNote =
    parsedBody.data.adminNote === null || parsedBody.data.adminNote.length === 0
      ? null
      : parsedBody.data.adminNote;

  try {
    const order = await prisma.order.findUnique({
      where: {
        id: parsedParams.data.id,
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        adminNote,
      },
      select: orderNoteSelect,
    });

    return NextResponse.json({
      message: "Admin note updated successfully.",
      order: serializeOrderNote(updatedOrder),
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to update admin note." },
      { status: 500 },
    );
  }
}
