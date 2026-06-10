"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { OptimizedImage } from "~/components/ui/OptimizedImage";
import { formatDeliveryPriceNis, type DeliveryAreaKey } from "~/lib/delivery";

type OrderItem = {
  id: string;
  quantity: number;
  priceAtPurchase: string;
  subtotalAmount: string;
  productNameAtPurchase: string;
  productSlugAtPurchase: string;
  productImagesAtPurchase: string[];
};

type Order = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: string;
  deliveryAreaKey: DeliveryAreaKey | null;
  deliveryPrice: string;
  deliveryCity: string | null;
  deliveryAddress: string | null;
  deliveryNotes: string | null;
  pickupAgreementAccepted: boolean;
  createdAt: string;
  items: OrderItem[];
};

type OrdersResponse = {
  orders?: Order[];
  message?: string;
};

const statusStyles: Record<string, string> = {
  PENDING:
    "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  PROCESSING: "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  SHIPPED:
    "bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  DELIVERED: "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
  CANCELLED: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
};

const paymentStatusStyles: Record<string, string> = {
  UNPAID:
    "bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  PAID: "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
};

function formatPrice(price: string | number, currency: string) {
  return `${Number(price).toFixed(2)} ${currency}`;
}

function formatDate(date: string, language: "en" | "ar") {
  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatFallbackLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function OrdersClient() {
  const { t, language } = useAppPreferences();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isAuthRequired, setIsAuthRequired] = useState(false);

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, order) => {
      if (order.status === "CANCELLED") {
        return sum;
      }

      return sum + Number(order.totalAmount);
    }, 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((order) => {
      return order.status !== "DELIVERED" && order.status !== "CANCELLED";
    }).length;
  }, [orders]);

  function getStatusLabel(status: string) {
    return t.orders.statuses[status] ?? formatFallbackLabel(status);
  }

  function getPaymentMethodLabel(paymentMethod: string) {
    return (
      t.orders.paymentMethods[paymentMethod] ??
      formatFallbackLabel(paymentMethod)
    );
  }

  function getPaymentStatusLabel(paymentStatus: string) {
    return (
      t.orders.paymentStatuses[paymentStatus] ??
      formatFallbackLabel(paymentStatus)
    );
  }

  function getDeliveryAreaLabel(deliveryAreaKey: DeliveryAreaKey | null) {
    if (!deliveryAreaKey) {
      return t.orders.notProvided;
    }

    return (
      t.delivery.areas[deliveryAreaKey]?.label ??
      formatFallbackLabel(deliveryAreaKey)
    );
  }

  async function loadOrders() {
    setIsLoading(true);
    setMessage("");
    setIsAuthRequired(false);

    try {
      const response = await fetch("/api/orders");
      const data = (await response.json()) as OrdersResponse;

      if (!response.ok) {
        setOrders([]);

        if (response.status === 401) {
          setIsAuthRequired(true);
        }

        setMessage(data.message ?? t.orders.failedToLoad);
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setOrders([]);
      setMessage(t.orders.failedToConnect);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
    // We intentionally load once on mount. Language changes only affect labels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-8 w-44 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </section>
    );
  }

  if (message && orders.length === 0) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-black text-zinc-950 dark:text-white">
          {t.orders.ordersUnavailable}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {message}
        </p>

        {isAuthRequired ? (
          <Link
            href="/login?callbackUrl=/orders"
            className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Log in
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="mt-6 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {t.orders.tryAgain}
          </button>
        )}
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl dark:bg-orange-950">
          📦
        </div>

        <h1 className="mt-5 text-2xl font-black text-zinc-950 dark:text-white">
          {t.orders.noOrdersTitle}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {t.orders.noOrdersDescription}
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {t.orders.browseProducts}
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
          {t.orders.badge}
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
              {t.orders.title}
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t.orders.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            className="w-fit rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-950"
          >
            {t.orders.refresh}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t.orders.totalOrders}
          </p>
          <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
            {orders.length}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t.orders.activeOrders}
          </p>
          <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
            {activeOrdersCount}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t.orders.totalSpent}
          </p>
          <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
            {formatPrice(totalSpent, t.delivery.currency)}
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const statusClass =
            statusStyles[order.status] ??
            "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";

          const paymentStatusClass =
            paymentStatusStyles[order.paymentStatus] ??
            "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";

          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="border-b border-zinc-200 p-5 sm:p-6 dark:border-zinc-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                      {t.orders.order}
                    </p>

                    <h2 className="mt-1 max-w-full truncate font-mono text-sm font-bold text-zinc-950 dark:text-white">
                      {order.id}
                    </h2>

                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {t.orders.placed} {formatDate(order.createdAt, language)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${paymentStatusClass}`}
                    >
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {t.orders.total}
                    </p>
                    <p className="mt-1 font-black text-zinc-950 dark:text-white">
                      {formatPrice(order.totalAmount, t.delivery.currency)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {t.orders.deliveryPrice}
                    </p>
                    <p className="mt-1 font-semibold text-zinc-950 dark:text-white">
                      {formatDeliveryPriceNis(Number(order.deliveryPrice), {
                        free: t.delivery.free,
                        currency: t.delivery.currency,
                      })}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {t.orders.payment}
                    </p>
                    <p className="mt-1 font-semibold text-zinc-950 dark:text-white">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {t.orders.items}
                    </p>
                    <p className="mt-1 font-semibold text-zinc-950 dark:text-white">
                      {order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="font-bold text-zinc-950 dark:text-white">
                    {t.orders.deliveryDetails}
                  </h3>

                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        {t.orders.deliveryArea}
                      </dt>
                      <dd className="mt-1 font-semibold text-zinc-950 dark:text-white">
                        {getDeliveryAreaLabel(order.deliveryAreaKey)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        {t.orders.deliveryCity}
                      </dt>
                      <dd className="mt-1 font-semibold text-zinc-950 dark:text-white">
                        {order.deliveryCity ?? t.orders.notProvided}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        {t.orders.deliveryAddress}
                      </dt>
                      <dd className="mt-1 font-semibold text-zinc-950 dark:text-white">
                        {order.deliveryAddress ?? t.orders.notProvided}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        {t.orders.pickupAgreement}
                      </dt>
                      <dd className="mt-1 font-semibold text-zinc-950 dark:text-white">
                        {order.deliveryAreaKey === "nablus_receive_point"
                          ? order.pickupAgreementAccepted
                            ? t.orders.yes
                            : t.orders.notProvided
                          : t.orders.notRequired}
                      </dd>
                    </div>

                    {order.deliveryNotes ? (
                      <div className="sm:col-span-2">
                        <dt className="text-zinc-500 dark:text-zinc-400">
                          {t.orders.deliveryNotes}
                        </dt>
                        <dd className="mt-1 font-semibold whitespace-pre-wrap text-zinc-950 dark:text-white">
                          {order.deliveryNotes}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {order.items.map((item) => {
                  const image = item.productImagesAtPurchase.at(0);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
                    >
                      <Link
                        href={`/products/${item.productSlugAtPurchase}`}
                        className="relative h-24 w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:w-24 dark:bg-zinc-800"
                      >
                        {image ? (
                          <OptimizedImage
                            src={image}
                            alt={item.productNameAtPurchase}
                            sizes="96px"
                            className="object-cover transition hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                            {t.orders.noImage}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.productSlugAtPurchase}`}
                          className="font-bold text-zinc-950 transition hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
                        >
                          {item.productNameAtPurchase}
                        </Link>

                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {t.orders.quantity}: {item.quantity} ×{" "}
                          {formatPrice(
                            item.priceAtPurchase,
                            t.delivery.currency,
                          )}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {t.orders.subtotal}
                        </p>
                        <p className="font-black text-zinc-950 dark:text-white">
                          {formatPrice(
                            item.subtotalAmount,
                            t.delivery.currency,
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
