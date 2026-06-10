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
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-black tracking-tight">
          <span>{brand.logoStart}</span>
          <span className="text-orange-600">{brand.logoAccent}</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-700 md:flex dark:text-zinc-300">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-orange-600 dark:hover:text-orange-400 ${
                  isActive
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t.nav[link.key]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            aria-label="Toggle language"
          >
            {language === "en"
              ? t.actions.switchToArabic
              : t.actions.switchToEnglish}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? t.actions.lightMode : t.actions.darkMode}
          </button>
        </div>
      </div>

      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 text-sm font-medium text-zinc-700 md:hidden dark:text-zinc-300">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full border px-3 py-1.5 ${
                isActive
                  ? "border-orange-600 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300"
                  : "border-zinc-200 dark:border-zinc-800"
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
