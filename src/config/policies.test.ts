import { describe, expect, it } from "vitest";
import { policyConfig, type PolicyLocale } from "~/config/policies";

const locales: readonly PolicyLocale[] = ["en", "ar"];

function flattenPolicySections(locale: PolicyLocale, page: "contact" | "returns") {
  return policyConfig.locales[locale].pages[page].sections
    .flatMap((section) => [
      section.title,
      ...(section.paragraphs ?? []),
      ...(section.items ?? []),
    ])
    .join(" ")
    .toLowerCase();
}

describe("public policy compliance coverage", () => {
  it.each(locales)(
    "includes complaint reception and follow-up guidance for %s",
    (locale) => {
      const contactCopy = flattenPolicySections(locale, "contact");

      expect(contactCopy).toContain(
        locale === "ar" ? "تقديم الشكوى" : "submit a complaint",
      );
      expect(contactCopy).toContain(
        locale === "ar" ? "متابعة الشكوى" : "complaint follow-up",
      );
    },
  );

  it.each(locales)(
    "includes warranty, maintenance, and support guidance for %s",
    (locale) => {
      const returnsCopy = flattenPolicySections(locale, "returns");

      expect(returnsCopy).toContain(locale === "ar" ? "الضمان" : "warranty");
      expect(returnsCopy).toContain(
        locale === "ar" ? "الصيانة" : "maintenance",
      );
      expect(returnsCopy).toContain(locale === "ar" ? "الدعم" : "support");
    },
  );
});
