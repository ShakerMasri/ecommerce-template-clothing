import { expect, test } from "@playwright/test";
import { getRequiredE2EPath } from "./helpers/auth";
import { clearCart } from "./helpers/cart";
import {
  formatNisPrice,
  getEffectiveProductPrice,
  getPublicProductByPath,
} from "./helpers/products";

type OrderItemResponse = {
  quantity?: unknown;
  priceAtPurchase?: unknown;
  subtotalAmount?: unknown;
};

type CreateOrderResponse = {
  message?: unknown;
  order?: {
    id?: unknown;
    status?: unknown;
    totalAmount?: unknown;
    deliveryPrice?: unknown;
    items?: unknown;
  };
};

function getOrderId(data: CreateOrderResponse): string {
  const id = data.order?.id;

  if (typeof id !== "string" || !id.trim()) {
    throw new Error(`Order response did not include a valid order id.`);
  }

  return id;
}

function getSingleOrderItem(data: CreateOrderResponse): OrderItemResponse {
  if (!Array.isArray(data.order?.items) || data.order.items.length !== 1) {
    throw new Error(`Expected one order item, received: ${JSON.stringify(data)}`);
  }

  const [item] = data.order.items;

  if (!item || typeof item !== "object") {
    throw new Error(`Order item was missing or invalid: ${JSON.stringify(data)}`);
  }

  return item as OrderItemResponse;
}

function expectMoneyString(value: unknown, expected: number, label: string): void {
  expect(typeof value, `${label} should be serialized as a string.`).toBe("string");
  expect(Number(value), label).toBeCloseTo(expected, 2);
}

test("customer can place a controlled test order", async ({ page }) => {
  const productPath = getRequiredE2EPath("E2E_ORDER_PRODUCT_PATH");
  const product = await getPublicProductByPath(page.request, productPath);
  const expectedUnitPrice = getEffectiveProductPrice(product);

  await clearCart(page);

  try {
    await page.goto(productPath);

    const addToCartButton = page
      .getByRole("button", { name: /^add to cart$/i })
      .first();

    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();

    const addToCartResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/cart/items" &&
        response.request().method() === "POST",
    );

    await addToCartButton.click();

    const addToCartResponse = await addToCartResponsePromise;

    expect(addToCartResponse.ok()).toBe(true);

    await page.goto("/cart");

    await page.getByLabel(/west bank cities/i).check();
    await page.getByLabel(/city or area/i).fill("Nablus");
    await page
      .getByLabel(/delivery address/i)
      .fill("Test delivery address near the city center");

    const reviewOrderButton = page
      .locator("aside")
      .getByRole("button", { name: /^review order$/i });

    await expect(reviewOrderButton).toBeVisible();
    await expect(reviewOrderButton).toBeEnabled();

    await reviewOrderButton.click();

    const confirmOrderButton = page.getByRole("button", {
      name: /^confirm and place order$/i,
    });

    await expect(confirmOrderButton).toBeVisible();
    await expect(confirmOrderButton).toBeEnabled();

    const orderResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/orders" &&
        response.request().method() === "POST",
    );

    await confirmOrderButton.click();

    const orderResponse = await orderResponsePromise;
    const orderData = (await orderResponse.json()) as CreateOrderResponse;

    expect(
      orderResponse.ok(),
      `Order API failed: ${JSON.stringify(orderData)}`,
    ).toBe(true);

    const orderId = getOrderId(orderData);
    const orderItem = getSingleOrderItem(orderData);
    const deliveryPrice = Number(orderData.order?.deliveryPrice);

    expect(Number.isFinite(deliveryPrice), "Delivery price should be numeric.").toBe(
      true,
    );
    expectMoneyString(orderItem.priceAtPurchase, expectedUnitPrice, "item price");
    expectMoneyString(orderItem.subtotalAmount, expectedUnitPrice, "item subtotal");
    expectMoneyString(
      orderData.order?.totalAmount,
      expectedUnitPrice + deliveryPrice,
      "order total",
    );

    await expect(page.locator("body")).toContainText(orderId);
    await expect(page.locator("body")).toContainText(
      formatNisPrice(expectedUnitPrice + deliveryPrice),
    );

    await page.goto("/orders");

    await expect(page).toHaveURL(/\/orders(?:\?.*)?$/);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).toContainText(orderId);
  } finally {
    await clearCart(page);
  }
});
