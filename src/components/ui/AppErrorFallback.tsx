"use client";

import Link from "next/link";

type AppErrorFallbackProps = {
  title: string;
  description: string;
  reset?: () => void;
  homeHref?: string;
  homeLabel?: string;
  retryLabel?: string;
};

export function AppErrorFallback({
  title,
  description,
  reset,
  homeHref = "/",
  homeLabel = "Go home",
  retryLabel = "Try again",
}: AppErrorFallbackProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:py-20">
      <div
        role="alert"
        className="w-full rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-orange-600">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
          {description}
        </p>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          The page hides technical details for security. If this keeps happening,
          tell the store owner what page you were using and what action failed.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {reset ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {retryLabel}
            </button>
          ) : null}
          <Link
            href={homeHref}
            className="rounded-full border border-zinc-200 px-5 py-3 text-center text-sm font-bold text-zinc-950 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-50"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
