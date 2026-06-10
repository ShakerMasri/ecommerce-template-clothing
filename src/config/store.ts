import { contactConfig } from "~/config/contact";

/**
 * Public, client-safe store configuration.
 *
 * This file is safe to import from Server Components, Client Components, and tests.
 * Do not put secrets, tokens, credentials, private URLs, or internal service keys here.
 * Sensitive deployment settings must stay in environment variables validated by src/env.js.
 */
export const storeConfig = {
  name: "Store Template",
  shortName: "Store",
  description:
    "A reusable ecommerce storefront template for browsing products and placing orders.",
  metadata: {
    title: "Store Template",
    description:
      "A simple ecommerce store for browsing products and placing orders.",
  },
  contact: contactConfig,
  locales: {
    en: {
      name: "Store Template",
      logoStart: "Store",
      logoAccent: "Template",
    },
    ar: {
      name: "قالب المتجر",
      logoStart: "قالب",
      logoAccent: " المتجر",
    },
  },
} as const;

export type StoreConfig = typeof storeConfig;
