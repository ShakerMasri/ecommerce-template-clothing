import fs from "node:fs";
import path from "node:path";

const LOCKFILE_PATH = path.resolve(process.cwd(), "package-lock.json");
const REPORT_DIR = path.resolve(process.cwd(), "reports");
const JSON_REPORT_PATH = path.join(REPORT_DIR, "license-inventory.json");
const MD_REPORT_PATH = path.join(REPORT_DIR, "license-inventory.md");

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function packageNameFromLockPath(lockPath) {
  const parts = lockPath.split("node_modules/").filter(Boolean);
  const lastPart = parts.at(-1);

  if (!lastPart) return null;

  const segments = lastPart.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  if (segments[0]?.startsWith("@")) {
    const scope = segments[0];
    const name = segments[1];

    return scope && name ? `${scope}/${name}` : null;
  }

  return segments[0] ?? null;
}

function readNodeModulesPackageLicense(lockPath) {
  const packageJsonPath = path.resolve(process.cwd(), lockPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) return null;

  try {
    const packageJson = readJsonFile(packageJsonPath);

    if (typeof packageJson.license === "string") {
      return packageJson.license;
    }

    if (Array.isArray(packageJson.licenses)) {
      return packageJson.licenses
        .map((license) => {
          if (typeof license === "string") return license;
          if (license && typeof license.type === "string") return license.type;
          return null;
        })
        .filter(Boolean)
        .join(" OR ");
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeLicense(license) {
  return license.trim().replaceAll("(", "").replaceAll(")", "").toUpperCase();
}

function classifyLicense(license) {
  if (
    !license ||
    !license.trim() ||
    license.trim().toUpperCase() === "UNKNOWN"
  ) {
    return {
      level: "unknown",
      reason: "No license field found.",
    };
  }

  const normalized = normalizeLicense(license);

  if (
    /(^|[^A-Z])AGPL([^A-Z]|$)/i.test(normalized) ||
    /(^|[^A-Z])GPL([^A-Z]|$)/i.test(normalized) ||
    normalized.includes("SSPL") ||
    normalized.includes("BUSL") ||
    normalized.includes("UNLICENSED") ||
    normalized.includes("PROPRIETARY") ||
    normalized.includes("NONCOMMERCIAL") ||
    normalized.includes("CC-BY-NC")
  ) {
    return {
      level: "high-review",
      reason:
        "Strong copyleft, proprietary, or non-commercial pattern detected.",
    };
  }

  if (
    normalized.includes("LGPL") ||
    normalized.includes("MPL") ||
    normalized.includes("EPL") ||
    normalized.includes("CDDL") ||
    normalized.includes("CPL") ||
    normalized.includes("OSL") ||
    normalized.includes("SEE LICENSE") ||
    normalized.includes("CUSTOM")
  ) {
    return {
      level: "review",
      reason: "License should be reviewed before commercial delivery.",
    };
  }

  if (
    normalized.includes("PYTHON-2.0") ||
    normalized.includes("ZLIB") ||
    normalized.includes("CC-BY") ||
    normalized.includes("WTFPL")
  ) {
    return {
      level: "notice",
      reason:
        "Less common license. Usually not automatically bad, but review notices.",
    };
  }

  return {
    level: "ok",
    reason: "No risky license pattern detected by this script.",
  };
}

function getDependencyType(packageName, lockPackage, rootPackage) {
  const rootDependencies = new Set(Object.keys(rootPackage.dependencies ?? {}));
  const rootDevDependencies = new Set(
    Object.keys(rootPackage.devDependencies ?? {}),
  );

  if (rootDependencies.has(packageName)) return "production-direct";
  if (rootDevDependencies.has(packageName)) return "development-direct";
  if (lockPackage.dev || lockPackage.devOptional)
    return "development-transitive";
  if (lockPackage.optional) return "optional-transitive";

  return "production-transitive";
}

function comparePackages(a, b) {
  return (
    a.name.localeCompare(b.name) ||
    a.version.localeCompare(b.version) ||
    a.path.localeCompare(b.path)
  );
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = item[key] ?? "UNKNOWN";
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function markdownEscape(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderPackageTable(packages) {
  if (packages.length === 0) {
    return "_None found._\n";
  }

  const rows = [
    "| Level | Package | Version | License | Type | Reason |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const pkg of packages) {
    rows.push(
      `| ${markdownEscape(pkg.level)} | ${markdownEscape(pkg.name)} | ${markdownEscape(
        pkg.version,
      )} | ${markdownEscape(pkg.license)} | ${markdownEscape(
        pkg.dependencyType,
      )} | ${markdownEscape(pkg.reason)} |`,
    );
  }

  return `${rows.join("\n")}\n`;
}

function renderCountTable(counts, label) {
  const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) return "_None._\n";

  const rows = [`| ${label} | Count |`, "| --- | ---: |"];

  for (const [value, count] of entries) {
    rows.push(`| ${markdownEscape(value)} | ${count} |`);
  }

  return `${rows.join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(LOCKFILE_PATH)) {
    throw new Error(
      "Missing package-lock.json. Run this from the project root.",
    );
  }

  const lockfile = readJsonFile(LOCKFILE_PATH);
  const packages = lockfile.packages;

  if (!packages || typeof packages !== "object") {
    throw new Error("Invalid package-lock.json: missing packages object.");
  }

  const rootPackage = packages[""] ?? {};
  const inventory = [];

  for (const [lockPath, lockPackage] of Object.entries(packages)) {
    if (!lockPath.startsWith("node_modules/")) continue;
    if (!lockPackage || typeof lockPackage !== "object") continue;

    const name = packageNameFromLockPath(lockPath);

    if (!name) continue;

    const version =
      typeof lockPackage.version === "string" ? lockPackage.version : "UNKNOWN";

    const lockLicense =
      typeof lockPackage.license === "string" ? lockPackage.license : null;

    const license =
      lockLicense ?? readNodeModulesPackageLicense(lockPath) ?? "UNKNOWN";

    const classification = classifyLicense(license);

    inventory.push({
      name,
      version,
      license,
      level: classification.level,
      reason: classification.reason,
      dependencyType: getDependencyType(name, lockPackage, rootPackage),
      path: lockPath,
      resolved:
        typeof lockPackage.resolved === "string" ? lockPackage.resolved : null,
    });
  }

  inventory.sort(comparePackages);

  const reviewPackages = inventory.filter((pkg) =>
    ["unknown", "notice", "review", "high-review"].includes(pkg.level),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    source: "package-lock.json",
    packageCount: inventory.length,
    summary: {
      byLevel: countBy(inventory, "level"),
      byLicense: countBy(inventory, "license"),
      byDependencyType: countBy(inventory, "dependencyType"),
      reviewRequiredCount: reviewPackages.length,
    },
    reviewPackages,
    packages: inventory,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  const markdown = `# License Inventory

Generated: ${report.generatedAt}

Source: \`${report.source}\`

This report is generated from npm package metadata. It is a practical engineering audit aid, not legal advice.

## Summary

Total packages: ${report.packageCount}

### By Review Level

${renderCountTable(report.summary.byLevel, "Level")}

### By Dependency Type

${renderCountTable(report.summary.byDependencyType, "Dependency Type")}

## Packages Requiring Review

${renderPackageTable(reviewPackages)}

## License Counts

${renderCountTable(report.summary.byLicense, "License")}

## Notes

- \`ok\` means this script did not detect a risky license pattern.
- \`notice\` means the license is less common and notices should be reviewed.
- \`review\` means the package should be checked before commercial delivery.
- \`high-review\` means the package should not be ignored before commercial delivery.
- \`unknown\` means no license field was found in the lockfile or installed package metadata.
`;

  fs.writeFileSync(MD_REPORT_PATH, markdown);

  console.log(`License inventory generated:`);
  console.log(`- ${path.relative(process.cwd(), JSON_REPORT_PATH)}`);
  console.log(`- ${path.relative(process.cwd(), MD_REPORT_PATH)}`);
  console.log("");
  console.log(`Total packages: ${report.packageCount}`);
  console.log(
    `Packages requiring review: ${report.summary.reviewRequiredCount}`,
  );

  if (reviewPackages.length > 0) {
    console.log("");
    console.log("Review these first:");

    for (const pkg of reviewPackages.slice(0, 20)) {
      console.log(
        `- [${pkg.level}] ${pkg.name}@${pkg.version} — ${pkg.license}`,
      );
    }

    if (reviewPackages.length > 20) {
      console.log(`- ...and ${reviewPackages.length - 20} more`);
    }
  }
}

main();
