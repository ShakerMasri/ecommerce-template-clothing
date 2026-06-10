import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth";

const authDir = path.resolve(process.cwd(), "tests/e2e/.auth");
const adminAuthState = path.join(authDir, "admin.json");

test("save admin auth state", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  await loginAsAdmin(page, "/admin/products");

  await page.context().storageState({
    path: adminAuthState,
  });
});
