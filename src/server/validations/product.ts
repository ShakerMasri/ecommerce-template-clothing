import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters.")
  .max(100, "Slug must be less than 100 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must use lowercase letters, numbers, and hyphens only.",
  );

const positiveIntegerFromQuery = (fallback: number, max: number) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      return Number(value);
    }, z.number().int().min(1).max(max))
    .default(fallback);

const optionalTrimmedSearch = z
  .string()
  .trim()
  .max(100, "Search is too long.")
  .optional()
  .transform((value) => value ?? undefined);

const optionalCuidFromQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value;
}, z.string().cuid("Invalid category ID.").optional());

export const productSlugSchema = z.object({
  slug: slugSchema,
});

export const productQuerySchema = z.object({
  category: slugSchema.optional(),
});

export const adminProductStatusSchema = z
  .enum(["all", "active", "archived"])
  .default("all");

export const adminProductStockSchema = z
  .enum(["all", "in_stock", "out_of_stock", "low_stock"])
  .default("all");

export const adminProductSortSchema = z
  .enum([
    "newest",
    "oldest",
    "name_asc",
    "name_desc",
    "price_asc",
    "price_desc",
    "stock_asc",
    "stock_desc",
  ])
  .default("newest");

export const adminProductsQuerySchema = z.object({
  q: optionalTrimmedSearch,
  categoryId: optionalCuidFromQuery,
  status: adminProductStatusSchema,
  stock: adminProductStockSchema,
  sort: adminProductSortSchema,
  page: positiveIntegerFromQuery(1, 10_000),
  limit: positiveIntegerFromQuery(20, 50),
});

export const adminCategoryUsageSchema = z
  .enum(["all", "with_products", "empty"])
  .default("all");

export const adminCategorySortSchema = z
  .enum(["name_asc", "name_desc", "newest", "oldest"])
  .default("name_asc");

export const adminCategoriesQuerySchema = z.object({
  q: optionalTrimmedSearch,
  usage: adminCategoryUsageSchema,
  sort: adminCategorySortSchema,
  page: positiveIntegerFromQuery(1, 10_000),
  limit: positiveIntegerFromQuery(20, 50),
});
