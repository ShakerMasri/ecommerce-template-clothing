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
  stock: number | null;
  showStock: boolean;
  images: string[];
  isFeatured: boolean;
  hasVariants: boolean;
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
    const filteredProducts = normalizedSearch
      ? products.filter((product) => {
          return (
            product.name.toLowerCase().includes(normalizedSearch) ||
            product.category.name.toLowerCase().includes(normalizedSearch)
          );
        })
      : products;

    return [...filteredProducts].sort((firstProduct, secondProduct) => {
      return Number(secondProduct.isFeatured) - Number(firstProduct.isFeatured);
    });
  }, [products, searchTerm]);

  const selectedCategoryName =
    selectedCategory === null
      ? t.products.allProducts
      : (categories.find((category) => category.slug === selectedCategory)
          ?.name ?? t.products.selectedCategory);

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-card)] p-4 shadow-sm sm:rounded-[1.75rem] sm:p-5 lg:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {t.products.badge}
            </p>

            <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-tight tracking-[-0.035em] text-[var(--ink)] sm:mt-3 sm:text-4xl lg:text-5xl">
              {t.products.title}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)] sm:mt-3 sm:leading-7">
              {t.products.description}
            </p>
          </div>

          <div>
            <label
              htmlFor="product-search"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]"
            >
              {t.products.searchLabel}
            </label>

            <input
              id="product-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t.products.searchPlaceholder}
              className="mt-2 min-h-11 w-full rounded-full border border-[var(--line-soft)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface-card)] sm:min-h-12"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-[var(--line-soft)] bg-[var(--surface-card)] p-3 shadow-sm sm:rounded-[1.5rem] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <CategoryTabs
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              allLabel={t.products.allProducts}
            />
          </div>

          <div className="shrink-0 text-sm">
            <p className="font-semibold text-[var(--ink)]">
              {selectedCategoryName}
            </p>

            {!isLoading && !errorMessage ? (
              <p className="mt-1 text-[var(--ink-muted)]">
                {t.products.showing} {visibleProducts.length}{" "}
                {visibleProducts.length === 1
                  ? t.products.productSingular
                  : t.products.productPlural}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-[var(--danger-ink)] bg-[var(--danger-soft)] p-5 text-sm font-semibold text-[var(--danger-ink)]">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : visibleProducts.length === 0 && !errorMessage ? (
        <div className="rounded-[2rem] border border-dashed border-[var(--line-soft)] bg-[var(--surface-card)] p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--ink)]">
            {t.products.noProductsTitle}
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--ink-muted)]">
            {t.products.noProductsDescription}
          </p>

          {(selectedCategory ?? searchTerm) ? (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSearchTerm("");
              }}
              className="mt-6 min-h-11 rounded-full bg-[var(--ink)] px-6 py-2 text-sm font-semibold text-[var(--surface-page)] transition hover:bg-[var(--accent-strong)]"
            >
              {t.actions.clearFilters}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
                optionsAvailable: t.products.optionsAvailable,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
