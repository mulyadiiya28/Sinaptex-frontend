"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, Clock, CheckCircle2, XCircle, ShoppingCart } from "lucide-react";
import { ProductInquiry, InquiryStatus } from "@/features/marketplace/inquiry/inquiry.schema";

interface InquiryCardProps {
  inquiry: ProductInquiry;
  variant?: "buyer" | "seller";
}

function formatPrice(price: number, currency: string = "IDR"): string {
  if (currency === "IDR") return `Rp ${price.toLocaleString("id-ID")}`;
  return `${currency} ${price.toLocaleString("en-US")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; color: string; icon: typeof Package }
> = {
  PENDING: {
    label: "Menunggu",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Disetujui",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  DECLINED: {
    label: "Ditolak",
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    icon: XCircle,
  },
  CONVERTED: {
    label: "Sudah Checkout",
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    icon: ShoppingCart,
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    color: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
    icon: Clock,
  },
};

export function InquiryCard({ inquiry, variant = "buyer" }: InquiryCardProps) {
  const config = STATUS_CONFIG[inquiry.status];
  const StatusIcon = config.icon;

  const primaryMedia =
    inquiry.product?.media?.find((m) => m.isPrimary) || inquiry.product?.media?.[0];
  const hasImage = Boolean(primaryMedia?.url);

  return (
    <Link
      href={`/marketplace/inquiries/${inquiry.id}`}
      className="group block rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[11px] font-semibold text-zinc-400">
              ID: {inquiry.id.slice(0, 8)}
            </p>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">
            {formatDate(inquiry.createdAt)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-[#0B2F6E]" />
      </div>

      {/* Product */}
      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {hasImage ? (
            <Image
              src={primaryMedia!.url}
              alt={inquiry.product?.name ?? ""}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
              <Package className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {inquiry.product?.name ?? "Produk"}
          </p>
          {inquiry.product?.price != null && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {formatPrice(inquiry.product.price, inquiry.product.currency)}
            </p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {inquiry.proposedQuantity != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Qty Diajukan
            </p>
            <p className="mt-0.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {inquiry.proposedQuantity} unit
            </p>
          </div>
        )}
        {inquiry.finalPrice != null ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
              Harga Final
            </p>
            <p className="mt-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {formatPrice(inquiry.finalPrice)}
            </p>
          </div>
        ) : inquiry.proposedPrice != null ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Harga Diajukan
            </p>
            <p className="mt-0.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {formatPrice(inquiry.proposedPrice)}
            </p>
          </div>
        ) : null}
      </div>

      {/* Message preview */}
      {inquiry.message && (
        <p className="mt-3 line-clamp-2 text-[11px] italic text-zinc-500 dark:text-zinc-400">
          &ldquo;{inquiry.message}&rdquo;
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {variant === "buyer" && inquiry.sellerParty && (
          <p className="text-[10px] text-zinc-400">
            Penjual: {inquiry.sellerParty.name ?? "-"}
          </p>
        )}
        {variant === "seller" && inquiry.buyerProfile && (
          <p className="text-[10px] text-zinc-400">
            Pembeli: {inquiry.buyerProfile.fullName ?? "-"}
          </p>
        )}
      </div>
    </Link>
  );
}