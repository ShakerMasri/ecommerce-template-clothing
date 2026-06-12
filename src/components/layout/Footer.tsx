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
    <footer className="mt-16 border-t border-[var(--footer-line)] bg-[var(--footer-surface)] text-[var(--footer-ink)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <p className="text-lg font-bold uppercase tracking-[0.22em] text-[var(--footer-ink)]">
            {t.brand.name}
          </p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--footer-muted)]">
            © {new Date().getFullYear()} {t.footer.rights} {t.footer.description}
          </p>
        </div>

        {contactConfig.footer.showContactSummary ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:text-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--footer-accent)]">
                {t.footer.contactTitle}
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                {contactLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="text-[var(--footer-muted)] transition hover:text-[var(--footer-ink)]"
                    >
                      {link.label}: {link.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {contactConfig.socialLinks.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--footer-accent)]">
                  {t.footer.socialLinks}
                </p>

                <ul className="mt-4 space-y-2 text-sm">
                  {contactConfig.socialLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--footer-muted)] transition hover:text-[var(--footer-ink)]"
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

      <div className="border-t border-[var(--footer-line)]">
        <nav
          aria-label="Legal links"
          className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-3 px-4 py-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--footer-muted)] sm:px-6 lg:px-8"
        >
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[var(--footer-ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
