import { OrderStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";

const positiveIntegerFromQuery = (fallback: number, max: number) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      return Number(value);
    }, z.number().int().min(1).max(max))
    .default(fallback);

export const adminOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  q: z.string().trim().max(100, "Search is too long.").optional(),
  deliveryAreaKey: z
    .string()
    .trim()
    .max(80, "Delivery area filter is too long.")
    .optional(),
  page: positiveIntegerFromQuery(1, 10_000),
  limit: positiveIntegerFromQuery(20, 50),
});

export const adminOrderParamsSchema = z.object({
  id: z.string().cuid("Invalid order ID."),
});

export const updateAdminOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const updateAdminOrderPaymentSchema = z.object({
  paymentStatus: z.literal(PaymentStatus.PAID),
});

export const updateAdminOrderNoteSchema = z.object({
  adminNote: z.string().trim().max(1000, "Admin note is too long.").nullable(),
});
