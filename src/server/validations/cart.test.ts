import { describe, expect, it } from "vitest";
import {
  addCartItemSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from "./cart";

const validCuid = "clh1q2w3e000008l4a5b6c7d8";

describe("cart validations", () => {
  it("accepts valid add cart item input", () => {
    const result = addCartItemSchema.safeParse({
      productId: validCuid,
      quantity: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid product ID", () => {
    const result = addCartItemSchema.safeParse({
      productId: "bad-id",
      quantity: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects quantity below 1", () => {
    const result = updateCartItemSchema.safeParse({
      quantity: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects quantity above 99", () => {
    const result = updateCartItemSchema.safeParse({
      quantity: 100,
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid cart item params", () => {
    const result = cartItemParamsSchema.safeParse({
      id: validCuid,
    });

    expect(result.success).toBe(true);
  });
});
