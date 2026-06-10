import type { ReactNode } from "react";

type LegalPageProps = {
  badge: string;
  title: string;
  description: string;
  lastUpdatedLabel: string;
  lastUpdatedDate: string;
  children: ReactNode;
};

export function LegalPage({
  badge,
  title,
  description,
  lastUpdatedLabel,
  lastUpdatedDate,
  children,
}: LegalPageProps) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
          {badge}
        </p>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
          {title}
        </h1>

        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {description}
        </p>

        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {lastUpdatedLabel}: {lastUpdatedDate}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
      </div>
    </section>
  );
}
