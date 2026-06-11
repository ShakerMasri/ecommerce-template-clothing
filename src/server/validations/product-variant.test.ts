import { describe, expect, it } from "vitest";
import {
  createProductVariantSchema,
  normalizeVariantKey,
  updateProductVariantSchema,
} from "./product-variant";

describe("product variant validations", () => {
  it("normalizes labels into stable uniqueness keys", () => {
    const result = createProductVariantSchema.safeParse({
      sizeLabel: "  Medium  ",
      colorLabel: " Black / White ",
      stock: "5",
      sortOrder: "2",
      isActive: true,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.sizeLabel).toBe("Medium");
      expect(result.data.colorLabel).toBe("Black / White");
      expect(result.data.sizeKey).toBe("medium");
      expect(result.data.colorKey).toBe("black-white");
      expect(result.data.stock).toBe(5);
      expect(result.data.sortOrder).toBe(2);
    }
  });

  it("requires at least size or color", () => {
    const result = createProductVariantSchema.safeParse({
      sizeLabel: " ",
      colorLabel: " ",
      stock: "1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative stock", () => {
    const result = createProductVariantSchema.safeParse({
      sizeLabel: "S",
      colorLabel: "Black",
      stock: "-1",
    });

    expect(result.success).toBe(false);
  });


  it("allows partial updates and only regenerates submitted keys", () => {
    const result = updateProductVariantSchema.safeParse({
      colorLabel: "Navy Blue",
      stock: "8",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.colorLabel).toBe("Navy Blue");
      expect(result.data.colorKey).toBe("navy-blue");
      expect(result.data.sizeKey).toBeUndefined();
      expect(result.data.stock).toBe(8);
    }
  });

  it("normalizes arbitrary labels predictably", () => {
    expect(normalizeVariantKey("  XL / Tall  ")).toBe("xl-tall");
  });
});
