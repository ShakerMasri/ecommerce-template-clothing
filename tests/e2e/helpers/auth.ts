import { expect, type Page } from "@playwright/test";

export function getRequiredE2EEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name} in .env.e2e.local.`);
  }

  return value;
}

export function getRequiredE2EPath(name: string): string {
  const value = getRequiredE2EEnv(name);

  if (!value.startsWith("/") || value.startsWith("//")) {
    throw new Error(
      `${name} must be a safe relative path like /products/item.`,
    );
  }

  return value;
}

export async function loginAsCustomer(
  page: Page,
  callbackPath = "/products",
): Promise<void> {
  const email = getRequiredE2EEnv("E2E_CUSTOMER_EMAIL");
  const password = getRequiredE2EEnv("E2E_CUSTOMER_PASSWORD");

  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);

  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);

  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL((url) => url.pathname === callbackPath, {
    timeout: 30_000,
  });

  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
}

export async function loginAsAdmin(
  page: Page,
  callbackPath = "/admin/products",
): Promise<void> {
  const email = getRequiredE2EEnv("E2E_ADMIN_EMAIL");
  const password = getRequiredE2EEnv("E2E_ADMIN_PASSWORD");

  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);

  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);

  await page.locator('form button[type="submit"]').click();

  await expect(page).toHaveURL((url) => url.pathname === callbackPath, {
    timeout: 30_000,
  });

  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
}
