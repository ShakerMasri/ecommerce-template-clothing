import { expect, test } from "@playwright/test";
import { getRequiredE2EPath } from "./helpers/auth";
import { clearCart } from "./helpers/cart";

test("customer can add a known product to cart", async ({ page }) => {
  const productPath = getRequiredE2EPath("E2E_PRODUCT_PATH");

  await clearCart(page);
  await page.goto(productPath);

  try {
    const addToCartButton = page
      .getByRole("button", { name: /^add to cart$/i })
      .first();

    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();

    const addToCartResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/cart/items") &&
        response.request().method() === "POST",
    );

    await addToCartButton.click();

    const addToCartResponse = await addToCartResponsePromise;

    expect(addToCartResponse.ok()).toBe(true);

    await page.getByRole("link", { name: /view cart/i }).click();

    await expect(page).toHaveURL(/\/cart(?:\?.*)?$/);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  } finally {
    await clearCart(page);
  }
});
