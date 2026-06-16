"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "~/components/auth/SignOutButton";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { authClient } from "~/lib/auth-client";

const RESEND_VERIFICATION_COOLDOWN_SECONDS = 60;
const RESEND_VERIFICATION_STORAGE_KEY = "ecommerce-template-verification-cooldown";

type AccountClientProps = {
  user: {
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
    phone: string;
  };
};

export function AccountClient({ user }: AccountClientProps) {
  const { t } = useAppPreferences();

  const displayName = user.name || t.account.customer;
  const firstLetter = displayName.trim().charAt(0).toUpperCase() || "U";

  const hasPhone = Boolean(user.phone.trim());
  const canCheckout = user.emailVerified && hasPhone;

  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const storedCooldownEnd = window.localStorage.getItem(
      RESEND_VERIFICATION_STORAGE_KEY,
    );

    if (!storedCooldownEnd) {
      return;
    }

    const cooldownEnd = Number(storedCooldownEnd);

    if (!Number.isFinite(cooldownEnd)) {
      window.localStorage.removeItem(RESEND_VERIFICATION_STORAGE_KEY);
      return;
    }

    const remainingSeconds = Math.max(
      0,
      Math.ceil((cooldownEnd - Date.now()) / 1000),
    );

    setResendCooldown(remainingSeconds);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) {
      window.localStorage.removeItem(RESEND_VERIFICATION_STORAGE_KEY);

      return;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((currentCooldown) => Math.max(0, currentCooldown - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResendVerificationEmail() {
    if (isSendingVerification || resendCooldown > 0) {
      return;
    }

    setIsSendingVerification(true);
    setVerificationMessage("");
    setResendCooldown(RESEND_VERIFICATION_COOLDOWN_SECONDS);
    window.localStorage.setItem(
      RESEND_VERIFICATION_STORAGE_KEY,
      (Date.now() + RESEND_VERIFICATION_COOLDOWN_SECONDS * 1000).toString(),
    );

    try {
      const { error } = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/account",
      });

      if (error) {
        setVerificationMessage(t.account.failedToSendVerificationEmail);
        return;
      }

      setVerificationMessage(t.account.verificationEmailSent);
    } catch {
      setVerificationMessage(t.account.failedToSendVerificationEmail);
    } finally {
      setIsSendingVerification(false);
    }
  }

  return (
    <main className="workspace-ui mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
          {t.account.badge}
        </p>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
              {t.account.title}
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t.account.description}
            </p>
          </div>

          <SignOutButton />
        </div>
      </section>

      {!canCheckout && (
        <section className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm sm:p-6 dark:border-orange-900 dark:bg-orange-950">
          <p className="text-sm font-bold text-orange-800 dark:text-orange-200">
            {t.account.accountSetupRequired}
          </p>

          <p className="mt-2 text-sm leading-6 text-orange-800/90 dark:text-orange-200/90">
            {t.account.accountSetupDescription}
          </p>

          <ul className="mt-4 space-y-2 text-sm text-orange-900 dark:text-orange-100">
            <li className="flex gap-2">
              <span aria-hidden="true">{user.emailVerified ? "✅" : "⚠️"}</span>
              <span>
                {t.account.emailVerification}:{" "}
                <strong>
                  {user.emailVerified
                    ? t.account.verified
                    : t.account.notVerified}
                </strong>
              </span>
            </li>

            <li className="flex gap-2">
              <span aria-hidden="true">{hasPhone ? "✅" : "⚠️"}</span>
              <span>
                {t.account.phoneNumber}:{" "}
                <strong>
                  {hasPhone ? t.account.added : t.account.missing}
                </strong>
              </span>
            </li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {t.account.updateProfile}
            </Link>

            {!user.emailVerified && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => void handleResendVerificationEmail()}
                  disabled={isSendingVerification || resendCooldown > 0}
                  className="rounded-full border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900"
                >
                  {isSendingVerification
                    ? t.account.sendingVerificationEmail
                    : resendCooldown > 0
                      ? `${t.account.resendVerificationEmail} (${resendCooldown}s)`
                      : t.account.resendVerificationEmail}
                </button>

                {verificationMessage && (
                  <p className="text-sm leading-6 text-orange-800 dark:text-orange-200">
                    {verificationMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-xl font-black text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            {firstLetter}
          </div>

          <h2 className="mt-5 text-xl font-black text-zinc-950 dark:text-white">
            {displayName}
          </h2>

          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {user.email || t.account.noEmail}
          </p>

          <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              {t.account.emailStatus}:{" "}
              <span className="font-semibold text-zinc-950 dark:text-white">
                {user.emailVerified
                  ? t.account.verified
                  : t.account.notVerified}
              </span>
            </p>

            <p>
              {t.account.phone}:{" "}
              <span className="font-semibold text-zinc-950 dark:text-white">
                {hasPhone ? user.phone : t.account.notAdded}
              </span>
            </p>
          </div>

          <div className="mt-5 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {user.role}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-black text-zinc-950 dark:text-white">
            {t.account.quickActions}
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/products"
              className="rounded-2xl border border-zinc-200 p-4 transition hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:hover:border-orange-900 dark:hover:bg-orange-950"
            >
              <p className="font-bold text-zinc-950 dark:text-white">
                {t.account.browseProducts}
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {t.account.browseProductsDescription}
              </p>
            </Link>

            <Link
              href="/profile"
              className="rounded-2xl border border-zinc-200 p-4 transition hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:hover:border-orange-900 dark:hover:bg-orange-950"
            >
              <p className="font-bold text-zinc-950 dark:text-white">
                {t.account.updateProfile}
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {t.account.updateProfileDescription}
              </p>
            </Link>

            <Link
              href="/cart"
              className="rounded-2xl border border-zinc-200 p-4 transition hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:hover:border-orange-900 dark:hover:bg-orange-950"
            >
              <p className="font-bold text-zinc-950 dark:text-white">
                {t.account.viewCart}
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {t.account.viewCartDescription}
              </p>
            </Link>

            <Link
              href="/orders"
              className="rounded-2xl border border-zinc-200 p-4 transition hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:hover:border-orange-900 dark:hover:bg-orange-950"
            >
              <p className="font-bold text-zinc-950 dark:text-white">
                {t.account.myOrders}
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {t.account.myOrdersDescription}
              </p>
            </Link>

            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-2xl border border-zinc-200 p-4 transition hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:hover:border-orange-900 dark:hover:bg-orange-950"
              >
                <p className="font-bold text-zinc-950 dark:text-white">
                  {t.account.adminDashboard}
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {t.account.adminDashboardDescription}
                </p>
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
