import { AdminCategoriesClient } from "~/components/admin/AdminCategoriesClient";
import { requireAdminPage } from "~/lib/admin";

export default async function AdminCategoriesPage() {
  await requireAdminPage("/admin/categories");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <AdminCategoriesClient />
    </main>
  );
}
