import { expect, type Page } from "@playwright/test";
import { getRequiredE2EEnv } from "./auth";

type CartItem = {
  id?: unknown;
  cartItemId?: unknown;
};

type CartResponse = {
  items?: unknown;
  cartItems?: unknown;
  cart?: {
    items?: unknown;
  };
};

function getCartItems(data: unknown): CartItem[] {
  if (!data || typeof data !== "object") return [];

  const response = data as CartResponse;

  const rawItems = Array.isArray(response.cartItems)
    ? response.cartItems
    : Array.isArray(response.items)
      ? response.items
      : Array.isArray(response.cart?.items)
        ? response.cart.items
        : [];

  return rawItems.filter(
    (item): item is CartItem => Boolean(item) && typeof item === "object",
  );
}

function getCartItemId(item: CartItem): string | null {
  const id = item.id ?? item.cartItemId;

  if (typeof id !== "string") return null;

  const trimmed = id.trim();

  return trimmed ? trimmed : null;
}

export async function clearCart(page: Page): Promise<void> {
  const baseURL = getRequiredE2EEnv("E2E_BASE_URL");

  const cartResponse = await page.request.get("/api/cart", {
    headers: {
      origin: baseURL,
    },
  });

  if (cartResponse.status() === 404) return;

  expect(cartResponse.ok()).toBe(true);

  const cartData = (await cartResponse.json()) as unknown;
  const items = getCartItems(cartData);

  for (const item of items) {
    const itemId = getCartItemId(item);

    if (!itemId) continue;

    const deleteResponse = await page.request.delete(
      `/api/cart/items/${encodeURIComponent(itemId)}`,
      {
        headers: {
          origin: baseURL,
        },
      },
    );

    expect([200, 204, 404]).toContain(deleteResponse.status());
  }
}
