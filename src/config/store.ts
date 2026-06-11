import { contactConfig } from "~/config/contact";

/**
 * Public, client-safe store configuration.
 *
 * This file is safe to import from Server Components, Client Components, and tests.
 * Do not put secrets, tokens, credentials, private URLs, or internal service keys here.
 * Sensitive deployment settings must stay in environment variables validated by src/env.js.
 */
export const storeConfig = {
  name: "Everyday Wear Template",
  shortName: "Everyday Wear",
  description:
    "A reusable clothing ecommerce storefront template for browsing clothing items and placing orders.",
  metadata: {
    title: "Everyday Wear Template",
    description:
      "A clothing ecommerce storefront for browsing clothing items and placing orders.",
  },
  contact: contactConfig,
  locales: {
    en: {
      name: "Everyday Wear Template",
      logoStart: "Everyday",
      logoAccent: "Wear",
    },
    ar: {
      name: "قالب ملابس يومية",
      logoStart: "ملابس",
      logoAccent: " يومية",
    },
  },
} as const;

export type StoreConfig = typeof storeConfig;
