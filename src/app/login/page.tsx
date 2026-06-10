import { Suspense } from "react";
import { LoginForm } from "~/components/auth/LoginForm";
import { env } from "~/env";

export default function LoginPage() {
  const googleSignInEnabled = Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-96 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        </main>
      }
    >
      <LoginForm googleSignInEnabled={googleSignInEnabled} />
    </Suspense>
  );
}
