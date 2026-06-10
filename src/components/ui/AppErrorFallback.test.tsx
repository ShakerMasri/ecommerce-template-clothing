import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppErrorFallback } from "./AppErrorFallback";

describe("AppErrorFallback", () => {
  it("renders a safe error message and retry action", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(
      <AppErrorFallback
        title="We could not load this page."
        description="Please try again."
        reset={reset}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("We could not load this page.")).toBeInTheDocument();
    expect(screen.getByText(/hides technical details/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
