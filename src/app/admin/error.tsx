"use client";

import { AppErrorFallback } from "~/components/ui/AppErrorFallback";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <AppErrorFallback
      title="We could not load the admin area."
      description="Please try again before repeating an admin action. This helps avoid duplicate updates to orders, stock, products, or categories."
      reset={reset}
      homeHref="/admin"
      homeLabel="Back to admin"
    />
  );
}
