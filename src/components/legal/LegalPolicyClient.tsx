"use client";

import Link from "next/link";
import { LegalPage } from "~/components/legal/LegalPage";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import type { LegalPageKey } from "~/lib/translations";

type LegalPolicyClientProps = {
  pageKey: LegalPageKey;
};

export function LegalPolicyClient({ pageKey }: LegalPolicyClientProps) {
  const { t } = useAppPreferences();
  const page = t.legal.pages[pageKey];

  return (
    <LegalPage
      badge={t.legal.common.policyBadge}
      title={page.title}
      description={page.description}
      lastUpdatedLabel={t.legal.common.lastUpdatedLabel}
      lastUpdatedDate={t.legal.common.lastUpdatedDate}
    >
      {page.sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xl font-black text-zinc-950 dark:text-white">
            {section.title}
          </h2>

          <div className="mt-3 space-y-3">
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            {section.items ? (
              <ul className="list-disc space-y-2 ps-6">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}

            {section.links ? (
              <div className="flex flex-wrap gap-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ))}

      {pageKey === "contact" ? (
        <section>
          <h2 className="text-xl font-black text-zinc-950 dark:text-white">
            {t.legal.common.usefulLinks}
          </h2>

          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
              href="/terms"
            >
              {t.legal.common.footerLinks.terms}
            </Link>
            <Link
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
              href="/privacy"
            >
              {t.legal.common.footerLinks.privacy}
            </Link>
            <Link
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
              href="/shipping"
            >
              {t.legal.common.footerLinks.shipping}
            </Link>
            <Link
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
              href="/returns"
            >
              {t.legal.common.footerLinks.returns}
            </Link>
          </div>
        </section>
      ) : null}
    </LegalPage>
  );
}
