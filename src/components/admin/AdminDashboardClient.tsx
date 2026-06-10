"use client";

import Link from "next/link";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";

export function AdminDashboardClient() {
  const { t } = useAppPreferences();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
          {t.admin.dashboard.badge}
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          {t.admin.dashboard.title}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {t.admin.dashboard.description}
        </p>
      </section>

      <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/products"
          className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-900 dark:hover:bg-orange-950"
        >
          <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
            {t.admin.dashboard.productsBadge}
          </p>

          <h2 className="mt-3 text-xl font-black text-zinc-950 dark:text-white">
            {t.admin.dashboard.productsTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t.admin.dashboard.productsDescription}
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-900 dark:hover:bg-orange-950"
        >
          <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
            {t.admin.dashboard.ordersBadge}
          </p>

          <h2 className="mt-3 text-xl font-black text-zinc-950 dark:text-white">
            {t.admin.dashboard.ordersTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t.admin.dashboard.ordersDescription}
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-900 dark:hover:bg-orange-950"
        >
          <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
            {t.admin.dashboard.categoriesBadge}
          </p>

          <h2 className="mt-3 text-xl font-black text-zinc-950 dark:text-white">
            {t.admin.dashboard.categoriesTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t.admin.dashboard.categoriesDescription}
          </p>
        </Link>
      </section>
    </main>
  );
}
