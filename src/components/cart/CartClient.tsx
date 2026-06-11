"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OptimizedImage } from "~/components/ui/OptimizedImage";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import {
  DEFAULT_DELIVERY_AREA_KEY,
  DELIVERY_AREAS,
  formatDeliveryPriceNis,
  getDeliveryAreaByKey,
  type DeliveryAreaKey,
} from "~/lib/delivery";

type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: string;
  discountPrice: string | null;
  stock: number;
  images: string[];
  isArchived: boolean;
  hasVariants: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

type CartVariant = {
  id: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  stock: number;
  isActive: boolean;
};

type CartItem = {
  id: string;
  quantity: number;
  productVariantId: string | null;
  productVariant: CartVariant | null;
  availableStock: number;
  product: CartProduct;
};

type CartCustomer = {
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
};

type CartResponse = {
  cartItems?: CartItem[];
  customer?: CartCustomer;
  message?: string;
};

type OrderItem = {
  id: string;
  quantity: number;
  priceAtPurchase: string;
  subtotalAmount: string;
  productNameAtPurchase: string;
  productSlugAtPurchase: string;
  productImagesAtPurchase: string[];
  productVariantId: string | null;
  selectedSizeLabel: string | null;
  selectedColorLabel: string | null;
};

type Order = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: string;
  deliveryAreaKey: DeliveryAreaKey;
  deliveryPrice: string;
  deliveryCity: string;
  deliveryAddress: string | null;
  deliveryNotes: string | null;
  pickupAgreementAccepted: boolean;
  createdAt: string;
  items: OrderItem[];
};

type CheckoutResponse = {
  message?: string;
  order?: Order;
};

type DeliveryFormState = {
  deliveryAreaKey: DeliveryAreaKey;
  deliveryCity: string;
  deliveryAddress: string;
  deliveryNotes: string;
  pickupAgreementAccepted: boolean;
};

const defaultDeliveryForm: DeliveryFormState = {
  deliveryAreaKey: DEFAULT_DELIVERY_AREA_KEY,
  deliveryCity: "",
  deliveryAddress: "",
  deliveryNotes: "",
  pickupAgreementAccepted: false,
};

function formatPrice(price: number, currency: string) {
  return `${price.toFixed(2)} ${currency}`;
}

function getEffectiveCartPrice(product: CartProduct) {
  return Number(product.discountPrice ?? product.price);
}

function hasCartDiscount(product: CartProduct) {
  return product.discountPrice !== null;
}

function formatVariantLabel(variant: CartVariant | null) {
  if (!variant) {
    return null;
  }

  const label = [variant.sizeLabel, variant.colorLabel].filter(Boolean).join(" / ");

  return label || null;
}

