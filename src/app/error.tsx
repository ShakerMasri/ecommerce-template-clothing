"use client";

import { AppErrorFallback } from "~/components/ui/AppErrorFallback";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <AppErrorFallback
      title="We could not load this page."
      description="Please try again. The store is still available, but this page hit an unexpected problem."
      reset={reset}
    />
  );
}
