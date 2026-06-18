/**
 * Public, client-safe delivery configuration.
 *
 * This file is safe to import from Server Components, Client Components, route
 * handlers, and tests. Do not put secrets, private service URLs, credentials, or
 * deployment-only settings here.
 *
 * Keep delivery area keys stable after orders exist. Orders snapshot the selected
 * key and price at checkout, so changing labels is safe for new storefront copy,
 * but renaming/removing keys can make old order history harder to read.
 */
export type DeliveryConfigLocale = "en" | "ar";

export type DeliveryAreaLabels = {
  label: string;
  note?: string;
  agreementLabel?: string;
};

type DeliveryAreaConfig = {
  key: string;
  priceNis: number;
  requiresCustomerAgreement: boolean;
  labels: Record<DeliveryConfigLocale, DeliveryAreaLabels>;
};

type DeliveryConfigDefinition<TAreas extends readonly DeliveryAreaConfig[]> = {
  currency: {
    code: string;
    labels: Record<DeliveryConfigLocale, string>;
    freeLabels: Record<DeliveryConfigLocale, string>;
  };
  method: {
    labels: Record<DeliveryConfigLocale, string>;
  };
  estimatedDuration: {
    labels: Record<DeliveryConfigLocale, string>;
  };
  defaultAreaKey: TAreas[number]["key"];
  areas: TAreas;
};

function defineDeliveryConfig<
  const TAreas extends readonly DeliveryAreaConfig[],
>(config: DeliveryConfigDefinition<TAreas>) {
  return config;
}

export const deliveryConfig = defineDeliveryConfig({
  currency: {
    code: "NIS",
    labels: {
      en: "NIS",
      ar: "شيكل",
    },
    freeLabels: {
      en: "Free",
      ar: "مجاني",
    },
  },
  method: {
    labels: {
      en: "Third-party delivery company or another arrangement confirmed by the store",
      ar: "شركة توصيل خارجية أو ترتيب توصيل آخر يؤكده المتجر",
    },
  },
  estimatedDuration: {
    labels: {
      en: "Usually 1–2 days after order confirmation, unless the store tells you otherwise",
      ar: "عادة من يوم إلى يومين بعد تأكيد الطلب، إلا إذا أخبرك المتجر بغير ذلك",
    },
  },
  defaultAreaKey: "west_bank_cities",
  areas: [
    {
      key: "nablus_receive_point",
      priceNis: 0,
      requiresCustomerAgreement: true,
      labels: {
        en: {
          label: "Nablus receive point",
          note: "Free receive/pickup option in Nablus. The customer must agree or coordinate with the store owner on WhatsApp before receiving the order.",
          agreementLabel:
            "I understand this is a free receive/pickup option in Nablus and I must agree or coordinate with the store owner on WhatsApp before receiving the order.",
        },
        ar: {
          label: "نقطة استلام في نابلس",
          note: "خيار استلام مجاني في نابلس. يجب على الزبون الموافقة أو التنسيق مع صاحب المتجر عبر واتساب قبل استلام الطلب.",
          agreementLabel:
            "أفهم أن هذا خيار استلام مجاني في نابلس ويجب أن أوافق أو أنسق مع صاحب المتجر عبر واتساب قبل استلام الطلب.",
        },
      },
    },
    {
      key: "west_bank_cities",
      priceNis: 20,
      requiresCustomerAgreement: false,
      labels: {
        en: {
          label: "West Bank cities",
        },
        ar: {
          label: "مدن الضفة الغربية",
        },
      },
    },
    {
      key: "jerusalem",
      priceNis: 30,
      requiresCustomerAgreement: false,
      labels: {
        en: {
          label: "Jerusalem",
        },
        ar: {
          label: "القدس",
        },
      },
    },
    {
      key: "lands_48",
      priceNis: 70,
      requiresCustomerAgreement: false,
      labels: {
        en: {
          label: "48 lands",
        },
        ar: {
          label: "أراضي 48",
        },
      },
    },
    {
      key: "west_jerusalem_area",
      priceNis: 45,
      requiresCustomerAgreement: false,
      labels: {
        en: {
          label: "West Jerusalem, Ein Rafa, Ein Naqouba, Abu Ghosh",
        },
        ar: {
          label: "غرب القدس، عين رافا، عين نقوبا، أبو غوش",
        },
      },
    },
  ],
});

export type DeliveryConfig = typeof deliveryConfig;
export type DeliveryAreaKey = DeliveryConfig["areas"][number]["key"];
