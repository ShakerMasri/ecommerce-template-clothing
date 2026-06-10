import { NextResponse } from "next/server";
import { env } from "~/env";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(request: Request) {
  const allowedOrigins = [getOrigin(env.APP_URL)];

  if (env.NODE_ENV !== "production") {
    allowedOrigins.push(getOrigin(request.url));
  }

  return new Set(allowedOrigins.filter((origin) => origin !== null));
}

export function validateSameOriginRequest(request: Request) {
  if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const originHeader = request.headers.get("origin");

  if (!originHeader) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const requestOrigin = getOrigin(originHeader);

  if (!requestOrigin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const allowedOrigins = getAllowedOrigins(request);

  if (!allowedOrigins.has(requestOrigin)) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 },
    );
  }

  return null;
}
