import { expect, type APIRequestContext, type Page } from "@playwright/test";

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicProductVariant = {
  id: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  stock: number | null;
  isInStock: boolean;
  sortOrder: number;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  price: string;
  discountPrice: string | null;
  stock: number | null;
  isInStock: boolean;
  showStock: boolean;
  images: string[];
  isFeatured: boolean;
  hasVariants: boolean;
  variants: PublicProductVariant[];
  createdAt?: string;
  category: ProductCategory;
};

type ProductDetailResponse = {
  product?: PublicProduct;
  message?: unknown;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getProductSlugFromPath(productPath: string): string {
  const pathOnly = productPath.split("?")[0]?.replace(/\/+$/, "") ?? "";
  const [, productsSegment, slug] = pathOnly.split("/");

  if (productsSegment !== "products" || !slug?.trim()) {
    throw new Error(
      `Expected a product path like /products/example-product, received: ${productPath}`,
    );
  }

  return slug;
}

export async function getPublicProductByPath(
  request: APIRequestContext,
  productPath: string,
): Promise<PublicProduct> {
  const slug = getProductSlugFromPath(productPath);
  const response = await request.get(`/api/products/${encodeURIComponent(slug)}`);
  const data = (await response.json()) as ProductDetailResponse;

  expect(
    response.ok(),
    `Expected ${productPath} product API to load: ${JSON.stringify(data)}`,
  ).toBe(true);

  if (!data.product) {
    throw new Error(`Product API did not return product data for ${productPath}.`);
  }

  return data.product;
}

function getVariantLabel(variant: PublicProductVariant): string {
  return [variant.sizeLabel, variant.colorLabel].filter(Boolean).join(" / ");
}

export async function selectFirstAvailableProductOption(
  page: Page,
  product: PublicProduct,
): Promise<void> {
  if (!product.hasVariants) {
    throw new Error(
      `${product.slug} has no size/color options. Add an active option before using it in E2E tests.`,
    );
  }

  const variant = product.variants.find((item) => item.isInStock);

  if (!variant) {
    throw new Error(
      `${product.slug} has no available size/color option for this E2E test.`,
    );
  }

  const label = getVariantLabel(variant);

  if (!label) {
    throw new Error(`${product.slug} has an option without a customer label.`);
  }

  await page
    .getByRole("button", { name: new RegExp(escapeRegExp(label), "i") })
    .click();
}

export function getEffectiveProductPrice(product: PublicProduct): number {
  return Number(product.discountPrice ?? product.price);
}

export function formatNisPrice(value: string | number): string {
  return `₪${Number(value).toFixed(2)}`;
}

export function formatUsdPrice(value: string | number): string {
  return formatNisPrice(value);
}
