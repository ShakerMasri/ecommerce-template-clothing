/**
 * Public, client-safe contact and support configuration.
 *
 * This file is safe to import from Server Components, Client Components, and tests.
 * Keep only public storefront contact details here. Do not put SMTP credentials,
 * inbox passwords, API tokens, private webhook URLs, or internal admin contacts here.
 */

export type ContactSocialIconName =
  | "instagram"
  | "whatsapp"
  | "facebook"
  | "location";

type PublicSocialLink = {
  label: string;
  href: `https://${string}`;
  icon: ContactSocialIconName;
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
    onlineStoreCta: {
      enabled: boolean;
      whatsapp: {
        display: string;
        href: `https://wa.me/${string}`;
      };
    };
  };
  whatsappShortcut: {
    enabled: boolean;
  };
  socialLinks: readonly PublicSocialLink[];
};

const socialLinks: readonly PublicSocialLink[] = [
  // Replace these placeholders with the client-owned public profile links before launch.
  // Remove any platform the client does not actually use.
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: "instagram",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/970000000000",
    icon: "whatsapp",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: "facebook",
  },
  {
    label: "Location",
    href: "https://www.google.com/maps",
    icon: "location",
  },
];

export const contactConfig = {
  email: {
    address: "support@example.com",
    href: "mailto:support@example.com",
  },
  phone: {
    display: "+970000000000",
    href: "tel:+970000000000",
  },
  whatsapp: {
    display: "+970000000000",
    href: "https://wa.me/970000000000",
  },
  supportHours: {
    en: "We reply to support questions as soon as possible during normal working days.",
    ar: "بنرد على استفساراتكم بأقرب وقت خلال أيام الدوام.",
  },
  contactPage: {
    description: {
      en: "Contact us with questions about products, orders, delivery, exchanges, or returns.",
      ar: "عندك سؤال عن قطعة، طلب، توصيل، استبدال أو إرجاع؟ تواصل معنا.",
    },
  },
  footer: {
    showContactSummary: true,
    onlineStoreCta: {
      enabled: false,
      whatsapp: {
        display: "+970599355107",
        href: "https://wa.me/970599355107",
      },
    },
  },
  whatsappShortcut: {
    enabled: true,
  },
  socialLinks,
} as const satisfies PublicContactConfig;

export type ContactConfig = typeof contactConfig;
export type ContactSocialLink = ContactConfig["socialLinks"][number];
