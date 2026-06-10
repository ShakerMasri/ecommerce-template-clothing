import { requireAdminPage } from "~/lib/admin";
import { AdminProductsClient } from "./AdminProductsClient";

export default async function AdminProductsPage() {
  await requireAdminPage("/admin/products");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <AdminProductsClient />
    </main>
  );
}
