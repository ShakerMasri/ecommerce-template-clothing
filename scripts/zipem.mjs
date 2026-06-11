import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const repoRoot = process.cwd();
const outputName = process.argv[2] ?? "template-branding-files.zip";
const outputPath = resolve(repoRoot, outputName);
const stagingDir = resolve(repoRoot, ".tmp-template-branding-files");

const filesToZip = [
  "prisma/schema.prisma",
  "README.md",

  "src/app/api/products/route.ts",
  "src/app/api/products/products.test.ts",
  "src/app/api/products/[slug]/route.ts",
  "src/app/api/products/[slug]/route.test.ts",

  "src/app/api/cart/route.ts",
  "src/app/api/cart/items/route.ts",
  "src/app/api/cart/items/[id]/route.ts",

  "src/app/api/orders/route.ts",
  "src/app/api/orders/route.test.ts",

  "src/app/api/admin/orders/[id]/status/route.ts",
  "src/app/api/admin/orders/[id]/status/route.test.ts",

  "src/app/api/admin/products/[id]/stock/route.ts",
  "src/app/api/admin/products/[id]/variants/route.ts",
  "src/app/api/admin/products/[id]/variants/route.test.ts",
  "src/app/api/admin/products/[id]/variants/[variantId]/route.ts",
  "src/app/api/admin/products/[id]/variants/[variantId]/route.test.ts",

  "src/components/cart/AddToCartControls.tsx",
  "src/components/cart/CartClient.tsx",
  "src/components/products/ProductDetailClient.tsx",
  "src/components/products/ProductCard.tsx",
  "src/components/admin/AdminOrdersClient.tsx",
  "src/app/admin/products/AdminProductsClient.tsx",

  "src/server/validations/cart.ts",
  "src/server/validations/cart.test.ts",
  "src/server/validations/order.ts",
  "src/server/validations/order.test.ts",
  "src/server/validations/product-variant.ts",
  "src/server/validations/product-variant.test.ts",

  "src/server/pricing.ts",
  "src/server/pricing.test.ts",

  "tests/e2e/customer-cart.e2e.ts",
  "tests/e2e/customer-order.e2e.ts",
  "tests/e2e/customer-product-display.e2e.ts",
  "tests/e2e/helpers/cart.ts",
  "tests/e2e/helpers/products.ts",

  "docs/product-variants-design-contract.md",
  "docs/product-variants-plan.md",
  "docs/product-variants-readiness-audit.md",
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
