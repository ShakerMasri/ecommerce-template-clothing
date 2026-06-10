const DEFAULT_AUTH_CALLBACK_URL = "/products";

export function getSafeAuthCallbackUrl(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_CALLBACK_URL,
) {
  const normalizedFallback =
    fallback.startsWith("/") && !fallback.startsWith("//")
      ? fallback
      : DEFAULT_AUTH_CALLBACK_URL;

  if (!value) {
    return normalizedFallback;
  }

  const trimmedValue = value.trim();

  if (
    !trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("//") ||
    trimmedValue.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(trimmedValue)
  ) {
    return normalizedFallback;
  }

  return trimmedValue;
}
