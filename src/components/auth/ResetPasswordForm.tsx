"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { authClient } from "~/lib/auth-client";

type ResetStatus = "idle" | "loading" | "success" | "error";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--ink)] transition outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_18%,transparent)]";

const labelClassName = "text-sm font-semibold text-[var(--ink)]";

const accentLinkClassName =
  "font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useAppPreferences();

  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<ResetStatus>("idle");
  const [message, setMessage] = useState("");

  const isSubmitting = status === "loading";
  const hasValidToken = Boolean(token) && !urlError;
  const hasMessage = Boolean(message);
  const hasError = status === "error" && hasMessage;
  const hasSuccess = status === "success" && hasMessage;
  const passwordError =
    hasError && message === t.auth.resetPasswordTooShort ? message : "";
  const confirmationError =
    hasError && message === t.auth.passwordsDoNotMatch ? message : "";
  const submitAreaError =
    hasError && !passwordError && !confirmationError ? message : "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setStatus("error");
      setMessage(t.auth.resetMissingToken);
      return;
    }

    if (newPassword.length < 8) {
      setStatus("error");
      setMessage(t.auth.resetPasswordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage(t.auth.passwordsDoNotMatch);
      return;
    }

    setStatus("loading");
    setMessage("");

    const { error } = await authClient.resetPassword({
      newPassword,
      token,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message ?? t.auth.resetPasswordFailed);
      return;
    }

    setStatus("success");
    setMessage(t.auth.resetPasswordSuccess);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-8">
      <section className="hidden lg:block">
        <p className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
          {t.auth.setNewPasswordBadge}
        </p>

        <h1 className="mt-6 max-w-xl text-5xl font-black tracking-tight text-[var(--ink)]">
          {t.auth.setNewPasswordHeroTitle}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ink-muted)]">
          {t.auth.setNewPasswordHeroDescription}
        </p>

        <div className="premium-shell mt-8 rounded-[2rem] p-5">
          <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-muted)] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              {t.auth.password}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
              {t.auth.passwordHelp}
            </p>
          </div>
        </div>
      </section>

      <section className="premium-shell rounded-[2rem] p-5 sm:p-8">
        <div>
          <p className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)] lg:hidden">
            {t.auth.setNewPasswordBadge}
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--ink)] lg:mt-0">
            {t.auth.resetPasswordTitle}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
            {t.auth.resetPasswordDescription}
          </p>
        </div>

        {urlError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-[var(--danger-ink)]/30 bg-[var(--danger-soft)] p-4 text-sm font-medium text-[var(--danger-ink)]"
          >
            {t.auth.invalidResetLink}
          </div>
        )}

        {hasMessage && (hasSuccess || submitAreaError) && (
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

        {!hasValidToken ? (
          <div className="mt-6">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--surface-page)] transition hover:opacity-90"
            >
              {t.auth.requestNewResetLink}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="newPassword" className={labelClassName}>
                {t.auth.newPassword}
              </label>

              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
                className={inputClassName}
                placeholder={t.auth.passwordPlaceholder}
                aria-invalid={passwordError ? "true" : undefined}
                aria-describedby={
                  passwordError ? "newPassword-error" : undefined
                }
              />

              {passwordError && (
                <p
                  id="newPassword-error"
                  className="mt-2 text-sm font-medium text-[var(--danger-ink)]"
                >
                  {passwordError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClassName}>
                {t.auth.confirmPassword}
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                className={inputClassName}
                placeholder={t.auth.repeatPassword}
                aria-invalid={confirmationError ? "true" : undefined}
                aria-describedby={
                  confirmationError ? "confirmPassword-error" : undefined
                }
              />

              {confirmationError && (
                <p
                  id="confirmPassword-error"
                  className="mt-2 text-sm font-medium text-[var(--danger-ink)]"
                >
                  {confirmationError}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-1">
              {submitAreaError && (
                <p
                  role="alert"
                  className="rounded-2xl border border-[var(--danger-ink)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger-ink)]"
                >
                  {submitAreaError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || status === "success"}
                className="min-h-12 w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--surface-page)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t.auth.resettingPassword : t.auth.resetPassword}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          <Link href="/login" className={accentLinkClassName}>
            {t.auth.backToLogin}
          </Link>
        </p>
      </section>
    </main>
  );
}
