import { AdminDashboardClient } from "~/components/admin/AdminDashboardClient";
import { requireAdminPage } from "~/lib/admin";

export default async function AdminPage() {
  await requireAdminPage("/admin");

  return <AdminDashboardClient />;
}