export function CartClient() {
  const { t } = useAppPreferences();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CartCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [deliveryForm, setDeliveryForm] =
    useState<DeliveryFormState>(defaultDeliveryForm);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const checkoutKeyRef = useRef<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const selectedDeliveryArea =
    getDeliveryAreaByKey(deliveryForm.deliveryAreaKey) ?? DELIVERY_AREAS[0]!;
  const selectedDeliveryTranslation =
    t.delivery.areas[selectedDeliveryArea.key];
  const selectedDeliveryPrice = selectedDeliveryArea.priceNis;

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + getEffectiveCartPrice(item.product) * item.quantity;
    }, 0);
  }, [cartItems]);

  const finalTotal = total + selectedDeliveryPrice;

  const itemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const hasUnavailableItems = cartItems.some((item) => {
    return (
      item.product.isArchived ||
      item.availableStock <= 0 ||
      item.quantity > item.availableStock
    );
  });

  const loadCart = useCallback(
    async function loadCart() {
      setIsLoading(true);
      setMessage("");
      setIsAuthRequired(false);

      try {
        const response = await fetch("/api/cart");
        const data = (await response.json()) as CartResponse;

        if (!response.ok) {
          setCartItems([]);
          setCustomer(null);

          if (response.status === 401) {
            setIsAuthRequired(true);
          }

          setMessage(data.message ?? t.cart.failedToLoad);
          return;
        }

        setCartItems(data.cartItems ?? []);
        setCustomer(data.customer ?? null);
      } catch {
        setCartItems([]);
        setCustomer(null);
        setMessage(t.cart.failedToConnect);
      } finally {
        setIsLoading(false);
      }
    },
    [t.cart.failedToConnect, t.cart.failedToLoad],
  );

  async function updateQuantity(cartItemId: string, quantity: number) {
    setUpdatingItemId(cartItemId);
    setMessage("");

    try {
      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      const data = (await response.json()) as CartResponse;

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthRequired(true);
        }

        setMessage(data.message ?? t.cart.failedToUpdate);
        return;
      }

      await loadCart();
    } catch {
      setMessage(t.cart.failedToConnect);
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function removeItem(cartItemId: string) {
    setRemovingItemId(cartItemId);
    setMessage("");

    try {
      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as CartResponse;

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthRequired(true);
        }

        setMessage(data.message ?? t.cart.failedToRemove);
        return;
      }

      await loadCart();
    } catch {
      setMessage(t.cart.failedToConnect);
    } finally {
      setRemovingItemId(null);
    }
  }

  function updateDeliveryForm<Field extends keyof DeliveryFormState>(
    field: Field,
    value: DeliveryFormState[Field],
  ) {
    setDeliveryForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateDeliveryArea(deliveryAreaKey: DeliveryAreaKey) {
    const deliveryArea = getDeliveryAreaByKey(deliveryAreaKey);

    setDeliveryForm((current) => ({
      ...current,
      deliveryAreaKey,
      pickupAgreementAccepted: deliveryArea?.requiresCustomerAgreement
        ? current.pickupAgreementAccepted
        : false,
    }));
  }

  function getDeliveryValidationError() {
    if (deliveryForm.deliveryCity.trim().length < 2) {
      return t.cart.deliveryCityRequired;
    }

    if (selectedDeliveryArea.requiresCustomerAgreement) {
      if (!deliveryForm.pickupAgreementAccepted) {
        return t.cart.pickupAgreementRequired;
      }

      return null;
    }

    if (deliveryForm.deliveryAddress.trim().length < 5) {
      return t.cart.deliveryAddressRequired;
    }

    return null;
  }

  function reviewOrder() {
    if (
      checkoutStatus === "loading" ||
      checkoutStatus === "success" ||
      hasUnavailableItems ||
      cartItems.length === 0
    ) {
      return;
    }

    const validationError = getDeliveryValidationError();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setMessage("");
    setIsConfirmingOrder(true);
  }

  async function placeOrder() {
    if (
      checkoutStatus === "loading" ||
      checkoutStatus === "success" ||
      hasUnavailableItems ||
      cartItems.length === 0
    ) {
      return;
    }

    const validationError = getDeliveryValidationError();

    if (validationError) {
      setIsConfirmingOrder(false);
      setMessage(validationError);
      return;
    }

    setCheckoutStatus("loading");
    setMessage("");

    checkoutKeyRef.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey: checkoutKeyRef.current,
          deliveryAreaKey: deliveryForm.deliveryAreaKey,
          deliveryCity: deliveryForm.deliveryCity.trim(),
          deliveryAddress: deliveryForm.deliveryAddress.trim(),
          deliveryNotes: deliveryForm.deliveryNotes.trim(),
          pickupAgreementAccepted: deliveryForm.pickupAgreementAccepted,
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok || !data.order) {
        if (response.status === 401) {
          setIsAuthRequired(true);
        }

        setCheckoutStatus("error");
        setIsConfirmingOrder(false);
        setMessage(data.message ?? t.cart.failedToPlaceOrder);
        return;
      }

      setCheckoutStatus("success");
      setIsConfirmingOrder(false);
      setPlacedOrder(data.order);
      setCartItems([]);
    } catch {
      setCheckoutStatus("error");
      setIsConfirmingOrder(false);
      setMessage(t.cart.failedToConnect);
    }
  }

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex gap-4">
                  <div className="h-24 w-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-9 w-32 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-52 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (placedOrder) {
    const placedDeliveryAreaLabel =
      t.delivery.areas[placedOrder.deliveryAreaKey]?.label ??
      placedOrder.deliveryAreaKey;

    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm dark:border-green-900 dark:bg-green-950">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-xl font-black text-white">
          ✓
        </div>

        <h1 className="mt-5 text-2xl font-black text-green-950 dark:text-green-100">
          {t.cart.orderPlacedTitle}
        </h1>

        <p className="mt-2 text-sm leading-6 text-green-800 dark:text-green-200">
          {t.cart.orderPlacedDescription}
        </p>

        <div className="mt-6 space-y-3 rounded-2xl bg-white p-4 text-sm dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t.cart.orderId}
            </span>
            <span className="max-w-44 truncate font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {placedOrder.id}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t.cart.deliveryArea}
            </span>
            <span className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
              {placedDeliveryAreaLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t.cart.deliveryPrice}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatDeliveryPriceNis(Number(placedOrder.deliveryPrice), {
                free: t.delivery.free,
                currency: t.delivery.currency,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t.cart.total}
            </span>
            <span className="font-bold text-zinc-950 dark:text-white">
              {formatPrice(
                Number(placedOrder.totalAmount),
                t.delivery.currency,
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t.cart.payment}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {t.cart.cashOnDelivery}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t.cart.status}
            </span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              {placedOrder.status}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/orders"
            className="rounded-full bg-zinc-950 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {t.cart.viewOrders}
          </Link>

          <Link
            href="/products"
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-800 transition hover:bg-white dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            {t.cart.continueShopping}
          </Link>
        </div>
      </div>
    );
  }

  if (message && cartItems.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-black text-zinc-950 dark:text-white">
          {t.cart.cartUnavailable}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {message}
        </p>

        {isAuthRequired ? (
          <Link
            href="/login?callbackUrl=/cart"
            className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Log in
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void loadCart()}
            className="mt-6 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {t.cart.tryAgain}
          </button>
        )}
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl dark:bg-orange-950">
          🛒
        </div>

        <h1 className="mt-5 text-2xl font-black text-zinc-950 dark:text-white">
          {t.cart.emptyTitle}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {t.cart.emptyDescription}
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {t.actions.browseProducts}
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
          {t.cart.badge}
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
              {t.cart.title}
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t.cart.description}
            </p>
          </div>

          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {itemCount}{" "}
            {itemCount === 1 ? t.cart.itemSingular : t.cart.itemPlural}
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {message}
        </div>
      )}

      {hasUnavailableItems && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-medium text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200">
          {t.cart.unavailableNotice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          {cartItems.map((item) => {
            const image = item.product.images.at(0);
            const isArchived = item.product.isArchived;
            const isOutOfStock = item.availableStock <= 0;
            const exceedsStock = item.quantity > item.availableStock;
            const variantLabel = formatVariantLabel(item.productVariant);
            const isUnavailable = isArchived || isOutOfStock || exceedsStock;
            const isUpdating = updatingItemId === item.id;
            const isRemoving = removingItemId === item.id;
            const itemUnitPrice = getEffectiveCartPrice(item.product);
            const itemHasDiscount = hasCartDiscount(item.product);
            const itemSubtotal = itemUnitPrice * item.quantity;

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:h-28 sm:w-28 dark:bg-zinc-800"
                  >
                    {image ? (
                      <OptimizedImage
                        src={image}
                        alt={item.product.name}
                        sizes="(max-width: 640px) 100vw, 112px"
                        className="object-cover transition hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                        {t.cart.noImage}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
                          {item.product.category.name}
                        </p>

                        <Link
                          href={`/products/${item.product.slug}`}
                          className="mt-1 block truncate text-base font-bold text-zinc-950 transition hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
                        >
                          {item.product.name}
                        </Link>

                        {variantLabel ? (
                          <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {variantLabel}
                          </p>
                        ) : null}

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                            {formatPrice(itemUnitPrice, t.delivery.currency)}
                          </span>

                          {itemHasDiscount && (
                            <span className="text-xs text-zinc-500 line-through dark:text-zinc-400">
                              {formatPrice(
                                Number(item.product.price),
                                t.delivery.currency,
                              )}
                            </span>
                          )}

                          <span className="text-zinc-600 dark:text-zinc-400">
                            {t.cart.each}
                          </span>
                        </div>
                      </div>

                      <p className="text-lg font-black text-zinc-950 dark:text-white">
                        {formatPrice(itemSubtotal, t.delivery.currency)}
                      </p>
                    </div>

                    {isUnavailable && (
                      <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                        {isArchived
                          ? t.cart.productArchived
                          : isOutOfStock
                            ? t.cart.productOutOfStock
                            : t.cart.onlyLeft.replace(
                                "{stock}",
                                String(item.availableStock),
                              )}
                      </p>
                    )}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex w-fit items-center overflow-hidden rounded-full border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                        <button
                          type="button"
                          disabled={
                            item.quantity <= 1 || isUpdating || isRemoving
                          }
                          onClick={() =>
                            void updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-10 w-10 items-center justify-center text-lg font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          aria-label={t.cart.decreaseQuantity}
                        >
                          -
                        </button>

                        <span className="min-w-10 text-center text-sm font-bold text-zinc-950 dark:text-white">
                          {isUpdating ? "..." : item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={
                            item.quantity >= item.availableStock ||
                            isArchived ||
                            isOutOfStock ||
                            isUpdating ||
                            isRemoving
                          }
                          onClick={() =>
                            void updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-10 w-10 items-center justify-center text-lg font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          aria-label={t.cart.increaseQuantity}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeItem(item.id)}
                        disabled={isRemoving || isUpdating}
                        className="text-left text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {isRemoving ? t.cart.removing : t.cart.remove}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-black text-zinc-950 dark:text-white">
            {t.cart.orderSummary}
          </h2>

          <div className="mt-5 space-y-5 border-b border-zinc-200 pb-5 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                {t.cart.deliveryDetailsTitle}
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {t.cart.deliveryDetailsDescription}
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {t.cart.deliveryArea}
              </legend>

              {DELIVERY_AREAS.map((area) => {
                const areaTranslation = t.delivery.areas[area.key];

                return (
                  <label
                    key={area.key}
                    className="flex cursor-pointer gap-3 rounded-2xl border border-zinc-200 p-3 text-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
                  >
                    <input
                      type="radio"
                      name="deliveryAreaKey"
                      value={area.key}
                      checked={deliveryForm.deliveryAreaKey === area.key}
                      onChange={() => updateDeliveryArea(area.key)}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {areaTranslation.label}
                        </span>
                        <span className="shrink-0 font-bold text-zinc-950 dark:text-white">
                          {formatDeliveryPriceNis(area.priceNis, {
                            free: t.delivery.free,
                            currency: t.delivery.currency,
                          })}
                        </span>
                      </span>
                      {areaTranslation.note ? (
                        <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          {areaTranslation.note}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {selectedDeliveryArea.requiresCustomerAgreement &&
            selectedDeliveryTranslation.agreementLabel ? (
              <label className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm font-medium text-orange-900 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-100">
                <input
                  type="checkbox"
                  checked={deliveryForm.pickupAgreementAccepted}
                  onChange={(event) =>
                    updateDeliveryForm(
                      "pickupAgreementAccepted",
                      event.target.checked,
                    )
                  }
                  className="mt-1"
                />
                <span>{selectedDeliveryTranslation.agreementLabel}</span>
              </label>
            ) : null}

            <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {t.cart.deliveryCity}
              <input
                type="text"
                value={deliveryForm.deliveryCity}
                onChange={(event) =>
                  updateDeliveryForm("deliveryCity", event.target.value)
                }
                placeholder={t.cart.deliveryCityPlaceholder}
                className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:ring-orange-950"
              />
            </label>

            <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {selectedDeliveryArea.requiresCustomerAgreement
                ? t.cart.deliveryAddressOptional
                : t.cart.deliveryAddress}
              <textarea
                value={deliveryForm.deliveryAddress}
                onChange={(event) =>
                  updateDeliveryForm("deliveryAddress", event.target.value)
                }
                placeholder={t.cart.deliveryAddressPlaceholder}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:ring-orange-950"
              />
            </label>

            <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {t.cart.deliveryNotes}
              <textarea
                value={deliveryForm.deliveryNotes}
                onChange={(event) =>
                  updateDeliveryForm("deliveryNotes", event.target.value)
                }
                placeholder={t.cart.deliveryNotesPlaceholder}
                rows={2}
                className="mt-2 w-full resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:ring-orange-950"
              />
            </label>
          </div>

          <div className="mt-5 space-y-3 border-b border-zinc-200 pb-5 text-sm dark:border-zinc-800">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t.cart.items}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {itemCount}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t.cart.paymentMethod}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t.cart.cashOnDelivery}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t.cart.productsTotal}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatPrice(total, t.delivery.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t.cart.deliveryPrice}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatDeliveryPriceNis(selectedDeliveryPrice, {
                  free: t.delivery.free,
                  currency: t.delivery.currency,
                })}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t.cart.estimatedTotal}
              </span>
              <span className="text-lg font-black text-zinc-950 dark:text-white">
                {formatPrice(finalTotal, t.delivery.currency)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={reviewOrder}
            disabled={
              checkoutStatus === "loading" ||
              checkoutStatus === "success" ||
              hasUnavailableItems
            }
            className="mt-5 w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {checkoutStatus === "loading"
              ? t.cart.placingOrder
              : checkoutStatus === "success"
                ? t.cart.orderPlacedButton
                : t.cart.reviewOrder}
          </button>

          <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {t.legal.notices.byPlacingOrder}{" "}
            <Link
              href="/terms"
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              {t.legal.notices.termsOfUse}
            </Link>
            ,{" "}
            <Link
              href="/privacy"
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              {t.legal.notices.privacyPolicy}
            </Link>
            ,{" "}
            <Link
              href="/shipping"
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              {t.legal.notices.shippingPolicy}
            </Link>
            , {t.legal.notices.and}{" "}
            <Link
              href="/returns"
              className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              {t.legal.notices.returnsPolicy}
            </Link>
            .
          </p>

          <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {t.cart.stockServerNote}
          </p>

          <Link
            href="/products"
            className="mt-4 inline-flex w-full justify-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-950"
          >
            {t.cart.continueShopping}
          </Link>
        </aside>
      </div>

      {isConfirmingOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-order-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="confirm-order-title"
                  className="text-2xl font-black text-zinc-950 dark:text-white"
                >
                  {t.cart.confirmOrderTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {t.cart.confirmOrderDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmingOrder(false)}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {t.cart.cancel}
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                  {t.cart.contactInfo}
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      {t.cart.customerName}
                    </dt>
                    <dd className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {customer?.name?.trim() ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      {t.cart.customerEmail}
                    </dt>
                    <dd className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {customer?.email?.trim() ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      {t.cart.customerPhone}
                    </dt>
                    <dd className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {customer?.phone?.trim() ?? "—"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  {t.cart.savedAccountContact}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                  {t.cart.deliveryDetailsTitle}
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      {t.cart.deliveryArea}
                    </dt>
                    <dd className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {selectedDeliveryTranslation.label}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      {t.cart.deliveryCity}
                    </dt>
                    <dd className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {deliveryForm.deliveryCity.trim()}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      {t.cart.deliveryAddress}
                    </dt>
                    <dd className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {deliveryForm.deliveryAddress.trim() || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      {t.cart.deliveryNotes}
                    </dt>
                    <dd className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {deliveryForm.deliveryNotes.trim() || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                {t.cart.orderSummary}
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    {t.cart.productsTotal}
                  </dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatPrice(total, t.delivery.currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    {t.cart.deliveryPrice}
                  </dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatDeliveryPriceNis(selectedDeliveryPrice, {
                      free: t.delivery.free,
                      currency: t.delivery.currency,
                    })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <dt className="font-bold text-zinc-950 dark:text-white">
                    {t.cart.finalTotal}
                  </dt>
                  <dd className="text-lg font-black text-zinc-950 dark:text-white">
                    {formatPrice(finalTotal, t.delivery.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsConfirmingOrder(false)}
                className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                {t.cart.cancel}
              </button>

              <button
                type="button"
                onClick={() => void placeOrder()}
                disabled={checkoutStatus === "loading"}
                className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {checkoutStatus === "loading"
                  ? t.cart.placingOrder
                  : t.cart.confirmPlaceOrder}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
