import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("~/server/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { requireAdmin, requireAdminPage } from "./admin";

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("returns 404 response when user is signed out", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.response.status).toBe(404);

      const body = (await result.response.json()) as { message: string };
      expect(body.message).toBe("Not found.");
    }
  });

  it("returns 404 response when user is not admin", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "user-1",
        role: "CUSTOMER",
      },
    });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.response.status).toBe(404);
    }
  });

  it("returns admin user when user is admin", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    const result = await requireAdmin();

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.user).toEqual({
        id: "admin-1",
        role: "ADMIN",
      });
    }
  });
});

describe("requireAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("redirects signed-out users to login with callback URL", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(requireAdminPage("/admin/products")).rejects.toThrow(
      "REDIRECT:/login?callbackUrl=%2Fadmin%2Fproducts",
    );

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Fadmin%2Fproducts",
    );
  });

  it("redirects non-admin users to home", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "user-1",
        role: "CUSTOMER",
      },
    });

    await expect(requireAdminPage()).rejects.toThrow("REDIRECT:/");

    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("returns session when user is admin", async () => {
    const session = {
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    };

    mocks.auth.mockResolvedValue(session);

    await expect(requireAdminPage()).resolves.toEqual(session);
  });
});
