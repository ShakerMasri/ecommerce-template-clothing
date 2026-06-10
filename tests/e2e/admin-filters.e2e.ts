import { expect, type Page, test } from "@playwright/test";

type AdminProductsResponse = {
  products?: unknown;
  pagination?: unknown;
};

type AdminCategoriesResponse = {
  categories?: unknown;
  pagination?: unknown;
};

type AdminOrdersResponse = {
  orders?: unknown;
  pagination?: unknown;
};

function waitForApiQuery(
  page: Page,
  pathname: string,
  expectedParams: Record<string, string>,
) {
  return page.waitForResponse((response) => {
    if (response.request().method() !== "GET") return false;

    const url = new URL(response.url());

    if (url.pathname !== pathname) return false;

    return Object.entries(expectedParams).every(([key, value]) => {
      return url.searchParams.get(key) === value;
    });
  });
}

test("admin products filters call the server with validated query params", async ({
  page,
}) => {
  await page.goto("/admin/products");

  const filterForm = page
    .locator("form")
    .filter({ has: page.getByPlaceholder(/search by product name/i) })
    .first();

  await filterForm.locator("select").nth(1).selectOption("active");
  await filterForm.locator("select").nth(2).selectOption("low_stock");
  await filterForm.locator("select").nth(3).selectOption("stock_asc");

  const responsePromise = waitForApiQuery(page, "/api/admin/products", {
    status: "active",
    stock: "low_stock",
    sort: "stock_asc",
  });

  await filterForm.getByRole("button", { name: /^apply filters$/i }).click();

  const response = await responsePromise;
  const data = (await response.json()) as AdminProductsResponse;

  expect(response.ok()).toBe(true);
  expect(Array.isArray(data.products)).toBe(true);
  expect(data.pagination).toBeTruthy();
});

test("admin categories filters call the server with validated query params", async ({
  page,
}) => {
  await page.goto("/admin/categories");

  const filterForm = page
    .locator("form")
    .filter({ has: page.getByPlaceholder(/search by category name/i) })
    .first();

  await filterForm.locator("select").nth(0).selectOption("empty");
  await filterForm.locator("select").nth(1).selectOption("oldest");

  const responsePromise = waitForApiQuery(page, "/api/admin/categories", {
    usage: "empty",
    sort: "oldest",
  });

  await filterForm.getByRole("button", { name: /^apply filters$/i }).click();

  const response = await responsePromise;
  const data = (await response.json()) as AdminCategoriesResponse;

  expect(response.ok()).toBe(true);
  expect(Array.isArray(data.categories)).toBe(true);
  expect(data.pagination).toBeTruthy();
});

test("admin orders filters call the server with validated query params", async ({
  page,
}) => {
  await page.goto("/admin/orders");

  const filterForm = page
    .locator("form")
    .filter({ has: page.getByPlaceholder(/search by order id/i) })
    .first();

  await filterForm.locator("select").nth(0).selectOption("PENDING");
  await filterForm.locator("select").nth(1).selectOption("UNPAID");

  const responsePromise = waitForApiQuery(page, "/api/admin/orders", {
    status: "PENDING",
    paymentStatus: "UNPAID",
  });

  await filterForm.getByRole("button", { name: /^apply$/i }).click();

  const response = await responsePromise;
  const data = (await response.json()) as AdminOrdersResponse;

  expect(response.ok()).toBe(true);
  expect(Array.isArray(data.orders)).toBe(true);
  expect(data.pagination).toBeTruthy();
});
