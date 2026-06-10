"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddToCartControls } from "~/components/cart/AddToCartControls";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { OptimizedImage } from "~/components/ui/OptimizedImage";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  discountPrice: string | null;
  stock: number;
  showStock: boolean;
  images: string[];
  isFeatured: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

type ProductResponse = {
  product?: Product;
  message?: string;
};

type ProductDetailClientProps = {
  slug: string;
};

function formatPrice(price: string) {
  return `$${Number(price).toFixed(2)}`;
}

function getDisplayPrice(product: Product) {
  return product.discountPrice ?? product.price;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const { t, language } = useAppPreferences();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      setIsLoading(true);
      setMessage("");

      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(slug)}`,
          {
            signal: controller.signal,
          },
        );

        const data = (await response.json()) as ProductResponse;

        if (!response.ok || !data.product) {
          setProduct(null);
          setMessage(data.message ?? t.products.productNotFound);
          return;
        }

        setProduct(data.product);
        setSelectedImage(data.product.images.at(0) ?? null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProduct(null);
        setMessage(t.products.failedToConnect);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchProduct();

    return () => {
      controller.abort();
    };
  }, [slug, t.products.failedToConnect, t.products.productNotFound]);

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />

          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-7 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-12 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-black text-zinc-950 dark:text-white">
          {t.products.productNotFound}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {message || t.products.productUnavailable}
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {t.actions.backToProducts}
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.discountPrice !== null;
  const selectedImageIndex = selectedImage
    ? product.images.findIndex((image) => image === selectedImage)
    : -1;

  return (
    <section className="space-y-8">
      <div>
        <Link
          href="/products"
          className="text-sm font-semibold text-zinc-600 transition hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400"
        >
          {language === "ar" ? "→" : "←"} {t.actions.backToProducts}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {selectedImage ? (
              <OptimizedImage
                src={selectedImage}
                alt={product.name}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                {t.products.noImage}
              </div>
            )}

            {product.isFeatured && (
              <span className="absolute top-4 left-4 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
                {t.products.featured}
              </span>
            )}

            {isOutOfStock && (
              <span className="absolute top-4 right-4 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                {t.products.soldOut}
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {product.images.map((image, index) => {
                const isActive = selectedImage === image;

                return (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`relative aspect-square overflow-hidden rounded-2xl border bg-zinc-100 transition dark:bg-zinc-900 ${
                      isActive
                        ? "border-orange-600 ring-4 ring-orange-100 dark:border-orange-400 dark:ring-orange-950"
                        : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                    }`}
                    aria-label={`${t.products.image} ${index + 1}`}
                  >
                    <OptimizedImage
                      src={image}
                      alt={`${product.name} ${t.products.image} ${index + 1}`}
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {selectedImageIndex >= 0 && product.images.length > 1 && (
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              {t.products.image} {selectedImageIndex + 1} {t.products.of}{" "}
              {product.images.length}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
                {product.category.name}
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                {product.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p
                  className={
                    hasDiscount
                      ? "text-3xl font-black text-orange-600 dark:text-orange-400"
                      : "text-3xl font-black text-zinc-950 dark:text-white"
                  }
                >
                  {formatPrice(getDisplayPrice(product))}
                </p>

                {hasDiscount && (
                  <p className="text-sm font-semibold text-zinc-500 line-through decoration-zinc-500 decoration-solid decoration-2 dark:text-zinc-400 dark:decoration-zinc-400 dark:decoration-solid">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>

              {isOutOfStock ? (
                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                  {t.products.outOfStock}
                </span>
              ) : (
                <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                  {product.showStock
                    ? `${product.stock} ${t.products.inStock}`
                    : t.products.inStock}
                </span>
              )}
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
                {t.products.descriptionTitle}
              </h2>

              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {product.description?.trim()
                  ? product.description
                  : t.products.noDescription}
              </p>
            </div>

            <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <AddToCartControls productId={product.id} stock={product.stock} />

              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {t.products.stockNote}
              </p>
            </div>

            <div className="grid gap-3 border-t border-zinc-200 pt-5 text-sm dark:border-zinc-800">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {t.products.payment}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.products.cashOnDelivery}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {t.products.category}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {product.category.name}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {t.products.productId}
                </span>
                <span className="max-w-40 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {product.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
