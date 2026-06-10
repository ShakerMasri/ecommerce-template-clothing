import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_PATHS = ["/", "/products"];
const DEFAULT_ROUNDS = 5;
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_TIMEOUT_MS = 15_000;

const MAX_ROUNDS = 20;
const MAX_CONCURRENCY = 3;
const MAX_TOTAL_REQUESTS = 60;

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env.smoke.local");

  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  const envKeyPattern = /^[A-Z0-9_]+$/;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!envKeyPattern.test(key)) continue;

    const value = stripQuotes(rawValue);

    process.env[key] ??= value;
  }
}

function stripQuotes(value) {
  if (value.length < 2) return value;

  const first = value[0];
  const last = value[value.length - 1];

  if ((first === `"` && last === `"`) || (first === `'` && last === `'`)) {
    return value.slice(1, -1);
  }

  return value;
}

function getPositiveInteger(name, fallback, max) {
  const rawValue = process.env[name];

  if (!rawValue) return fallback;

  const value = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  if (value > max) {
    throw new Error(`${name} must be ${max} or lower for staging safety.`);
  }

  return value;
}

function getPaths() {
  const rawPaths = process.env.SMOKE_PATHS;

  if (!rawPaths) return DEFAULT_PATHS;

  const paths = rawPaths
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (paths.length === 0) {
    throw new Error("SMOKE_PATHS must include at least one path.");
  }

  for (const smokePath of paths) {
    assertSafePath(smokePath);
  }

  return paths;
}

function assertSafePath(smokePath) {
  if (!smokePath.startsWith("/") || smokePath.startsWith("//")) {
    throw new Error(
      `Unsafe path "${smokePath}". Use relative paths like /products.`,
    );
  }

  if (smokePath.includes(" ")) {
    throw new Error(
      `Unsafe path "${smokePath}". Paths must not contain spaces.`,
    );
  }
}

function getBaseURL() {
  const baseURL = process.env.SMOKE_BASE_URL ?? DEFAULT_BASE_URL;
  const url = new URL(baseURL);

  const isSafeLocalhost =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (!isSafeLocalhost) {
    throw new Error(
      `Unsafe smoke-load target: ${url.origin}. Only localhost is allowed until this template has its own staging URL.`,
    );
  }

  return url.origin;
}

async function fetchWithTiming(baseURL, smokePath, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const url = new URL(smokePath, baseURL);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "EcommerceTemplateSmokeLoad/1.0",
        accept: "text/html,application/json",
      },
    });

    const durationMs = Math.round(performance.now() - start);

    return {
      path: smokePath,
      ok: response.ok,
      status: response.status,
      durationMs,
      error: null,
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);

    return {
      path: smokePath,
      ok: false,
      status: null,
      durationMs,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index;
      index += 1;

      const result = await tasks[currentIndex]();

      results[currentIndex] = result;
      printResult(result);
    }
  }

  const workers = [];

  for (let i = 0; i < concurrency; i += 1) {
    workers.push(worker());
  }

  await Promise.all(workers);

  return results;
}

function printResult(result) {
  const status = result.ok ? "OK" : "FAIL";
  const httpStatus = result.status ?? "ERR";
  const errorText = result.error ? ` - ${result.error}` : "";

  console.log(
    `${status} GET ${result.path} ${httpStatus} ${result.durationMs}ms${errorText}`,
  );
}

function percentile(values, percent) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percent / 100) * sorted.length) - 1;
  const safeIndex = Math.min(Math.max(index, 0), sorted.length - 1);

  return sorted[safeIndex];
}

function printSummary(results) {
  const durations = results.map((result) => result.durationMs);
  const failures = results.filter((result) => !result.ok);
  const totalDuration = durations.reduce((sum, value) => sum + value, 0);
  const average = Math.round(totalDuration / durations.length);

  console.log("");
  console.log("Smoke-load summary");
  console.log("------------------");
  console.log(`Total requests: ${results.length}`);
  console.log(`Passed: ${results.length - failures.length}`);
  console.log(`Failed: ${failures.length}`);
  console.log(`Average: ${average}ms`);
  console.log(`P95: ${percentile(durations, 95)}ms`);
  console.log(`Max: ${Math.max(...durations)}ms`);
}

loadLocalEnv();

const baseURL = getBaseURL();
const paths = getPaths();
const rounds = getPositiveInteger("SMOKE_ROUNDS", DEFAULT_ROUNDS, MAX_ROUNDS);
const concurrency = getPositiveInteger(
  "SMOKE_CONCURRENCY",
  DEFAULT_CONCURRENCY,
  MAX_CONCURRENCY,
);
const timeoutMs = getPositiveInteger(
  "SMOKE_TIMEOUT_MS",
  DEFAULT_TIMEOUT_MS,
  30_000,
);

const totalRequests = paths.length * rounds;

if (totalRequests > MAX_TOTAL_REQUESTS) {
  throw new Error(
    `Too many requests: ${totalRequests}. Limit is ${MAX_TOTAL_REQUESTS}.`,
  );
}

console.log(`Smoke-load target: ${baseURL}`);
console.log(`Paths: ${paths.join(", ")}`);
console.log(`Rounds: ${rounds}`);
console.log(`Concurrency: ${concurrency}`);
console.log(`Total requests: ${totalRequests}`);
console.log("");

const tasks = [];

for (let round = 1; round <= rounds; round += 1) {
  for (const smokePath of paths) {
    tasks.push(() => fetchWithTiming(baseURL, smokePath, timeoutMs));
  }
}

const results = await runWithConcurrency(tasks, concurrency);

printSummary(results);

const failed = results.some((result) => !result.ok);

if (failed) {
  process.exitCode = 1;
}
