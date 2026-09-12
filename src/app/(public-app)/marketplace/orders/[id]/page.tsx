"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  User,
  Calendar,
  FileText,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useOrder } from "@/features/marketplace/order/order.hooks";
import { useSessionStore } from "@/store/use-session-store";
import { OrderSubCard } from "@/components/marketplace/order-sub-card";
import { OrderStatus } from "@/features/marketplace/order/order.schema";

function formatPrice(price: number, currency: string = "IDR"): string {
  if (currency === "IDR") return `Rp ${price.toLocaleString("id-ID")}`;
  return `${currency} ${price.toLocaleString("en-US")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
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
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    icon: CreditCard,
  },
  PROCESSING: {
    label: "Diproses",
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    icon: Clock,
  },
  SHIPPED: {
    label: "Dikirim",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400",
    icon: Truck,
  },
  DELIVERED: {
    label: "Selesai",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    icon: XCircle,
  },
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const me = useSessionStore((s) => s.me);
  const { data: order, isLoading, error } = useOrder(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Package className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Pesanan Tidak Ditemukan
        </h1>
        <Link
          href="/marketplace/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white hover:bg-[#082352]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pesanan
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  const isBuyer = me?.id === order.buyerId;
  const shipping = order.shippingAddress as {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  } | null;

  const subOrders = order.subOrders ?? [];
  const items = order.items ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/marketplace/orders"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-[#0B2F6E] dark:text-zinc-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Pesanan
          </Link>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
                {order.invoiceNumber}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                <Calendar className="h-3 w-3" />
                {formatDate(order.createdAt)}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${statusConfig.color}`}
            >
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sub-Orders */}
        {subOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Pesanan per Penjual ({subOrders.length})
            </h2>
            {subOrders.map((sub) => (
              <OrderSubCard
                key={sub.id}
                sub={sub}
                isBuyer={isBuyer}
                orderCurrency={order.currency}
              />
            ))}
          </div>
        )}

        {/* Items (fallback kalau tidak ada subOrders) */}
        {subOrders.length === 0 && items.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Item Pesanan
            </h2>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {item.product?.name ?? item.productName ?? "Produk"} × {item.quantity}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatPrice(item.price * item.quantity, order.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping Address */}
        {shipping && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              <MapPin className="h-4 w-4 text-[#0B2F6E]" />
              Alamat Pengiriman
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              {shipping.name && (
                <p className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  {shipping.name}
                </p>
              )}
              {shipping.phone && (
                <p className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" />
                  {shipping.phone}
                </p>
              )}
              {shipping.address && (
                <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                  {shipping.address}
                  {shipping.city ? `, ${shipping.city}` : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              <FileText className="h-4 w-4 text-[#0B2F6E]" />
              Catatan
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
              {order.notes}
            </p>
          </div>
        )}

        {/* Total */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Total Pembayaran
            </span>
            <span className="text-xl font-black text-[#0B2F6E] dark:text-blue-400">
              {formatPrice(order.totalAmount, order.currency)}
            </span>
          </div>
          {order.escrowId && (
            <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3 text-xs text-emerald-600 dark:border-zinc-800 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Dana dilindungi escrow
            </div>
          )}
        </div>
      </div>
    </div>
  );
}