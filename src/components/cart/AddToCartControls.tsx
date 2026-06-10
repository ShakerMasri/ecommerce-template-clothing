"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AddToCartControlsProps = {
  productId: string;
  stock: number;
};

type AddCartResponse = {
  message?: string;
};

export function AddToCartControls({
  productId,
  stock,
}: AddToCartControlsProps) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const isOutOfStock = stock <= 0;
  const isLoading = status === "loading";

  function decreaseQuantity() {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  }

  function increaseQuantity() {
    setQuantity((currentQuantity) => Math.min(stock, currentQuantity + 1));
  }

  async function handleAddToCart() {
    if (isLoading || isOutOfStock) return;

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
          disabled={isLoading || quantity >= stock}
          className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isLoading || isOutOfStock}
        className="rounded bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? "Adding..."
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
