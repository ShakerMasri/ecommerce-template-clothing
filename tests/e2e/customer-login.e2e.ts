import { expect, test } from "@playwright/test";
import { loginAsCustomer } from "./helpers/auth";

test("customer can log in and reach products page", async ({ page }) => {
  await loginAsCustomer(page, "/products");

  await expect(page).toHaveURL(/\/products(?:\?.*)?$/);
});
