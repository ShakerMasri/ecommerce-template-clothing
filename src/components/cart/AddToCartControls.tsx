"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AddToCartControlsProps = {
  productId: string;
  productVariantId?: string | null;
  stock: number | null;
  isInStock: boolean;
  disabledReason?: string | null;
};

type AddCartResponse = {
  message?: string;
};

export function AddToCartControls({
  productId,
  productVariantId = null,
  stock,
  isInStock,
  disabledReason = null,
}: AddToCartControlsProps) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const maxClientQuantity = stock ?? 99;
  const isOutOfStock = !isInStock;
  const isLoading = status === "loading";

  useEffect(() => {
    setQuantity((currentQuantity) => {
      return Math.min(
        Math.max(1, currentQuantity),
        Math.max(1, maxClientQuantity),
      );
    });
  }, [maxClientQuantity, productVariantId]);
  const isDisabled = isLoading || isOutOfStock || Boolean(disabledReason);

  function decreaseQuantity() {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  }

  function increaseQuantity() {
    setQuantity((currentQuantity) => Math.min(maxClientQuantity, currentQuantity + 1));
  }

  async function handleAddToCart() {
    if (isDisabled) {
      if (disabledReason) {
        setStatus("error");
        setMessage(disabledReason);
      }

      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          productVariantId,
          quantity,
        }),
      });

      const data = (await response.json()) as AddCartResponse;

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/cart")}`);
        return;
      }

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "Failed to add item to cart.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Item added to cart.");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Failed to connect to the server.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decreaseQuantity}
          disabled={isLoading || quantity <= 1}
          className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          -
        </button>

        <span className="min-w-8 text-center">{quantity}</span>

        <button
          type="button"
          onClick={increaseQuantity}
          disabled={isLoading || quantity >= maxClientQuantity || isDisabled}
          className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isDisabled}
        className="rounded bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? "Adding..."
          : disabledReason
            ? "Choose an option"
            : isOutOfStock
              ? "Out of stock"
              : "Add to cart"}
      </button>

      <a
        href="/cart"
        className="ml-3 inline-block text-sm text-gray-600 underline"
      >
        View cart
      </a>

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-600" : "text-green-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
