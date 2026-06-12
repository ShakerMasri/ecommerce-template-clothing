import { ProductListingClient } from "~/components/products/ProductListingClient";

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ProductListingClient />
    </main>
  );
}
