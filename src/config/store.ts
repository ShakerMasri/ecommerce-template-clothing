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
    "A clothing storefront for browsing everyday pieces, choosing size and color, and ordering with cash on delivery.",
  metadata: {
    title: "Clothing Store Template",
    description:
      "Browse clothing, choose available size and color options, and order with cash on delivery.",
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
