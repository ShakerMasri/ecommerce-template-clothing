import { expect, test } from "@playwright/test";
import { getRequiredE2EPath } from "./helpers/auth";
import {
  formatNisPrice,
  getPublicProductByPath,
} from "./helpers/products";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function availableStockLabelPattern(): RegExp {
  return /^(?:Available|In stock|متوفر)$/i;
}

function exactStockLabelPattern(stock: number): RegExp {
  return new RegExp(
    `^${escapeRegExp(String(stock))}\\s+(?:left|متبقي|Available|In stock|متوفر)$`,
    "i",
  );
}

function anyExactStockLabelPattern(): RegExp {
  return /^[1-9][0-9]*\s+(?:left|متبقي|Available|In stock|متوفر)$/i;
}

test("customer sees sale price and old price for a discounted product", async ({
  page,
  request,
}) => {
  const productPath = getRequiredE2EPath("E2E_DISCOUNT_PRODUCT_PATH");
  const product = await getPublicProductByPath(request, productPath);

  expect(
    product.discountPrice,
    `${productPath} must point to a product with discountPrice set for this E2E test.`,
  ).not.toBeNull();

  const salePrice = formatNisPrice(product.discountPrice ?? product.price);
  const regularPrice = formatNisPrice(product.price);

  await page.goto(productPath);

  await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
  await expect(page.getByText(salePrice).first()).toBeVisible();
  await expect(
    page.locator(".line-through").filter({ hasText: regularPrice }).first(),
  ).toBeVisible();
});

test("customer sees exact stock only when product stock visibility is enabled", async ({
  page,
  request,
}) => {
  const productPath = getRequiredE2EPath("E2E_VISIBLE_STOCK_PRODUCT_PATH");
  const product = await getPublicProductByPath(request, productPath);

  expect(
    product.showStock,
    `${productPath} must point to a product with showStock enabled.`,
  ).toBe(true);
  expect(
    product.stock,
    `${productPath} must expose exact stock for this E2E test.`,
  ).not.toBeNull();
  expect(product.stock ?? 0, `${productPath} must point to an in-stock product.`).toBeGreaterThan(0);

  await page.goto(productPath);

  await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
  await expect(
    page.getByText(exactStockLabelPattern(product.stock ?? 0)).first(),
  ).toBeVisible();
});

test("customer does not see exact stock when product stock visibility is disabled", async ({
  page,
  request,
}) => {
  const productPath = getRequiredE2EPath("E2E_HIDDEN_STOCK_PRODUCT_PATH");
  const product = await getPublicProductByPath(request, productPath);

  expect(
    product.showStock,
    `${productPath} must point to a product with showStock disabled.`,
  ).toBe(false);
  expect(product.isInStock, `${productPath} must point to an in-stock product.`).toBe(
    true,
  );
  expect(product.stock, `${productPath} must hide exact stock in the API.`).toBeNull();

  await page.goto(productPath);

  await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
  await expect(page.getByText(availableStockLabelPattern()).first()).toBeVisible();
  await expect(page.getByText(anyExactStockLabelPattern())).toHaveCount(0);
});
