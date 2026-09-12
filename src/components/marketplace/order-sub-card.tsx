"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Package,
  Truck,
  CheckCircle2,
  Loader2,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { OrderSub, SubOrderStatus } from "@/features/marketplace/order/order.schema";
import {
  useUpdateSubOrderStatus,
  useConfirmDelivery,
} from "@/features/marketplace/order/order.hooks";

interface OrderSubCardProps {
  sub: OrderSub;
  isBuyer: boolean;
  orderCurrency?: string;
}

function formatPrice(price: number, currency: string = "IDR"): string {
  if (currency === "IDR") return `Rp ${price.toLocaleString("id-ID")}`;
  return `${currency} ${price.toLocaleString("en-US")}`;
}

const SUB_STATUS_CONFIG: Record<
  SubOrderStatus,
  { label: string; color: string }
> = {
  PENDING: { label: "Menunggu", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  PROCESSING: { label: "Diproses", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  SHIPPED: { label: "Dikirim", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400" },
  DELIVERED: { label: "Selesai", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
};

export function OrderSubCard({ sub, isBuyer, orderCurrency = "IDR" }: OrderSubCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

  const updateStatus = useUpdateSubOrderStatus();
  const confirmDelivery = useConfirmDelivery();

  const config = SUB_STATUS_CONFIG[sub.status];
  const items = sub.items ?? [];

  const handleUpdateStatus = (status: "PROCESSING" | "SHIPPED" | "DELIVERED") => {
    if (status === "SHIPPED" && !trackingNumber.trim()) {
      setShowTrackingInput(true);
      return;
    }
    updateStatus.mutate({
      subOrderId: sub.id,
      input: {
        status,
        trackingNumber: status === "SHIPPED" ? trackingNumber.trim() : undefined,
      },
    });
  };

  const handleConfirmDelivery = () => {
    if (confirm("Konfirmasi bahwa Anda sudah menerima pesanan ini? Dana escrow akan dilepas ke penjual.")) {
      confirmDelivery.mutate(sub.id);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2F6E] text-white">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {sub.sellerParty?.name ?? "Penjual"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {items.length} item · {formatPrice(sub.totalAmount, orderCurrency)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
            {config.label}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => {
              const primaryMedia =
                item.product?.media?.find((m) => m.isPrimary) || item.product?.media?.[0];
              const hasImage = Boolean(primaryMedia?.url);

              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {hasImage ? (
                      <Image
                        src={primaryMedia!.url}
                        alt={item.product?.name ?? ""}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.product?.name ?? item.productName ?? "Produk"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {item.quantity} {item.unit ?? "pcs"} × {formatPrice(item.price, orderCurrency)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatPrice(item.price * item.quantity, orderCurrency)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tracking Number */}
          {sub.trackingNumber && (
            <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Nomor Resi
              </p>
              <p className="mt-0.5 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {sub.trackingNumber}
              </p>
            </div>
          )}

          {/* Tracking Input (Seller, SHIPPED) */}
          {!isBuyer && showTrackingInput && sub.status === "PROCESSING" && (
            <div className="mt-4 space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nomor Resi / Tracking
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="JNE-123456789"
                maxLength={100}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTrackingInput(false)}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleUpdateStatus("SHIPPED")}
                  disabled={!trackingNumber.trim() || updateStatus.isPending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0B2F6E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#082352] disabled:opacity-50"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Truck className="h-3 w-3" />
                  )}
                  Kirim
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* SELLER: Update status */}
            {!isBuyer && (
              <>
                {sub.status === "PENDING" && (
                  <button
                    onClick={() => handleUpdateStatus("PROCESSING")}
                    disabled={updateStatus.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#082352] disabled:opacity-50"
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Package className="h-3.5 w-3.5" />
                    )}
                    Proses Pesanan
                  </button>
                )}
                {sub.status === "PROCESSING" && !showTrackingInput && (
                  <button
                    onClick={() => setShowTrackingInput(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#082352]"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Kirim Pesanan
                  </button>
                )}
                {sub.status === "SHIPPED" && (
                  <button
                    onClick={() => handleUpdateStatus("DELIVERED")}
                    disabled={updateStatus.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tandai Selesai
                  </button>
                )}
              </>
            )}

            {/* BUYER: Confirm delivery */}
            {isBuyer && sub.status === "SHIPPED" && (
              <button
                onClick={handleConfirmDelivery}
                disabled={confirmDelivery.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {confirmDelivery.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Konfirmasi Terima
              </button>
            )}

            {/* Status info */}
            {sub.status === "DELIVERED" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ✓ Pesanan selesai
              </p>
            )}
            {sub.status === "CANCELLED" && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Pesanan dibatalkan
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}