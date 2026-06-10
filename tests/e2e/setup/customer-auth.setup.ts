import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { loginAsCustomer } from "../helpers/auth";

const authDir = path.resolve(process.cwd(), "tests/e2e/.auth");
const customerAuthState = path.join(authDir, "customer.json");

test("save customer auth state", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  await loginAsCustomer(page, "/products");

  await page.context().storageState({
    path: customerAuthState,
  });
});
