import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const repoRoot = process.cwd();
const outputName = process.argv[2] ?? "template-branding-files.zip";
const outputPath = resolve(repoRoot, outputName);
const stagingDir = resolve(repoRoot, ".tmp-template-branding-files");

const filesToZip = [
  "package.json",
  "package-lock.json",
  "README.md",
  "TESTING_GUIDE.md",
  "middleware.ts",
  "middleware.test.ts",
  "playwright.config.ts",
  "vitest.config.ts",

  "prisma/schema.prisma",
  "prisma/migrations/20260501205549_add_checkout_order_fields/migration.sql",
  "prisma/migrations/20260523010000_add_order_delivery_fields/migration.sql",
  "prisma/migrations/20260524010000_add_order_stock_deducted_marker/migration.sql",
  "prisma/migrations/20260525010000_add_product_stock_visibility/migration.sql",
  "prisma/migrations/20260525020000_add_product_discount_price/migration.sql",
  "prisma/migrations/20260611010000_add_product_variants/migration.sql",
  "prisma/migrations/20260611020000_add_customer_variant_ordering/migration.sql",

  "src/app/api/orders/route.ts",
  "src/app/api/orders/route.test.ts",

  "src/app/api/cart/route.ts",
  "src/app/api/cart/items/route.ts",
  "src/app/api/cart/items/[id]/route.ts",

  "src/app/api/admin/orders/route.ts",
  "src/app/api/admin/orders/route.test.ts",
  "src/app/api/admin/orders/[id]/route.ts",
  "src/app/api/admin/orders/[id]/route.test.ts",
  "src/app/api/admin/orders/[id]/status/route.ts",
  "src/app/api/admin/orders/[id]/status/route.test.ts",
  "src/app/api/admin/orders/[id]/payment/route.ts",
  "src/app/api/admin/orders/[id]/note/route.ts",

  "src/app/api/products/route.ts",
  "src/app/api/products/products.test.ts",
  "src/app/api/products/[slug]/route.ts",
  "src/app/api/products/[slug]/route.test.ts",

  "src/app/api/admin/products/route.ts",
  "src/app/api/admin/products/route.test.ts",
  "src/app/api/admin/products/[id]/route.ts",
  "src/app/api/admin/products/[id]/stock/route.ts",
  "src/app/api/admin/products/[id]/restore/route.ts",
  "src/app/api/admin/products/[id]/variants/route.ts",
  "src/app/api/admin/products/[id]/variants/route.test.ts",
  "src/app/api/admin/products/[id]/variants/[variantId]/route.ts",
  "src/app/api/admin/products/[id]/variants/[variantId]/route.test.ts",

  "src/app/orders/page.tsx",
  "src/app/cart/page.tsx",
  "src/app/products/[slug]/page.tsx",
  "src/app/admin/orders/page.tsx",
  "src/app/admin/products/page.tsx",

  "src/components/cart/AddToCartControls.tsx",
  "src/components/cart/CartClient.tsx",
  "src/components/products/ProductDetailClient.tsx",
  "src/components/orders/OrdersClient.tsx",
  "src/components/admin/AdminOrdersClient.tsx",
  "src/app/admin/products/AdminProductsClient.tsx",

  "src/lib/admin.ts",
  "src/lib/admin.test.ts",
  "src/lib/auth.ts",
  "src/lib/auth-client.ts",
  "src/lib/csrf.ts",
  "src/lib/csrf.test.ts",
  "src/lib/delivery.ts",
  "src/lib/delivery.test.ts",
  "src/lib/logger.ts",
  "src/lib/logger.test.ts",
  "src/lib/prisma.ts",
  "src/lib/rate-limit.ts",
  "src/lib/rate-limit.test.ts",
  "src/lib/validations.ts",
  "src/lib/validations.test.ts",

  "src/server/db.ts",
  "src/server/pricing.ts",
  "src/server/pricing.test.ts",
  "src/server/auth/index.ts",
  "src/server/validations/admin-order.ts",
  "src/server/validations/admin-order.test.ts",
  "src/server/validations/cart.ts",
  "src/server/validations/cart.test.ts",
  "src/server/validations/order.ts",
  "src/server/validations/order.test.ts",
  "src/server/validations/product.ts",
  "src/server/validations/product.test.ts",
  "src/server/validations/product-variant.ts",
  "src/server/validations/product-variant.test.ts",

  "src/config/delivery.ts",

  "tests/e2e/admin-access.e2e.ts",
  "tests/e2e/admin-orders-readonly.e2e.ts",
  "tests/e2e/auth-guards.e2e.ts",
  "tests/e2e/customer-admin-guards.e2e.ts",
  "tests/e2e/customer-cart.e2e.ts",
  "tests/e2e/customer-order.e2e.ts",
  "tests/e2e/customer-product-display.e2e.ts",
  "tests/e2e/helpers/auth.ts",
  "tests/e2e/helpers/cart.ts",
  "tests/e2e/helpers/products.ts",
  "tests/e2e/setup/admin-auth.setup.ts",
  "tests/e2e/setup/customer-auth.setup.ts",

  "docs/product-variants-design-contract.md",
  "docs/product-variants-plan.md",
  "docs/product-variants-readiness-audit.md",
  "docs/production-readiness-checklist.md",
  "docs/client-handoff.md",
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function isInside(parent, child) {
  const pathFromParent = relative(parent, child);
  return (
    pathFromParent === "" ||
    (!pathFromParent.startsWith("..") && !isAbsolute(pathFromParent))
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    fail(`Failed to run ${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${command} exited with code ${result.status ?? "unknown"}.`);
  }
}

if (!outputName.endsWith(".zip")) {
  fail("Output file must end with .zip.");
}

if (!isInside(repoRoot, outputPath)) {
  fail("Output zip must stay inside the repository.");
}

rmSync(stagingDir, { recursive: true, force: true });
mkdirSync(stagingDir, { recursive: true });
rmSync(outputPath, { force: true });

for (const file of filesToZip) {
  const source = resolve(repoRoot, file);

  if (!isInside(repoRoot, source) || !existsSync(source)) {
    fail(`Missing expected file: ${file}`);
  }

  const target = join(stagingDir, file);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target);
}

if (process.platform === "win32") {
  run("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `Compress-Archive -Path ${JSON.stringify(
      join(stagingDir, "*"),
    )} -DestinationPath ${JSON.stringify(outputPath)} -Force`,
  ]);
} else {
  run("zip", ["-qr", outputPath, "."], {
    cwd: stagingDir,
  });
}

rmSync(stagingDir, { recursive: true, force: true });
console.log(`Created ${outputPath}`);
