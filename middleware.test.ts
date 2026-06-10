import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

function createNextRequest(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("middleware", () => {
  it("redirects signed-out account users to login", () => {
    const response = middleware(createNextRequest("/account"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?callbackUrl=%2Faccount",
    );
  });

  it("redirects signed-out admin users to login", () => {
    const response = middleware(createNextRequest("/admin/products"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?callbackUrl=%2Fadmin%2Fproducts",
    );
  });

  it("allows account users with Better Auth session cookie", () => {
    const response = middleware(
      createNextRequest("/account", "better-auth.session_token=test-token"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows admin users with secure Better Auth session cookie", () => {
    const response = middleware(
      createNextRequest(
        "/admin",
        "__Secure-better-auth.session_token=test-token",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
