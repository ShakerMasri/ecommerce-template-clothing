import {
  getPublicLegalBusinessProfile,
  type LegalBusinessLocale,
} from "~/config/legal-business";

type LegalBusinessDetailsProps = {
  locale: LegalBusinessLocale;
  variant?: "footer" | "page";
};

export function LegalBusinessDetails({
  locale,
  variant = "page",
}: LegalBusinessDetailsProps) {
  const profile = getPublicLegalBusinessProfile(locale);

  if (!profile) {
    return null;
  }

  const isFooter = variant === "footer";

  return (
    <section
      aria-label={profile.sectionTitle}
      className={
        isFooter
          ? "border-t border-[var(--footer-line)] pt-6 lg:col-span-2"
          : "rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
      }
    >
      <h2
        className={
          isFooter
            ? "text-xs font-semibold tracking-[0.24em] text-[var(--footer-accent)] uppercase"
            : "text-xl font-bold text-[var(--ink)]"
        }
      >
        {profile.sectionTitle}
      </h2>

      <dl
        className={
          isFooter
            ? "mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2"
            : "mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2"
        }
      >
        {profile.details.map((detail) => (
          <div key={detail.key} className="min-w-0">
            <dt
              className={
                isFooter
                  ? "font-semibold text-[var(--footer-ink)]"
                  : "font-semibold text-[var(--ink)]"
              }
            >
              {detail.label}
            </dt>
            <dd
              className={
                isFooter
                  ? "mt-1 break-words text-[var(--footer-muted)]"
                  : "mt-1 break-words text-[var(--muted)]"
              }
            >
              {detail.href ? (
                <a
                  href={detail.href}
                  target="_blank"
                  rel="noreferrer"
                  className={
                    isFooter
                      ? "underline-offset-4 hover:text-[var(--footer-ink)] hover:underline"
                      : "text-[var(--accent-strong)] underline-offset-4 hover:underline"
                  }
                >
                  {detail.value}
                </a>
              ) : (
                detail.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
