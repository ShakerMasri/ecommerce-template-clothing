import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const repoRoot = process.cwd();
const outputName = process.argv[2] ?? "template-branding-files.zip";
const outputPath = resolve(repoRoot, outputName);
const stagingDir = resolve(repoRoot, ".tmp-template-branding-files");

const filesToZip = [
  // reference pages/components for the new correct palette
  "src/app/page.tsx",
  "src/app/products/page.tsx",
  "src/components/products/ProductListingClient.tsx",
  "src/components/products/ProductCard.tsx",
  "src/components/products/ProductCardSkeleton.tsx",
  "src/components/products/CategoryTabs.tsx",
  "src/components/layout/Header.tsx",
  "src/components/layout/Footer.tsx",

  // files we patched and need to fix
  "src/app/products/[slug]/page.tsx",
  "src/app/cart/page.tsx",
  "src/app/orders/page.tsx",
  "src/components/products/ProductDetailClient.tsx",
  "src/components/cart/AddToCartControls.tsx",
  "src/components/cart/CartClient.tsx",
  "src/components/orders/OrdersClient.tsx",

  // shared style/translations/config
  "src/styles/globals.css",
  "src/lib/translations.ts",
  "src/config/store.ts",
  "src/config/contact.ts",
  "src/config/delivery.ts",

  // tests that may need wording/styling-safe updates
  "tests/e2e/customer-cart.e2e.ts",
  "tests/e2e/customer-order.e2e.ts",
  "tests/e2e/customer-pages.e2e.ts",
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
