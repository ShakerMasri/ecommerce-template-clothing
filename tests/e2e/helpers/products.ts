import { expect, type APIRequestContext } from "@playwright/test";

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  price: string;
  discountPrice: string | null;
  stock: number;
  showStock: boolean;
  images: string[];
  isFeatured: boolean;
  createdAt?: string;
  category: ProductCategory;
};

type ProductDetailResponse = {
  product?: PublicProduct;
  message?: unknown;
};

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

export function getEffectiveProductPrice(product: PublicProduct): number {
  return Number(product.discountPrice ?? product.price);
}

export function formatUsdPrice(value: string | number): string {
  return `$${Number(value).toFixed(2)}`;
}

export function formatNisPrice(value: string | number): string {
  return `${Number(value).toFixed(2)} NIS`;
}
