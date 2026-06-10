import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().cuid("Invalid product ID."),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export const cartItemParamsSchema = z.object({
  id: z.string().cuid("Invalid cart item ID."),
});
