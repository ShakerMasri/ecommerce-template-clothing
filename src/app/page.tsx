"use client";

import Link from "next/link";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";

export default function HomePage() {
  const { t } = useAppPreferences();

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
        <div>
          <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
            {t.home.badge}
          </p>

          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl md:text-6xl dark:text-white">
            {t.home.titleStart}{" "}
            <span className="text-orange-600">{t.home.titleBrand}</span>.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
            {t.home.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {t.actions.browseProducts}
            </Link>

            <Link
              href="/cart"
              className="rounded-full border border-zinc-300 px-6 py-3 text-center text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              {t.actions.viewCart}
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-zinc-100 p-6 dark:from-orange-950 dark:to-zinc-800">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
              {t.home.flowTitle}
            </p>

            <div className="mt-6 space-y-4">
              {t.home.highlights.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-950"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>

                    <div>
                      <h2 className="font-semibold text-zinc-950 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          {t.home.stats.map((item) => (
            <div key={item.title}>
              <p className="text-2xl font-black text-zinc-950 dark:text-white">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
