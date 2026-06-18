/**
 * Public, client-safe legal/business configuration for Palestinian storefronts.
 *
 * Keep client-specific values null until the client supplies verified details.
 * Never publish guessed, example, placeholder, or all-zero registration values.
 * Do not put secrets, private agreements, identity documents, certificates,
 * credentials, or unpublished business information here.
 */

export type LegalBusinessLocale = "en" | "ar";

type LocalizedOptionalValue = Readonly<
  Record<LegalBusinessLocale, string | null>
>;

export type PublicLegalBusinessConfig = {
  identity: {
    registeredStoreName: LocalizedOptionalValue;
    providerLegalName: LocalizedOptionalValue;
    physicalAddress: LocalizedOptionalValue;
  };
  registrations: {
    commercialNumber: string | null;
    ecommerceNumber: string | null;
  };
  canonicalDomain: `https://${string}` | null;
  taxDisclosure: LocalizedOptionalValue;
  labels: Record<
    LegalBusinessLocale,
    {
      sectionTitle: string;
      registeredStoreName: string;
      providerLegalName: string;
      physicalAddress: string;
      commercialNumber: string;
      ecommerceNumber: string;
      canonicalDomain: string;
      taxDisclosure: string;
    }
  >;
};

export const legalBusinessConfig = {
  identity: {
    registeredStoreName: { en: null, ar: null },
    providerLegalName: { en: null, ar: null },
    physicalAddress: { en: null, ar: null },
  },
  registrations: {
    commercialNumber: null,
    ecommerceNumber: null,
  },
  canonicalDomain: null,
  taxDisclosure: { en: null, ar: null },
  labels: {
    en: {
      sectionTitle: "Legal business information",
      registeredStoreName: "Registered store name",
      providerLegalName: "Legal provider name",
      physicalAddress: "Physical address",
      commercialNumber: "Commercial registration number",
      ecommerceNumber: "Ecommerce registration number",
      canonicalDomain: "Registered website",
      taxDisclosure: "Tax information",
    },
    ar: {
      sectionTitle: "بيانات المتجر القانونية",
      registeredStoreName: "اسم المتجر المسجل",
      providerLegalName: "الاسم القانوني للمزوّد",
      physicalAddress: "العنوان الفعلي",
      commercialNumber: "رقم التسجيل التجاري",
      ecommerceNumber: "رقم تسجيل التجارة الإلكترونية",
      canonicalDomain: "الموقع الإلكتروني المسجل",
      taxDisclosure: "معلومات الضرائب",
    },
  },
} as const satisfies PublicLegalBusinessConfig;

const placeholderPatterns = [
  /\bexample\b/i,
  /\bplaceholder\b/i,
  /\breplace(?:\s+me)?\b/i,
  /\btodo\b/i,
  /\btbd\b/i,
  /\bdemo\b/i,
  /\btest\b/i,
  /\byour\s+(?:store|business|company|name|address|number)\b/i,
  /مثال|تجريبي|ضع.*هنا|اسم المتجر/i,
  /^[-_\s]+$/,
  /^0+$/,
] as const;

export function isPublishableLegalBusinessValue(
  value: string | null | undefined,
): value is string {
  if (!value) return false;

  const normalizedValue = value.trim();
  if (!normalizedValue) return false;

  return !placeholderPatterns.some((pattern) => pattern.test(normalizedValue));
}

export function isPublishablePalestinianDomain(
  value: `https://${string}` | null | undefined,
): value is `https://${string}` {
  if (!isPublishableLegalBusinessValue(value)) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && url.hostname.toLowerCase().endsWith(".ps")
    );
  } catch {
    return false;
  }
}

function getLocalizedValue(
  values: LocalizedOptionalValue,
  locale: LegalBusinessLocale,
): string | null {
  const preferredValue = values[locale];
  if (isPublishableLegalBusinessValue(preferredValue)) {
    return preferredValue.trim();
  }

  const fallbackValue = values[locale === "ar" ? "en" : "ar"];
  return isPublishableLegalBusinessValue(fallbackValue)
    ? fallbackValue.trim()
    : null;
}

export type LegalBusinessDetail = {
  key:
    | "registeredStoreName"
    | "providerLegalName"
    | "physicalAddress"
    | "commercialNumber"
    | "ecommerceNumber"
    | "canonicalDomain"
    | "taxDisclosure";
  label: string;
  value: string;
  href?: `https://${string}`;
};

export type PublicLegalBusinessProfile = {
  sectionTitle: string;
  details: readonly LegalBusinessDetail[];
};

export function getPublicTaxDisclosure(
  locale: LegalBusinessLocale,
  config: PublicLegalBusinessConfig = legalBusinessConfig,
): string | null {
  return getLocalizedValue(config.taxDisclosure, locale);
}

export function getPublicLegalBusinessProfile(
  locale: LegalBusinessLocale,
  config: PublicLegalBusinessConfig = legalBusinessConfig,
): PublicLegalBusinessProfile | null {
  const registeredStoreName = getLocalizedValue(
    config.identity.registeredStoreName,
    locale,
  );
  const providerLegalName = getLocalizedValue(
    config.identity.providerLegalName,
    locale,
  );
  const physicalAddress = getLocalizedValue(
    config.identity.physicalAddress,
    locale,
  );
  const { commercialNumber, ecommerceNumber } = config.registrations;
  const { canonicalDomain } = config;

  if (
    registeredStoreName === null ||
    providerLegalName === null ||
    physicalAddress === null ||
    !isPublishableLegalBusinessValue(commercialNumber) ||
    !isPublishableLegalBusinessValue(ecommerceNumber) ||
    !isPublishablePalestinianDomain(canonicalDomain)
  ) {
    return null;
  }

  const labels = config.labels[locale];
  const details: LegalBusinessDetail[] = [
    {
      key: "registeredStoreName",
      label: labels.registeredStoreName,
      value: registeredStoreName,
    },
    {
      key: "providerLegalName",
      label: labels.providerLegalName,
      value: providerLegalName,
    },
    {
      key: "commercialNumber",
      label: labels.commercialNumber,
      value: commercialNumber.trim(),
    },
    {
      key: "ecommerceNumber",
      label: labels.ecommerceNumber,
      value: ecommerceNumber.trim(),
    },
    {
      key: "physicalAddress",
      label: labels.physicalAddress,
      value: physicalAddress,
    },
    {
      key: "canonicalDomain",
      label: labels.canonicalDomain,
      value: canonicalDomain,
      href: canonicalDomain,
    },
  ];

  const taxDisclosure = getPublicTaxDisclosure(locale, config);
  if (taxDisclosure) {
    details.push({
      key: "taxDisclosure",
      label: labels.taxDisclosure,
      value: taxDisclosure,
    });
  }

  return { sectionTitle: labels.sectionTitle, details };
}
