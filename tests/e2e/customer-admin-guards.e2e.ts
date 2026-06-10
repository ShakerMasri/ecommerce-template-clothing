import { expect, test } from "@playwright/test";

const adminPages = ["/admin", "/admin/products", "/admin/orders"] as const;
const adminApiRoutes = [
  "/api/admin/products",
  "/api/admin/categories",
  "/api/admin/orders",
] as const;

test("signed-in customer is redirected away from admin pages", async ({ page }) => {
  for (const path of adminPages) {
    await page.goto(path);

    await expect(page).toHaveURL((url) => url.pathname === "/", {
      timeout: 15_000,
    });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  }
});

test("signed-in customer cannot read admin APIs", async ({ page }) => {
  for (const path of adminApiRoutes) {
    const response = await page.request.get(path);

    expect(response.status(), `${path} should stay hidden from customers.`).toBe(
      404,
    );
  }
});
