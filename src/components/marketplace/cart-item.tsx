"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Package, Minus, Plus, Loader2 } from "lucide-react";
import { CartItem as CartItemType } from "@/features/marketplace/cart/cart.schema";
import { useUpdateCartItem, useRemoveCartItem } from "@/features/marketplace/cart/cart.hooks";

interface CartItemProps {
  item: CartItemType;
}

function formatPrice(price: number, currency: string = "IDR"): string {
  if (currency === "IDR") return `Rp ${price.toLocaleString("id-ID")}`;
  return `${currency} ${price.toLocaleString("en-US")}`;
}

export function CartItem({ item }: CartItemProps) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const product = item.product;
  const primaryMedia = product?.media?.find((m) => m.isPrimary) || product?.media?.[0];
  const imageUrl = primaryMedia?.url;
  const hasImage = Boolean(imageUrl);

  const unitPrice = product?.price ?? 0;
  const currency = product?.currency ?? "IDR";
  const unitLabel = item.unit || product?.baseUnit || "PCS";
  const subtotal = unitPrice * item.quantity;

  const handleDecrease = () => {
    if (item.quantity <= 1) return;
    updateItem.mutate({
      itemId: item.id,
      input: { quantity: item.quantity - 1 },
    });
  };

  const handleIncrease = () => {
    updateItem.mutate({
      itemId: item.id,
      input: { quantity: item.quantity + 1 },
    });
  };

  const handleRemove = () => {
    if (confirm(`Hapus "${product?.name ?? "produk"}" dari keranjang?`)) {
      removeItem.mutate(item.id);
    }
  };

  const isUpdating = updateItem.isPending;
  const isRemoving = removeItem.isPending;

  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Image */}
      <Link
        href={product ? `/marketplace/products/${product.id}` : "#"}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
      >
        {hasImage ? (
          <Image src={imageUrl!} alt={product?.name ?? ""} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
            <Package className="h-8 w-8" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={product ? `/marketplace/products/${product.id}` : "#"}
          className="line-clamp-2 text-sm font-bold text-zinc-900 transition hover:text-[#0B2F6E] dark:text-zinc-50"
        >
          {product?.name ?? "Produk"}
        </Link>

        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {formatPrice(unitPrice, currency)} / {unitLabel}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrease}
              disabled={item.quantity <= 1 || isUpdating}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Minus className="h-3 w-3" />
            </button>

            <span className="min-w-[2rem] text-center text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {isUpdating ? (
                <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-zinc-400" />
              ) : (
                item.quantity
              )}
            </span>

            <button
              onClick={handleIncrease}
              disabled={isUpdating}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Subtotal */}
          <div className="text-right">
            <p className="text-xs text-zinc-400">Subtotal</p>
            <p className="text-sm font-extrabold text-[#0B2F6E] dark:text-blue-400">
              {formatPrice(subtotal, currency)}
            </p>
          </div>

          {/* Remove */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/30"
            title="Hapus dari keranjang"
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}