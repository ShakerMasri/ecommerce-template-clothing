import Link from "next/link";
import { OptimizedImage } from "~/components/ui/OptimizedImage";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    discountPrice: string | null;
    stock: number;
    showStock: boolean;
    images: string[];
    isFeatured?: boolean;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
  labels: {
    noImage: string;
    featured: string;
    soldOut: string;
    out: string;
    left: string;
    inStock: string;
  };
};

function formatPrice(price: string) {
  return `$${Number(price).toFixed(2)}`;
}

function getDisplayPrice(product: ProductCardProps["product"]) {
  return product.discountPrice ?? product.price;
}

export function ProductCard({ product, labels }: ProductCardProps) {
  const mainImage = product.images.at(0);
  const isOutOfStock = product.stock <= 0;
  const shouldShowStockCount = product.showStock;
  const hasDiscount = product.discountPrice !== null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {mainImage ? (
          <OptimizedImage
            src={mainImage}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            {labels.noImage}
          </div>
        )}

        {product.isFeatured && (
          <span className="absolute top-3 left-3 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
            {labels.featured}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute top-3 right-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            {labels.soldOut}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
            {product.category.name}
          </p>

          <h3 className="mt-1 text-base font-bold text-zinc-950 transition group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p
              className={
                hasDiscount
                  ? "text-lg font-black text-orange-600 dark:text-orange-400"
                  : "text-lg font-black text-zinc-950 dark:text-white"
              }
            >
              {formatPrice(getDisplayPrice(product))}
            </p>

            {hasDiscount && (
              <p className="text-xs font-semibold text-zinc-500 line-through decoration-zinc-500 decoration-solid decoration-2 dark:text-zinc-400 dark:decoration-zinc-400 dark:decoration-solid">
                {formatPrice(product.price)}
              </p>
            )}
          </div>

          {isOutOfStock ? (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
              {labels.out}
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
              {shouldShowStockCount
                ? `${product.stock} ${labels.left}`
                : labels.inStock}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
