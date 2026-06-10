import { ProductDetailClient } from "~/components/products/ProductDetailClient";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <ProductDetailClient slug={slug} />
    </main>
  );
}
