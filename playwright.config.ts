import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

function loadE2EEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env.e2e.local");

  if (!fs.existsSync(envPath)) {
    throw new Error(
      "Missing .env.e2e.local. Create it before running E2E tests.",
    );
  }

  const envKeyPattern = /^[A-Z0-9_]+$/;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!envKeyPattern.test(key)) continue;

    value = value.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadE2EEnv();

const baseURL = process.env.E2E_BASE_URL;

if (!baseURL) {
  throw new Error("Missing E2E_BASE_URL in .env.e2e.local.");
}

const isSafeTarget = baseURL.startsWith("http://localhost:");

if (!isSafeTarget) {
  throw new Error(
    `Unsafe E2E target: ${baseURL}. E2E tests are only allowed against staging or localhost.`,
  );
}

export default defineConfig({
  testDir: "./tests/e2e",

  fullyParallel: false,
  workers: 1,

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: "setup-customer",
      testMatch: /.*customer-auth\.setup\.ts/,
      use: {
        browserName: "chromium",
      },
    },
    {
      name: "setup-admin",
      testMatch: /.*admin-auth\.setup\.ts/,
      use: {
        browserName: "chromium",
      },
    },
    {
      name: "public",
      testMatch: [
        "**/smoke.e2e.ts",
        "**/auth-guards.e2e.ts",
        "**/customer-login.e2e.ts",
      ],
      use: {
        browserName: "chromium",
      },
    },
    {
      name: "customer",
      dependencies: ["setup-customer"],
      testMatch: [
        "**/customer-cart.e2e.ts",
        "**/customer-pages.e2e.ts",
        "**/customer-order.e2e.ts",
        "**/customer-product-display.e2e.ts",
        "**/customer-admin-guards.e2e.ts",
      ],
      use: {
        browserName: "chromium",
        storageState: "tests/e2e/.auth/customer.json",
      },
    },
    {
      name: "admin",
      dependencies: ["setup-admin"],
      testMatch: [
        "**/admin-access.e2e.ts",
        "**/admin-orders-readonly.e2e.ts",
        "**/admin-filters.e2e.ts",
      ],
      use: {
        browserName: "chromium",
        storageState: "tests/e2e/.auth/admin.json",
      },
    },
  ],
});
