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
    "A reusable clothing ecommerce storefront template for browsing products and placing orders.",
  metadata: {
    title: "Clothing Store Template",
    description:
      "A clothing ecommerce store for browsing products and placing orders.",
  },
  contact: contactConfig,
  locales: {
    en: {
      name: "Clothing Store Template",
      logoStart: "Clothing",
      logoAccent: "Store",
    },
    ar: {
      name: "قالب متجر ملابس",
      logoStart: "متجر",
      logoAccent: " ملابس",
    },
  },
} as const;

export type StoreConfig = typeof storeConfig;
