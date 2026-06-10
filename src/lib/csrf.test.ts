import { describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({
  env: {
    APP_URL: "http://localhost:3000",
    NODE_ENV: "test",
  },
}));

import { validateSameOriginRequest } from "./csrf";

type ErrorResponse = {
  message: string;
};

function createRequest(method: string, origin?: string) {
  return new Request("http://localhost:3000/api/test", {
    method,
    headers: origin ? { origin } : undefined,
  });
}

describe("validateSameOriginRequest", () => {
  it("allows safe GET requests without origin header", () => {
    const response = validateSameOriginRequest(createRequest("GET"));

    expect(response).toBeNull();
  });

  it("allows same-origin state-changing requests", () => {
    const response = validateSameOriginRequest(
      createRequest("POST", "http://localhost:3000"),
    );

    expect(response).toBeNull();
  });

  it("blocks state-changing requests without origin header", async () => {
    const response = validateSameOriginRequest(createRequest("POST"));
    const body = (await response?.json()) as ErrorResponse;

    expect(response?.status).toBe(403);
    expect(body.message).toBe("Invalid request origin.");
  });

  it("blocks state-changing requests from different origins", async () => {
    const response = validateSameOriginRequest(
      createRequest("DELETE", "https://evil.example.com"),
    );
    const body = (await response?.json()) as ErrorResponse;

    expect(response?.status).toBe(403);
    expect(body.message).toBe("Invalid request origin.");
  });

  it("blocks malformed origin headers", async () => {
    const response = validateSameOriginRequest(
      createRequest("PATCH", "not-a-valid-origin"),
    );
    const body = (await response?.json()) as ErrorResponse;

    expect(response?.status).toBe(403);
    expect(body.message).toBe("Invalid request origin.");
  });
});
