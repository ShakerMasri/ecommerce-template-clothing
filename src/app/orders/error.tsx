"use client";

import { AppErrorFallback } from "~/components/ui/AppErrorFallback";

export default function OrdersError({ reset }: { reset: () => void }) {
  return (
    <AppErrorFallback
      title="We could not load your orders."
      description="Please try again. If you recently placed an order, avoid placing a duplicate order until the orders page loads or the store owner confirms it."
      reset={reset}
      homeHref="/orders"
      homeLabel="Back to orders"
    />
  );
}
