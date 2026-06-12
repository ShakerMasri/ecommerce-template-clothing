"use client";

import Link from "next/link";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";

export default function HomePage() {
  const { t } = useAppPreferences();

  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--surface-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)] shadow-sm">
            {t.home.badge}
          </p>

          <h1 className="mt-6 text-5xl font-bold leading-[0.94] tracking-[-0.055em] text-[var(--ink)] sm:text-6xl lg:text-7xl">
            {t.home.titleStart} <br />
            <span className="font-editorial italic text-[var(--accent-strong)]">
              {t.home.titleBrand}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
            {t.home.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--ink)] px-7 py-3 text-sm font-semibold text-[var(--surface-page)] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
            >
              {t.actions.browseProducts}
            </Link>

            <Link
              href="/cart"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-card)] px-7 py-3 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              {t.actions.viewCart}
            </Link>
          </div>
        </div>

        <div className="premium-shell overflow-hidden rounded-[2rem] p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-muted)] p-4">
              <div className="aspect-[3/4] rounded-[1.25rem] border border-[var(--line-soft)] bg-gradient-to-b from-[var(--surface-elevated)] via-[var(--accent-soft)] to-[var(--accent)]" />
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-elevated)] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {t.home.flowTitle}
                </p>

                <div className="mt-6 space-y-5">
                  {t.home.highlights.map((item, index) => (
                    <div key={item.title} className="grid grid-cols-[2rem_1fr] gap-4">
                      <span className="pt-0.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)]">
                          {item.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2" aria-hidden="true">
                <span className="h-12 rounded-xl border border-[var(--line-soft)] bg-[var(--ink)]" />
                <span className="h-12 rounded-xl border border-[var(--line-soft)] bg-[var(--accent)]" />
                <span className="h-12 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-muted)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {t.home.stats.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6"
            >
              <p className="text-base font-semibold text-[var(--ink)]">
                {item.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
