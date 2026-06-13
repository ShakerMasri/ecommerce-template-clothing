"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { authClient } from "~/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useAppPreferences();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    await authClient.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={isSigningOut}
      className="min-h-11 rounded-full border border-[var(--danger-ink)]/25 bg-[var(--danger-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--danger-ink)] transition hover:border-[var(--danger-ink)]/45 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSigningOut ? t.auth.signingOut : t.auth.signOut}
    </button>
  );
}
