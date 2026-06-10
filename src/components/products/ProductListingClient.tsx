"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";
import { CategoryTabs } from "./CategoryTabs";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  discountPrice: string | null;
  stock: number;
  showStock: boolean;
  images: string[];
  isFeatured: boolean;
  category: Category;
};

type ProductsResponse = {
  products?: Product[];
  categories?: Category[];
  message?: string;
};

export function ProductListingClient() {
  const { t } = useAppPreferences();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setIsLoading(true);
      setErrorMessage("");

      const url = selectedCategory
        ? `/api/products?category=${encodeURIComponent(selectedCategory)}`
        : "/api/products";

      try {
        const response = await fetch(url, {
          signal: controller.signal,
        });

        const data = (await response.json()) as ProductsResponse;

        if (!response.ok) {
          setProducts([]);
          setErrorMessage(data.message ?? t.products.failedToLoad);
          return;
        }

        setProducts(data.products ?? []);

        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProducts([]);
        setErrorMessage(t.products.failedToConnect);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchProducts();

    return () => {
      controller.abort();
    };
  }, [selectedCategory, t.products.failedToConnect, t.products.failedToLoad]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [products, searchTerm]);

  const selectedCategoryName =
    selectedCategory === null
      ? t.products.allProducts
      : (categories.find((category) => category.slug === selectedCategory)
          ?.name ?? t.products.selectedCategory);

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
              {t.products.badge}
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
              {t.products.title}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base dark:text-zinc-400">
              {t.products.description}
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <label
              htmlFor="product-search"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
            >
              {t.products.searchLabel}
            </label>

            <input
              id="product-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t.products.searchPlaceholder}
              className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          allLabel={t.products.allProducts}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {selectedCategoryName}
          </p>

          {!isLoading && !errorMessage && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t.products.showing} {visibleProducts.length}{" "}
              {visibleProducts.length === 1
                ? t.products.productSingular
                : t.products.productPlural}
            </p>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : visibleProducts.length === 0 && !errorMessage ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
            {t.products.noProductsTitle}
          </h2>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t.products.noProductsDescription}
          </p>

          {(selectedCategory ?? searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSearchTerm("");
              }}
              className="mt-5 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {t.actions.clearFilters}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              labels={{
                noImage: t.products.noImage,
                featured: t.products.featured,
                soldOut: t.products.soldOut,
                out: t.products.out,
                left: t.products.left,
                inStock: t.products.inStock,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
