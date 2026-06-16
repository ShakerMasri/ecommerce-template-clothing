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
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="premium-shell rounded-[2rem] p-5 sm:p-8 lg:p-10">
        <p className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
          {badge}
        </p>

        <h1 className="mt-5 text-3xl font-bold tracking-[-0.035em] text-[var(--ink)] sm:text-4xl">
          {title}
        </h1>

        <p className="mt-4 text-base leading-7 text-[var(--ink-muted)]">
          {description}
        </p>

        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          {lastUpdatedLabel}: {lastUpdatedDate}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-[var(--ink-muted)]">
          {children}
        </div>
      </div>
    </section>
  );
}
