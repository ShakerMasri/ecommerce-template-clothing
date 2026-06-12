"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { storeConfig } from "~/config/store";

const navLinks = [
  { href: "/", key: "home" },
  { href: "/products", key: "products" },
  { href: "/cart", key: "cart" },
  { href: "/orders", key: "orders" },
  { href: "/account", key: "account" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { theme, language, t, toggleTheme, toggleLanguage } =
    useAppPreferences();

  const brand =
    language === "ar" ? storeConfig.locales.ar : storeConfig.locales.en;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line-soft)] bg-[var(--surface-page)]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group min-w-0 text-[var(--ink)]"
          aria-label={brand.name}
        >
          <span className="block truncate text-base font-bold uppercase tracking-[0.22em] sm:text-lg">
            {brand.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-[var(--line-soft)] bg-[var(--surface-card)]/80 p-1 text-sm font-medium shadow-sm md:flex">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-4 py-2 transition ${
                  isActive
                    ? "bg-[var(--ink)] text-[var(--surface-page)] shadow-sm"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {t.nav[link.key]}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="min-h-10 rounded-full border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
            aria-label="Toggle language"
          >
            {language === "en"
              ? t.actions.switchToArabic
              : t.actions.switchToEnglish}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-10 rounded-full border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? t.actions.lightMode : t.actions.darkMode}
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm font-semibold sm:px-6 md:hidden"
      >
        {navLinks.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`min-h-10 shrink-0 rounded-full border px-4 py-2 transition ${
                isActive
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface-page)]"
                  : "border-[var(--line-soft)] bg-[var(--surface-card)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              {t.nav[link.key]}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
