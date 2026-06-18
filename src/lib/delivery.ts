import {
  deliveryConfig,
  type DeliveryAreaKey,
  type DeliveryAreaLabels,
  type DeliveryConfigLocale,
} from "~/config/delivery";

export { deliveryConfig, type DeliveryAreaKey };

export const DELIVERY_CURRENCY = deliveryConfig.currency.code;
export const DEFAULT_DELIVERY_AREA_KEY = deliveryConfig.defaultAreaKey;

export type DeliveryArea = {
  key: DeliveryAreaKey;
  priceNis: number;
  requiresCustomerAgreement: boolean;
};

export const DELIVERY_AREAS = deliveryConfig.areas.map(
  ({ key, priceNis, requiresCustomerAgreement }) => ({
    key,
    priceNis,
    requiresCustomerAgreement,
  }),
) satisfies DeliveryArea[];

export const DELIVERY_AREA_KEYS = DELIVERY_AREAS.map((area) => area.key);

export function isDeliveryAreaKey(value: string): value is DeliveryAreaKey {
  return DELIVERY_AREA_KEYS.some((key) => key === value);
}

export function getDeliveryAreaByKey(key: string): DeliveryArea | null {
  return DELIVERY_AREAS.find((area) => area.key === key) ?? null;
}

export function getDefaultDeliveryArea(): DeliveryArea {
  const defaultArea = getDeliveryAreaByKey(DEFAULT_DELIVERY_AREA_KEY);

  if (!defaultArea) {
    throw new Error("DEFAULT_DELIVERY_AREA_NOT_CONFIGURED");
  }

  return defaultArea;
}

export function getDeliveryPriceNis(key: string): number | null {
  return getDeliveryAreaByKey(key)?.priceNis ?? null;
}

export function getDeliveryAreaLabels(
  locale: DeliveryConfigLocale,
): Record<DeliveryAreaKey, DeliveryAreaLabels> {
  return deliveryConfig.areas.reduce(
    (labels, area) => ({
      ...labels,
      [area.key]: area.labels[locale],
    }),
    {} as Record<DeliveryAreaKey, DeliveryAreaLabels>,
  );
}

export function getDeliveryCurrencyLabel(locale: DeliveryConfigLocale): string {
  return deliveryConfig.currency.labels[locale];
}

export function getFreeDeliveryLabel(locale: DeliveryConfigLocale): string {
  return deliveryConfig.currency.freeLabels[locale];
}

export function getDeliveryMethodLabel(locale: DeliveryConfigLocale): string {
  return deliveryConfig.method.labels[locale];
}

export function getEstimatedDeliveryDuration(
  locale: DeliveryConfigLocale,
): string {
  return deliveryConfig.estimatedDuration.labels[locale];
}

export function formatDeliveryPriceNis(
  priceNis: number,
  labels: { free: string; currency: string },
): string {
  if (priceNis === 0) {
    return labels.free;
  }

  return `${priceNis} ${labels.currency}`;
}
