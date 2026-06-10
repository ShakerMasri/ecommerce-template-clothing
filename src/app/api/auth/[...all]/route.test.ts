import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handlerGet: vi.fn(() => new Response(null, { status: 200 })),
  handlerPost: vi.fn(() => Response.json({ ok: true })),
  rateLimit: vi.fn(),
}));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: vi.fn(() => ({
    GET: mocks.handlerGet,
    POST: mocks.handlerPost,
  })),
}));

vi.mock("~/lib/auth", () => ({
  auth: {},
}));

vi.mock("~/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
}));

import { POST } from "./route";

function createJsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/[...all]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ ok: true });
    mocks.handlerPost.mockResolvedValue(Response.json({ ok: true }));
  });

  it("applies normal auth rate limit to all auth POST requests", async () => {
    const request = createJsonRequest("/api/auth/sign-in/email", {
      email: "test@example.com",
      password: "password123",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.rateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimit).toHaveBeenCalledWith(request, "auth");
    expect(mocks.handlerPost).toHaveBeenCalledWith(request);
  });

  it("applies stricter verification email limits before Better Auth handles resend", async () => {
    const request = createJsonRequest("/api/auth/send-verification-email", {
      email: "TEST@EXAMPLE.COM",
      callbackURL: "/account",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    expect(mocks.rateLimit).toHaveBeenNthCalledWith(1, request, "auth");
    expect(mocks.rateLimit).toHaveBeenNthCalledWith(
      2,
      request,
      "verificationEmail",
    );
    expect(mocks.rateLimit).toHaveBeenNthCalledWith(
      3,
      request,
      "verificationEmail",
      "verification-email:test@example.com",
    );

    expect(mocks.handlerPost).toHaveBeenCalledWith(request);
  });

  it("does not call Better Auth when verification email IP limit fails", async () => {
    const limitedResponse = Response.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 },
    );

    mocks.rateLimit
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, response: limitedResponse });

    const request = createJsonRequest("/api/auth/send-verification-email", {
      email: "test@example.com",
      callbackURL: "/account",
    });

    const response = await POST(request);
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(429);
    expect(body.message).toBe("Too many requests. Please try again later.");
    expect(mocks.handlerPost).not.toHaveBeenCalled();
  });

  it("does not call Better Auth when verification email address limit fails", async () => {
    const limitedResponse = Response.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 },
    );

    mocks.rateLimit
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, response: limitedResponse });

    const request = createJsonRequest("/api/auth/send-verification-email", {
      email: "test@example.com",
      callbackURL: "/account",
    });

    const response = await POST(request);
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(429);
    expect(body.message).toBe("Too many requests. Please try again later.");
    expect(mocks.handlerPost).not.toHaveBeenCalled();
  });
});
