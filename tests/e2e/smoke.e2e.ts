import { expect, test } from "@playwright/test";
import { storeConfig } from "../../src/config/store";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("homepage loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    new RegExp(escapeRegExp(storeConfig.name), "i"),
  );
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("products page loads", async ({ page }) => {
  await page.goto("/products");

  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});
