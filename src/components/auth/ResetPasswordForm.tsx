"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { authClient } from "~/lib/auth-client";

type ResetStatus = "idle" | "loading" | "success" | "error";

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
    <main className="mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden lg:block">
        <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
          {t.auth.setNewPasswordBadge}
        </p>

        <h1 className="mt-6 text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
          {t.auth.setNewPasswordHeroTitle}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {t.auth.setNewPasswordHeroDescription}
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            {t.auth.resetPasswordTitle}
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t.auth.resetPasswordDescription}
          </p>
        </div>

        {urlError && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {t.auth.invalidResetLink}
          </div>
        )}

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

        {!hasValidToken ? (
          <div className="mt-6">
            <Link
              href="/forgot-password"
              className="inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {t.auth.requestNewResetLink}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
              >
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
                className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                placeholder={t.auth.passwordPlaceholder}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
              >
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
                className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                placeholder={t.auth.repeatPassword}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || status === "success"}
              className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? t.auth.resettingPassword : t.auth.resetPassword}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
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
