"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, Truck, CheckCircle2, XCircle, Clock, CreditCard } from "lucide-react";
import { Order, OrderStatus} from "@/features/marketplace/order/order.schema";

interface OrderCardProps {
  order: Order;
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
  OrderStatus,
  { label: string; color: string; icon: typeof Package }
> = {
  PENDING_PAYMENT: {
    label: "Menunggu Pembayaran",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
    icon: CreditCard,
  },
  PROCESSING: {
    label: "Diproses",
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
    icon: Clock,
  },
  SHIPPED: {
    label: "Dikirim",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50",
    icon: Truck,
  },
  DELIVERED: {
    label: "Selesai",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
    icon: XCircle,
  },
};

export function OrderCard({ order, variant = "buyer" }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  // Ambil 3 item pertama
  const items = order.items ?? [];
  const previewItems = items.slice(0, 3);
  const remainingCount = items.length - previewItems.length;

  return (
    <Link
      href={`/marketplace/orders/${order.id}`}
      className="group block rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold text-zinc-400">
              {order.invoiceNumber}
            </p>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-[#0B2F6E]" />
      </div>

      {/* Items Preview */}
      <div className="mt-3 space-y-2">
        {previewItems.map((item) => {
          const primaryMedia =
            item.product?.media?.find((m) => m.isPrimary) || item.product?.media?.[0];
          const hasImage = Boolean(primaryMedia?.url);

          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {hasImage ? (
                  <Image
                    src={primaryMedia!.url}
                    alt={item.product?.name ?? ""}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                    <Package className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.product?.name ?? item.productName ?? "Produk"}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {item.quantity} {item.unit ?? "pcs"} ×{" "}
                  {formatPrice(item.price, order.currency)}
                </p>
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <p className="text-[10px] text-zinc-400">
            +{remainingCount} produk lainnya
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div>
          {variant === "buyer" && order.buyer && (
            <p className="text-[10px] text-zinc-400">
              Pembeli: {order.buyer.fullName ?? "-"}
            </p>
          )}
          {variant === "seller" && order.subOrders?.[0]?.sellerParty && (
            <p className="text-[10px] text-zinc-400">
              Penjual: {order.subOrders[0].sellerParty.name ?? "-"}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-400">Total</p>
          <p className="text-sm font-extrabold text-[#0B2F6E] dark:text-blue-400">
            {formatPrice(order.totalAmount, order.currency)}
          </p>
        </div>
      </div>
    </Link>
  );
}