import { contactConfig } from "~/config/contact";

/**
 * Public, client-safe store configuration.
 *
 * This file is safe to import from Server Components, Client Components, and tests.
 * Do not put secrets, tokens, credentials, private URLs, or internal service keys here.
 * Sensitive deployment settings must stay in environment variables validated by src/env.js.
 */
export const storeConfig = {
  name: "Clothing Store Template",
  shortName: "Clothing Store",
  description:
    "A reusable clothing ecommerce storefront for everyday pieces, size and color options, and cash-on-delivery ordering.",
  metadata: {
    title: "Clothing Store Template",
    description:
      "A premium, simple clothing storefront for browsing everyday pieces and placing cash-on-delivery orders.",
  },
  contact: contactConfig,
  locales: {
    en: {
      name: "Clothing Store",
      logoStart: "Clothing",
      logoAccent: "Store",
    },
    ar: {
      name: "متجر ملابس",
      logoStart: "متجر",
      logoAccent: "ملابس",
    },
  },
} as const;

export type StoreConfig = typeof storeConfig;
