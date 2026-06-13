"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { getSafeAuthCallbackUrl } from "~/lib/auth-callback";
import { authClient } from "~/lib/auth-client";

type LoginStatus = "idle" | "loading" | "google" | "error";

type LoginFormProps = {
  googleSignInEnabled: boolean;
};

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--ink)] transition outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_18%,transparent)]";

const invalidInputClassName =
  "border-[var(--danger-ink)]/50 focus:border-[var(--danger-ink)] focus:ring-[color-mix(in_srgb,var(--danger-ink)_18%,transparent)]";

const labelClassName = "text-sm font-semibold text-[var(--ink)]";

const mutedTextClassName = "text-sm leading-6 text-[var(--ink-muted)]";

const accentLinkClassName =
  "font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildInputClassName(hasError: boolean) {
  return hasError
    ? `${inputClassName} ${invalidInputClassName}`
    : inputClassName;
}

export function LoginForm({ googleSignInEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useAppPreferences();

  const callbackUrl = getSafeAuthCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  function validateForm() {
    const nextFieldErrors: LoginFieldErrors = {};
    const trimmedEmail = email.trim();

    if (!emailPattern.test(trimmedEmail)) {
      nextFieldErrors.email = t.auth.emailInvalid;
    }

    if (password.length === 0) {
      nextFieldErrors.password = t.auth.passwordRequired;
    }

    return nextFieldErrors;
  }

  async function handleGoogleSignIn() {
    setStatus("google");
    setMessage("");
    setFieldErrors({});

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackUrl,
      errorCallbackURL: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message ?? t.auth.googleSignInFailed);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("loading");
    setMessage("");
    setFieldErrors({});

    const nextFieldErrors = validateForm();

    if (Object.keys(nextFieldErrors).length > 0) {
      setStatus("error");
      setFieldErrors(nextFieldErrors);
      setMessage(t.auth.fixHighlightedFields);
      return;
    }

    const { error } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(t.auth.invalidLogin);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  const isSubmitting = status === "loading";
  const isStartingGoogleSignIn = status === "google";
  const hasError = status === "error" && Boolean(message);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-8">
      <section className="hidden lg:block">
        <p className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
          {t.auth.welcomeBackBadge}
        </p>

        <h1 className="mt-6 max-w-xl text-5xl font-black tracking-tight text-[var(--ink)]">
          {t.auth.loginHeroTitle}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ink-muted)]">
          {t.auth.loginHeroDescription}
        </p>
      </section>

      <section className="premium-shell rounded-[2rem] p-5 sm:p-8">
        <div>
          <p className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold tracking-[0.18em] text-[var(--accent-strong)] uppercase lg:hidden">
            {t.auth.welcomeBackBadge}
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--ink)] lg:mt-0">
            {t.auth.loginTitle}
          </h1>

          <p className={`mt-2 ${mutedTextClassName}`}>
            {t.auth.loginDescription}
          </p>
        </div>

        {googleSignInEnabled && (
          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={isSubmitting || isStartingGoogleSignIn}
              className="flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-elevated)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStartingGoogleSignIn
                ? t.auth.continuingWithGoogle
                : t.auth.continueWithGoogle}
            </button>

            <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-[var(--ink-muted)] uppercase">
              <span className="h-px flex-1 bg-[var(--line-soft)]" />
              <span>{t.auth.orContinueWithEmail}</span>
              <span className="h-px flex-1 bg-[var(--line-soft)]" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="email" className={labelClassName}>
              {t.auth.email}
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              required
              className={buildInputClassName(Boolean(fieldErrors.email))}
              placeholder="you@example.com"
              aria-invalid={fieldErrors.email ? "true" : undefined}
              aria-describedby={
                fieldErrors.email ? "login-email-error" : undefined
              }
            />

            {fieldErrors.email && (
              <p
                id="login-email-error"
                className="mt-2 text-xs font-medium text-[var(--danger-ink)]"
              >
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className={labelClassName}>
                {t.auth.password}
              </label>

              <Link href="/forgot-password" className={accentLinkClassName}>
                {t.auth.forgotPassword}
              </Link>
            </div>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((current) => ({
                  ...current,
                  password: undefined,
                }));
              }}
              required
              className={buildInputClassName(Boolean(fieldErrors.password))}
              placeholder={t.auth.password}
              aria-invalid={fieldErrors.password ? "true" : undefined}
              aria-describedby={
                fieldErrors.password ? "login-password-error" : undefined
              }
            />

            {fieldErrors.password && (
              <p
                id="login-password-error"
                className="mt-2 text-xs font-medium text-[var(--danger-ink)]"
              >
                {fieldErrors.password}
              </p>
            )}
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
              disabled={isSubmitting || isStartingGoogleSignIn}
              className="min-h-12 w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--surface-page)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t.auth.loggingIn : t.auth.login}
            </button>
          </div>

          <p className="text-center text-xs leading-5 text-[var(--ink-muted)]">
            {t.legal.notices.bySigningIn}{" "}
            <Link href="/privacy" className={accentLinkClassName}>
              {t.legal.notices.privacyPolicy}
            </Link>{" "}
            {t.legal.notices.and}{" "}
            <Link href="/terms" className={accentLinkClassName}>
              {t.legal.notices.termsOfUse}
            </Link>
            .
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          {t.auth.noAccount}{" "}
          <Link href="/register" className={accentLinkClassName}>
            {t.auth.createOne}
          </Link>
        </p>
      </section>
    </main>
  );
}
