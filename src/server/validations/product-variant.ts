import { z } from "zod";

const nullableTrimmedString = (max: number, label: string) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null) {
        return null;
      }

      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();

      return trimmed.length > 0 ? trimmed : null;
    }, z.string().max(max, `${label} is too long.`).nullable())
    .default(null);

const optionalBoolean = z
  .preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value;
  }, z.boolean().optional())
  .default(true);

const nonNegativeInteger = (label: string, max = 1_000_000) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() !== "") {
        return Number(value);
      }

      return value;
    },
    z
      .number({ invalid_type_error: `${label} must be a number.` })
      .int(`${label} must be a whole number.`)
      .min(0, `${label} cannot be negative.`)
      .max(max, `${label} is too high.`),
  );

const sortOrderSchema = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return 0;
    }

    if (typeof value === "string") {
      return Number(value);
    }

    return value;
  }, z.number().int().min(0).max(10_000))
  .default(0);

export function normalizeVariantKey(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const skuSchema = z
  .preprocess((value) => {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(80, "SKU is too long.").regex(/^[A-Za-z0-9._-]+$/, "SKU can use letters, numbers, dots, underscores, and hyphens only.").nullable())
  .default(null);

const variantInputBaseSchema = z.object({
  sizeLabel: nullableTrimmedString(40, "Size label"),
  colorLabel: nullableTrimmedString(80, "Color label"),
  sku: skuSchema,
  stock: nonNegativeInteger("Stock"),
  isActive: optionalBoolean,
  sortOrder: sortOrderSchema,
});

export const createProductVariantSchema = variantInputBaseSchema
  .superRefine((value, context) => {
    if (!value.sizeLabel && !value.colorLabel) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sizeLabel"],
        message: "At least a size or color is required.",
      });
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["colorLabel"],
        message: "At least a size or color is required.",
      });
    }
  })
  .transform((value) => ({
    ...value,
    sizeKey: normalizeVariantKey(value.sizeLabel),
    colorKey: normalizeVariantKey(value.colorLabel),
  }));

export const updateProductVariantSchema = variantInputBaseSchema
  .partial()
  .superRefine((value, context) => {
    const hasAnyField = Object.keys(value).length > 0;

    if (!hasAnyField) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["_form"],
        message: "At least one variant field is required.",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(value, "sizeLabel") &&
      Object.prototype.hasOwnProperty.call(value, "colorLabel") &&
      !value.sizeLabel &&
      !value.colorLabel
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sizeLabel"],
        message: "At least a size or color is required.",
      });
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["colorLabel"],
        message: "At least a size or color is required.",
      });
    }
  })
  .transform((value) => {
    const nextValue = { ...value } as typeof value & {
      sizeKey?: string;
      colorKey?: string;
    };

    if (Object.prototype.hasOwnProperty.call(value, "sizeLabel")) {
      nextValue.sizeKey = normalizeVariantKey(value.sizeLabel);
    }

    if (Object.prototype.hasOwnProperty.call(value, "colorLabel")) {
      nextValue.colorKey = normalizeVariantKey(value.colorLabel);
    }

    return nextValue;
  });

export const productVariantParamsSchema = z.object({
  id: z.string().cuid("Invalid product ID."),
  variantId: z.string().cuid("Invalid variant ID.").optional(),
});
