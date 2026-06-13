"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { authClient } from "~/lib/auth-client";

type RequestStatus = "idle" | "loading" | "success" | "error";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--ink)] transition outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_18%,transparent)]";

const labelClassName = "text-sm font-semibold text-[var(--ink)]";

const accentLinkClassName =
  "font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]";

export function ForgotPasswordForm() {
  const { t } = useAppPreferences();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [message, setMessage] = useState("");

  const isSubmitting = status === "loading";
  const hasMessage = Boolean(message);
  const hasError = status === "error" && hasMessage;
  const hasSuccess = status === "success" && hasMessage;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("loading");
    setMessage("");

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      setStatus("success");
      setMessage(t.auth.resetRequestSuccess);
    } catch {
      setStatus("error");
      setMessage(t.auth.resetRequestFailed);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-8">
      <section className="hidden lg:block">
        <p className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
          {t.auth.forgotPasswordBadge}
        </p>

        <h1 className="mt-6 max-w-xl text-5xl font-black tracking-tight text-[var(--ink)]">
          {t.auth.forgotPasswordHeroTitle}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ink-muted)]">
          {t.auth.forgotPasswordHeroDescription}
        </p>
      </section>

      <section className="premium-shell rounded-[2rem] p-5 sm:p-8">
        <div>
          <p className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold tracking-[0.18em] text-[var(--accent-strong)] uppercase lg:hidden">
            {t.auth.forgotPasswordBadge}
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--ink)] lg:mt-0">
            {t.auth.forgotPasswordTitle}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
            {t.auth.forgotPasswordDescription}
          </p>
        </div>

        {hasMessage && (
          <div
            role="alert"
            className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${
              hasSuccess
                ? "border-[var(--success-ink)]/30 bg-[var(--success-soft)] text-[var(--success-ink)]"
                : "border-[var(--danger-ink)]/30 bg-[var(--danger-soft)] text-[var(--danger-ink)]"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className={labelClassName}>
              {t.auth.email}
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={inputClassName}
              placeholder="you@example.com"
              aria-invalid={hasError ? "true" : undefined}
            />
          </div>

          <div className="space-y-3 pt-1">
            {hasError && (
              <p
                role="alert"
                className="rounded-2xl border border-[var(--danger-ink)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger-ink)]"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--surface-page)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t.auth.sendingResetLink : t.auth.sendResetLink}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          {t.auth.rememberPassword}{" "}
          <Link href="/login" className={accentLinkClassName}>
            {t.auth.backToLogin}
          </Link>
        </p>
      </section>
    </main>
  );
}
