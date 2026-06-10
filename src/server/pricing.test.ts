import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getEffectiveProductPrice } from "./pricing";

describe("getEffectiveProductPrice", () => {
  it("uses the regular price when no discount exists", () => {
    const price = getEffectiveProductPrice({
      price: new Prisma.Decimal("50.00"),
      discountPrice: null,
    });

    expect(price.toString()).toBe("50");
  });

  it("uses the discount price when it exists", () => {
    const price = getEffectiveProductPrice({
      price: new Prisma.Decimal("50.00"),
      discountPrice: new Prisma.Decimal("40.00"),
    });

    expect(price.toString()).toBe("40");
  });
});
