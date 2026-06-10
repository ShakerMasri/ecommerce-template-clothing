import { describe, expect, it } from "vitest";
import { getSafeAuthCallbackUrl } from "./auth-callback";

describe("getSafeAuthCallbackUrl", () => {
  it("uses products as the default fallback", () => {
    expect(getSafeAuthCallbackUrl(null)).toBe("/products");
    expect(getSafeAuthCallbackUrl(undefined)).toBe("/products");
  });

  it("allows safe relative callback URLs", () => {
    expect(getSafeAuthCallbackUrl("/cart")).toBe("/cart");
    expect(getSafeAuthCallbackUrl("/admin/products?page=2")).toBe(
      "/admin/products?page=2",
    );
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(getSafeAuthCallbackUrl("https://evil.example/login")).toBe(
      "/products",
    );
    expect(getSafeAuthCallbackUrl("//evil.example/login")).toBe("/products");
  });

  it("rejects backslash and control-character tricks", () => {
    expect(getSafeAuthCallbackUrl("/\\evil.example")).toBe("/products");
    expect(getSafeAuthCallbackUrl("/cart\nLocation: https://evil.example")).toBe(
      "/products",
    );
  });
});
