/**
 * Public, client-safe contact and support configuration.
 *
 * This file is safe to import from Server Components, Client Components, and tests.
 * Keep only public storefront contact details here. Do not put SMTP credentials,
 * inbox passwords, API tokens, private webhook URLs, or internal admin contacts here.
 */

type PublicContactLinkHref =
  | `mailto:${string}`
  | `tel:${string}`
  | `https://${string}`;

type PublicContactLink = {
  label: string;
  href: PublicContactLinkHref;
};

type LocalizedText = {
  en: string;
  ar: string;
};

type PublicContactConfig = {
  email: {
    address: string;
    href: `mailto:${string}`;
  };
  phone: {
    display: string;
    href: `tel:${string}`;
  };
  whatsapp: {
    display: string;
    href: `https://wa.me/${string}`;
  };
  supportHours: LocalizedText;
  contactPage: {
    description: LocalizedText;
  };
  footer: {
    showContactSummary: boolean;
  };
  socialLinks: readonly PublicContactLink[];
};

const socialLinks: readonly PublicContactLink[] = [];

export const contactConfig = {
  email: {
    address: "support@example.com",
    href: "mailto:support@example.com",
  },
  phone: {
    display: "Replace with client phone",
    href: "tel:+970000000000",
  },
  whatsapp: {
    display: "Replace with client WhatsApp",
    href: "https://wa.me/970000000000",
  },
  supportHours: {
    en: "Support requests are handled as soon as reasonably possible during normal working days.",
    ar: "يتم التعامل مع طلبات الدعم في أقرب وقت ممكن خلال أيام العمل العادية.",
  },
  contactPage: {
    description: {
      en: "Contact the store about orders, support, returns, or general questions.",
      ar: "تواصل مع المتجر بخصوص الطلبات، الدعم، الإرجاع، أو الاستفسارات العامة.",
    },
  },
  footer: {
    showContactSummary: true,
  },
  socialLinks,
} as const satisfies PublicContactConfig;

export type ContactConfig = typeof contactConfig;
export type ContactSocialLink = ContactConfig["socialLinks"][number];
