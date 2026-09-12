"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Package, Store } from "lucide-react";
import { Product } from "@/features/marketplace/product/product.schema";

interface ProductCardProps {
  product: Product;
}

function formatPrice(price: number, currency: string = "IDR"): string {
  if (currency === "IDR") {
    return `Rp ${price.toLocaleString("id-ID")}`;
  }
  return `${currency} ${price.toLocaleString("en-US")}`;
}

function getSectorLabel(sector: string): string {
  switch (sector) {
    case "GOODS":
      return "Barang";
    case "SERVICE":
      return "Jasa";
    case "PROPERTY":
      return "Properti";
    default:
      return sector;
  }
}

function getSectorColor(sector: string): string {
  switch (sector) {
    case "GOODS":
      return "bg-blue-50 text-[#0B2F6E] border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
    case "SERVICE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
    case "PROPERTY":
      return "bg-amber-50 text-[#FF6B00] border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200";
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryMedia = product.media?.find((m) => m.isPrimary) || product.media?.[0];
  const imageUrl = primaryMedia?.url;
  const hasImage = Boolean(imageUrl);

  return (
    <Link
      href={`/marketplace/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {hasImage ? (
          <Image
            src={imageUrl!}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
            <Package className="h-12 w-12" />
          </div>
        )}

        {/* Sector Badge */}
        <span
          className={`absolute left-2 top-2 rounded-lg border px-2 py-1 text-[10px] font-bold tracking-wider uppercase ${getSectorColor(
            product.sector
          )}`}
        >
          {getSectorLabel(product.sector)}
        </span>

        {/* Featured Badge */}
        {product.isFeatured && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-[#FF6B00] px-2 py-1 text-[10px] font-bold text-white shadow-sm">
            <Star className="h-3 w-3 fill-white" />
            Unggulan
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        {product.category && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <h3 className="line-clamp-2 text-sm font-bold text-zinc-900 transition-colors group-hover:text-[#0B2F6E] dark:text-zinc-50 dark:group-hover:text-blue-400">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="mt-3">
          <p className="text-base font-extrabold text-[#0B2F6E] dark:text-blue-400">
            {formatPrice(product.price, product.currency)}
            <span className="ml-1 text-[10px] font-normal text-zinc-400">
              / {product.baseUnit}
            </span>
          </p>
        </div>

        {/* Footer: Vendor + Location */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
              <Store className="h-3 w-3" />
            </div>
            <span className="truncate text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              {product.party?.name ?? "Vendor"}
            </span>
          </div>

          {/* Stock info */}
          {product.stock > 0 && (
            <span className="shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Stok: {product.stock}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}