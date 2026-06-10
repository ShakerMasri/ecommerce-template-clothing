import { expect, test } from "@playwright/test";

type AdminOrdersResponse = {
  orders?: unknown;
};

function getFirstOrderId(data: AdminOrdersResponse): string | null {
  if (!Array.isArray(data.orders)) return null;

  const firstOrder = data.orders.at(0);

  if (!firstOrder || typeof firstOrder !== "object") return null;

  const id = (firstOrder as { id?: unknown }).id;

  return typeof id === "string" && id.trim() ? id : null;
}

function getShortOrderId(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

test("admin orders page loads orders API without editing data", async ({
  page,
}) => {
  const ordersResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/orders") &&
      response.request().method() === "GET",
  );

  await page.goto("/admin/orders");

  const ordersResponse = await ordersResponsePromise;

  expect(ordersResponse.ok()).toBe(true);

  const data = (await ordersResponse.json()) as AdminOrdersResponse;

  expect(Array.isArray(data.orders)).toBe(true);

  const body = page.locator("body");

  await expect(page).toHaveURL(/\/admin\/orders(?:\?.*)?$/);
  await expect(body).toBeVisible();
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText(/unauthorized|forbidden/i);

  const firstOrderId = getFirstOrderId(data);

  if (firstOrderId) {
    await expect(body).toContainText(getShortOrderId(firstOrderId));
  }
});
