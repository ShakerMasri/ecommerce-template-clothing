import { AdminOrdersClient } from "~/components/admin/AdminOrdersClient";
import { requireAdminPage } from "~/lib/admin";

export default async function AdminOrdersPage() {
  await requireAdminPage("/admin/orders");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <AdminOrdersClient />
    </main>
  );
}
