"use client";

import { AppErrorFallback } from "~/components/ui/AppErrorFallback";

export default function AccountError({ reset }: { reset: () => void }) {
  return (
    <AppErrorFallback
      title="We could not load your account."
      description="Please try again. If you were changing profile details, check the page after refreshing before submitting again."
      reset={reset}
      homeHref="/account"
      homeLabel="Back to account"
    />
  );
}
