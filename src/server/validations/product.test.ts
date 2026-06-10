import { describe, expect, it } from "vitest";
import {
  adminCategoriesQuerySchema,
  adminProductsQuerySchema,
  productQuerySchema,
  productSlugSchema,
} from "./product";

const validCategoryId = "clh1q2w3e000008l4a5b6c7d8";

describe("product route validations", () => {
  it("accepts valid product slug", () => {
    const result = productSlugSchema.safeParse({
      slug: "silent-hill-figure",
    });

    expect(result.success).toBe(true);
  });

  it("rejects uppercase slug", () => {
    const result = productSlugSchema.safeParse({
      slug: "Silent-Hill-Figure",
    });

    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const result = productSlugSchema.safeParse({
      slug: "silent hill figure",
    });

    expect(result.success).toBe(false);
  });

  it("accepts empty product query", () => {
    const result = productQuerySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts valid category query", () => {
    const result = productQuerySchema.safeParse({
      category: "figures",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid category query", () => {
    const result = productQuerySchema.safeParse({
      category: "Bad Category!",
    });

    expect(result.success).toBe(false);
  });

  it("accepts admin product filters and pagination", () => {
    const result = adminProductsQuerySchema.safeParse({
      q: "  figure  ",
      categoryId: validCategoryId,
      status: "active",
      stock: "low_stock",
      sort: "stock_asc",
      page: "2",
      limit: "10",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.q).toBe("figure");
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it("defaults admin product filters", () => {
    const result = adminProductsQuerySchema.safeParse({});

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.status).toBe("all");
      expect(result.data.stock).toBe("all");
      expect(result.data.sort).toBe("newest");
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejects unsafe admin product filters", () => {
    const result = adminProductsQuerySchema.safeParse({
      categoryId: "not-a-cuid",
      status: "DELETED",
      limit: "500",
    });

    expect(result.success).toBe(false);
  });

  it("accepts admin category filters and pagination", () => {
    const result = adminCategoriesQuerySchema.safeParse({
      q: "  anime  ",
      usage: "empty",
      sort: "newest",
      page: "3",
      limit: "15",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.q).toBe("anime");
      expect(result.data.usage).toBe("empty");
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(15);
    }
  });

  it("rejects unsafe admin category filters", () => {
    const result = adminCategoriesQuerySchema.safeParse({
      usage: "with_secrets",
      sort: "random",
      page: "0",
    });

    expect(result.success).toBe(false);
  });
});
