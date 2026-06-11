import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const repoRoot = process.cwd();
const outputName = process.argv[2] ?? "template-branding-files.zip";
const outputPath = resolve(repoRoot, outputName);
const stagingDir = resolve(repoRoot, ".tmp-template-branding-files");

const filesToZip = [
  "prisma/schema.prisma",
  "prisma/migrations/20260524010000_add_order_stock_deducted_marker/migration.sql",
  "prisma/migrations/20260611010000_add_product_variants/migration.sql",
  "prisma/migrations/20260611020000_add_customer_variant_ordering/migration.sql",

  "src/app/api/orders/route.ts",
  "src/app/api/orders/route.test.ts",

  "src/app/api/admin/orders/route.ts",
  "src/app/api/admin/orders/route.test.ts",

  "src/app/api/admin/orders/[id]/route.ts",
  "src/app/api/admin/orders/[id]/route.test.ts",

  "src/app/api/admin/orders/[id]/status/route.ts",
  "src/app/api/admin/orders/[id]/status/route.test.ts",

  "src/server/validations/order.ts",
  "src/server/validations/order.test.ts",
  "src/server/validations/admin-order.ts",
  "src/server/validations/admin-order.test.ts",
  "src/server/validations/cart.ts",
  "src/server/validations/cart.test.ts",

  "src/server/pricing.ts",
  "src/server/pricing.test.ts",

  "src/lib/csrf.ts",
  "src/lib/admin.ts",
  "src/lib/logger.ts",
  "src/server/db.ts",

  "src/components/admin/AdminOrdersClient.tsx",
  "src/components/orders/OrdersClient.tsx",

  "tests/e2e/customer-order.e2e.ts",
  "tests/e2e/customer-cart.e2e.ts",
  "tests/e2e/helpers/cart.ts",
  "tests/e2e/helpers/products.ts",

  "docs/product-variants-plan.md",
  "docs/product-variants-design-contract.md",
  "docs/production-readiness-checklist.md",
  "README.md",
  "package.json",
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
