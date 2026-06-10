import "server-only";

import { randomUUID } from "node:crypto";

type LogValue = string | number | boolean | null | undefined;

export type LogContext = Record<string, LogValue | LogValue[]>;

type LogLevel = "info" | "warn" | "error";

function createLogId() {
  return `err_${randomUUID()}`;
}

function normalizeContext(context: LogContext) {
  const normalized: Record<
    string,
    string | number | boolean | null | LogValue[]
  > = {};

  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) {
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      name?: unknown;
      message?: unknown;
      code?: unknown;
    };

    return {
      name:
        typeof maybeError.name === "string" ? maybeError.name : "UnknownError",
      message:
        typeof maybeError.message === "string"
          ? maybeError.message
          : "Non-Error object thrown.",
      code: typeof maybeError.code === "string" ? maybeError.code : undefined,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Unknown error thrown.",
  };
}

function writeLog(
  level: LogLevel,
  message: string,
  context: LogContext,
  error?: unknown,
) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...normalizeContext(context),
    ...(error === undefined ? {} : { error: serializeError(error) }),
  };

  const serializedEntry = JSON.stringify(entry);

  if (level === "error") {
    console.error(serializedEntry);
    return;
  }

  if (level === "warn") {
    console.warn(serializedEntry);
    return;
  }

  console.info(serializedEntry);
}

export function logInfo(message: string, context: LogContext = {}) {
  writeLog("info", message, context);
}

export function logWarn(message: string, context: LogContext = {}) {
  writeLog("warn", message, context);
}

export function logError(
  message: string,
  error: unknown,
  context: LogContext = {},
) {
  const errorId = createLogId();

  writeLog("error", message, { ...context, errorId }, error);

  return errorId;
}

export function getReferenceMessage(message: string, errorId: string) {
  return `${message} Reference: ${errorId}`;
}
