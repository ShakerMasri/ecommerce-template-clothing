import { expect, test } from "@playwright/test";

const adminReadOnlyPages = [
  "/admin",
  "/admin/products",
  "/admin/orders",
] as const;

test("admin can access read-only admin pages", async ({ page }) => {
  for (const path of adminReadOnlyPages) {
    await page.goto(path);

    const body = page.locator("body");

    await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/);
    await expect(body).toBeVisible();
    await expect(body).not.toContainText("Application error");
    await expect(body).not.toContainText(/unauthorized|forbidden/i);
  }
});
