"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { authClient } from "~/lib/auth-client";

type RequestStatus = "idle" | "loading" | "success" | "error";

export function ForgotPasswordForm() {
  const { t } = useAppPreferences();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [message, setMessage] = useState("");

  const isSubmitting = status === "loading";

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
    <main className="mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden lg:block">
        <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
          {t.auth.forgotPasswordBadge}
        </p>

        <h1 className="mt-6 text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
          {t.auth.forgotPasswordHeroTitle}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {t.auth.forgotPasswordHeroDescription}
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            {t.auth.forgotPasswordTitle}
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t.auth.forgotPasswordDescription}
          </p>
        </div>

        {message && (
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${
              status === "success"
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {message}
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? t.auth.sendingResetLink : t.auth.sendResetLink}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t.auth.rememberPassword}{" "}
          <Link
            href="/login"
            className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            {t.auth.backToLogin}
          </Link>
        </p>
      </section>
    </main>
  );
}
