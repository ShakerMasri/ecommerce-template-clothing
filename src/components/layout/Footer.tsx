"use client";

import Link from "next/link";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { contactConfig } from "~/config/contact";

export function Footer() {
  const { t } = useAppPreferences();

  const legalLinks = [
    { href: "/terms", label: t.legal.common.footerLinks.terms },
    { href: "/privacy", label: t.legal.common.footerLinks.privacy },
    { href: "/shipping", label: t.legal.common.footerLinks.shipping },
    { href: "/returns", label: t.legal.common.footerLinks.returns },
    { href: "/contact", label: t.legal.common.footerLinks.contact },
  ];

  const contactLinks = [
    {
      href: contactConfig.whatsapp.href,
      label: t.footer.whatsapp,
      value: contactConfig.whatsapp.display,
      external: true,
    },
    {
      href: contactConfig.phone.href,
      label: t.footer.phone,
      value: contactConfig.phone.display,
      external: false,
    },
    {
      href: contactConfig.email.href,
      label: t.footer.email,
      value: contactConfig.email.address,
      external: false,
    },
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="space-y-3">
            <p>
              © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
            </p>

            <p className="max-w-md">{t.footer.description}</p>
          </div>

          {contactConfig.footer.showContactSummary ? (
            <div className="space-y-2 sm:text-end">
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                {t.footer.contactTitle}
              </p>

              <ul className="space-y-1">
                {contactLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="transition hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      {link.label}: {link.value}
                    </a>
                  </li>
                ))}
              </ul>

              {contactConfig.socialLinks.length > 0 ? (
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {t.footer.socialLinks}
                  </p>

                  <ul className="space-y-1">
                    {contactConfig.socialLinks.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="transition hover:text-orange-600 dark:hover:text-orange-400"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <nav
          aria-label="Legal links"
          className="flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-200 pt-5 dark:border-zinc-800"
        >
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-semibold text-zinc-700 transition hover:text-orange-600 dark:text-zinc-300 dark:hover:text-orange-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
