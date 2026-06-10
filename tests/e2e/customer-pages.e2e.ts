import { expect, type Page, test } from "@playwright/test";

const customerReadOnlyPages = ["/account", "/profile", "/orders"] as const;

async function expectAuthenticatedCustomerPage(
  page: Page,
  path: (typeof customerReadOnlyPages)[number],
): Promise<void> {
  await page.goto(path);

  const body = page.locator("body");

  await expect(page).toHaveURL((url) => url.pathname === path, {
    timeout: 15_000,
  });

  await expect(body).toBeVisible();
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText(/unauthorized|forbidden/i);
  await expect(body).not.toContainText(
    /you need to log in|please log in|sign in to/i,
  );
}

test("customer can access authenticated read-only pages", async ({ page }) => {
  for (const path of customerReadOnlyPages) {
    await expectAuthenticatedCustomerPage(page, path);
  }
});
