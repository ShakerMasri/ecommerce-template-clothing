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

export function LoginForm({ googleSignInEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useAppPreferences();

  const callbackUrl = getSafeAuthCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleGoogleSignIn() {
    setStatus("google");
    setMessage("");

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

    const { error } = await authClient.signIn.email({
      email,
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

  return (
    <div className="mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden lg:block">
        <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
          {t.auth.welcomeBackBadge}
        </p>

        <h1 className="mt-6 text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
          {t.auth.loginHeroTitle}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {t.auth.loginHeroDescription}
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            {t.auth.loginTitle}
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t.auth.loginDescription}
          </p>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {message}
          </div>
        )}

        {googleSignInEnabled && (
          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={isSubmitting || isStartingGoogleSignIn}
              className="flex w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
            >
              {isStartingGoogleSignIn
                ? t.auth.continuingWithGoogle
                : t.auth.continueWithGoogle}
            </button>

            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              <span>{t.auth.orContinueWithEmail}</span>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
            >
              {t.auth.email}
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
              >
                {t.auth.password}
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                {t.auth.forgotPassword}
              </Link>
            </div>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
              placeholder={t.auth.password}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isStartingGoogleSignIn}
            className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? t.auth.loggingIn : t.auth.login}
          </button>

          <p className="text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {t.legal.notices.bySigningIn}{" "}
            <Link
              href="/privacy"
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              {t.legal.notices.privacyPolicy}
            </Link>{" "}
            {t.legal.notices.and}{" "}
            <Link
              href="/terms"
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              {t.legal.notices.termsOfUse}
            </Link>
            .
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t.auth.noAccount}{" "}
          <Link
            href="/register"
            className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            {t.auth.createOne}
          </Link>
        </p>
      </section>
    </div>
  );
}
