import { describe, expect, it } from "vitest";
import { createOrderSchema } from "./order";

const baseOrderInput = {
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  deliveryAreaKey: "west_bank_cities",
  deliveryCity: "Ramallah",
  deliveryAddress: "Main street, building 12",
};

describe("order validations", () => {
  it("accepts a valid delivery order request", () => {
    const result = createOrderSchema.safeParse(baseOrderInput);

    expect(result.success).toBe(true);
  });

  it("rejects invalid idempotency key", () => {
    const result = createOrderSchema.safeParse({
      ...baseOrderInput,
      idempotencyKey: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown delivery area", () => {
    const result = createOrderSchema.safeParse({
      ...baseOrderInput,
      deliveryAreaKey: "unknown-area",
    });

    expect(result.success).toBe(false);
  });

  it("rejects client-supplied delivery prices", () => {
    const result = createOrderSchema.safeParse({
      ...baseOrderInput,
      deliveryPrice: 0,
    });

    expect(result.success).toBe(false);
  });

  it("requires a delivery address for paid delivery areas", () => {
    const result = createOrderSchema.safeParse({
      ...baseOrderInput,
      deliveryAddress: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts the free Nablus receive point when customer agreement is accepted", () => {
    const result = createOrderSchema.safeParse({
      idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
      deliveryAreaKey: "nablus_receive_point",
      deliveryCity: "Nablus",
      deliveryAddress: "",
      pickupAgreementAccepted: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects the free Nablus receive point without customer agreement", () => {
    const result = createOrderSchema.safeParse({
      idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
      deliveryAreaKey: "nablus_receive_point",
      deliveryCity: "Nablus",
      deliveryAddress: "",
      pickupAgreementAccepted: false,
    });

    expect(result.success).toBe(false);
  });
});
