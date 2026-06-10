import { expect, type Page, test } from "@playwright/test";

async function expectGuestLoginPrompt(page: Page, path: string): Promise<void> {
  await page.goto(path);

  await expect(page).toHaveURL(new RegExp(`${path}(?:\\?.*)?$`));
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");

  await expect(page.locator("body")).toContainText(/log in|login|sign in/i);

  const loginAction = page
    .locator("a, button")
    .filter({ hasText: /log in|login|sign in/i })
    .first();

  await expect(loginAction).toBeVisible();
}

test("guest sees login prompt on cart page", async ({ page }) => {
  await expectGuestLoginPrompt(page, "/cart");
});

test("guest sees login prompt on orders page", async ({ page }) => {
  await expectGuestLoginPrompt(page, "/orders");
});

test("guest is redirected from admin products to login", async ({ page }) => {
  await page.goto("/admin/products");

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/login" &&
      url.searchParams.get("callbackUrl") === "/admin/products",
    { timeout: 15_000 },
  );
});
