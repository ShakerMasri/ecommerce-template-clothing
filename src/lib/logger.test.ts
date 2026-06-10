import { afterEach, describe, expect, it, vi } from "vitest";
import { getReferenceMessage, logError } from "./logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a structured error with a searchable error id", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const errorId = logError(
      "Failed to process order.",
      new Error("Database unavailable."),
      {
        action: "order.create",
        route: "/api/orders",
        userId: "user_123",
      },
    );

    expect(errorId).toMatch(/^err_[0-9a-f-]{36}$/);
    expect(consoleError).toHaveBeenCalledTimes(1);

    const [loggedValue] = consoleError.mock.calls[0] ?? [];
    expect(typeof loggedValue).toBe("string");

    const parsed = JSON.parse(String(loggedValue)) as {
      level: string;
      message: string;
      action: string;
      route: string;
      userId: string;
      errorId: string;
      error: {
        name: string;
        message: string;
      };
    };

    expect(parsed).toMatchObject({
      level: "error",
      message: "Failed to process order.",
      action: "order.create",
      route: "/api/orders",
      userId: "user_123",
      errorId,
      error: {
        name: "Error",
        message: "Database unavailable.",
      },
    });
  });

  it("adds an error reference to user-facing messages", () => {
    expect(getReferenceMessage("Failed to place order.", "err_123")).toBe(
      "Failed to place order. Reference: err_123",
    );
  });
});
