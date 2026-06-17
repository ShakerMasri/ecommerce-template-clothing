import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const repoRoot = process.cwd();
const outputName = process.argv[2] ?? "template-branding-files.zip";
const outputPath = resolve(repoRoot, outputName);
const stagingDir = resolve(repoRoot, ".tmp-template-branding-files");

const filesToZip = [
  // Public store, contact, delivery, policy, and translations
  "src/config/store.ts",
  "src/config/contact.ts",
  "src/config/delivery.ts",
  "src/config/policies.ts",
  "src/lib/translations.ts",

  // Existing legal and contact pages
  "src/app/terms/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/shipping/page.tsx",
  "src/app/returns/page.tsx",
  "src/app/contact/page.tsx",

  // Shared legal and site-wide disclosure components
  "src/components/legal/LegalPage.tsx",
  "src/components/legal/LegalPolicyClient.tsx",
  "src/components/layout/Header.tsx",
  "src/components/layout/Footer.tsx",
  "src/components/layout/WhatsappSupportShortcut.tsx",

  // Product details, cart, and checkout presentation
  "src/app/products/[slug]/page.tsx",
  "src/components/products/ProductDetailClient.tsx",
  "src/components/cart/AddToCartControls.tsx",
  "src/app/cart/page.tsx",
  "src/components/cart/CartClient.tsx",

  // Cart APIs and validation
  "src/app/api/cart/route.ts",
  "src/app/api/cart/items/route.ts",
  "src/app/api/cart/items/[id]/route.ts",
  "src/server/validations/cart.ts",
  "src/server/validations/cart.test.ts",

  // Order creation, pricing, delivery, and validation
  "src/app/api/orders/route.ts",
  "src/app/api/orders/route.test.ts",
  "src/server/validations/order.ts",
  "src/server/validations/order.test.ts",
  "src/server/pricing.ts",
  "src/server/pricing.test.ts",
  "src/lib/delivery.ts",
  "src/lib/delivery.test.ts",

  // Customer order history and details
  "src/app/orders/page.tsx",
  "src/app/orders/error.tsx",
  "src/components/orders/OrdersClient.tsx",

  // Admin order management
  "src/app/admin/orders/page.tsx",
  "src/components/admin/AdminOrdersClient.tsx",
  "src/app/api/admin/orders/route.ts",
  "src/app/api/admin/orders/route.test.ts",
  "src/app/api/admin/orders/[id]/route.ts",
  "src/app/api/admin/orders/[id]/route.test.ts",
  "src/app/api/admin/orders/[id]/status/route.ts",
  "src/app/api/admin/orders/[id]/status/route.test.ts",
  "src/app/api/admin/orders/[id]/payment/route.ts",
  "src/app/api/admin/orders/[id]/note/route.ts",
  "src/server/validations/admin-order.ts",
  "src/server/validations/admin-order.test.ts",

  // Current database schema and relevant migration history
  "prisma/schema.prisma",
  "prisma/migrations/20260417004057_init/migration.sql",
  "prisma/migrations/20260501205549_add_checkout_order_fields/migration.sql",
  "prisma/migrations/20260504122248_add_order_admin_note/migration.sql",
  "prisma/migrations/20260523010000_add_order_delivery_fields/migration.sql",
  "prisma/migrations/20260524010000_add_order_stock_deducted_marker/migration.sql",
  "prisma/migrations/20260611010000_add_product_variants/migration.sql",
  "prisma/migrations/20260611020000_add_customer_variant_ordering/migration.sql",
  "prisma/migrations/20260611200000_remove_variant_sku_fields/migration.sql",

  // Critical customer E2E coverage
  "tests/e2e/customer-order.e2e.ts",
  "tests/e2e/customer-cart.e2e.ts",
  "tests/e2e/customer-pages.e2e.ts",
  "tests/e2e/customer-product-display.e2e.ts",
  "tests/e2e/smoke.e2e.ts",
  "tests/e2e/helpers/cart.ts",
  "tests/e2e/helpers/products.ts",

  // Dependencies, setup, testing, and client handoff documentation
  "package.json",
  "README.md",
  "TESTING_GUIDE.md",
  "docs/client-handoff.md",
  "docs/first-client-setup-checklist.md",
  "docs/production-readiness-checklist.md",
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
