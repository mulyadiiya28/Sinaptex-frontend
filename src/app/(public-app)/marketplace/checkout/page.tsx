"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  ShieldCheck,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useCart } from "@/features/marketplace/cart/cart.hooks";
import { useCheckout } from "@/features/marketplace/order/order.hooks";
import { useSessionStore } from "@/store/use-session-store";

function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`;
}

export default function CheckoutPage() {
  const me = useSessionStore((s) => s.me);
  const { data: cart, isLoading } = useCart(Boolean(me));
  const checkout = useCheckout();

  const [form, setForm] = useState({
    name: me?.fullName ?? "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  );
  const total = subtotal;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validasi
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim()
    ) {
      setErrorMsg("Mohon lengkapi semua field alamat pengiriman");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Keranjang kosong");
      return;
    }

    try {
      const result = await checkout.mutateAsync({
        shippingAddress: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
        },
        notes: form.notes.trim() || undefined,
      });

      // Redirect ke Midtrans Snap
      if (result?.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setErrorMsg("Gagal mendapatkan URL pembayaran. Coba lagi.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout gagal";
      setErrorMsg(msg);
    }
  };

  // Belum login
  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CreditCard className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Masuk untuk Checkout
        </h1>
        <Link
          href="/login?redirect=/marketplace/checkout"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white hover:bg-[#082352]"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  // Keranjang kosong
  if (!isLoading && items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CreditCard className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Keranjang Kosong
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tambahkan produk dulu sebelum checkout
        </p>
        <Link
          href="/marketplace"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white hover:bg-[#082352]"
        >
          Jelajahi Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/marketplace/cart"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-[#0B2F6E] dark:text-zinc-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Keranjang
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
            Checkout
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Alamat Pengiriman */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                <MapPin className="h-4 w-4 text-[#0B2F6E]" />
                Alamat Pengiriman
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Nama Penerima <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Nama lengkap"
                      className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0B2F6E] focus:ring-2 focus:ring-[#0B2F6E]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Nomor Telepon <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="+62 812-3456-7890"
                      className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0B2F6E] focus:ring-2 focus:ring-[#0B2F6E]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    rows={3}
                    placeholder="Jalan, nomor, RT/RW, kelurahan, kecamatan..."
                    className="mt-1 w-full resize-none rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0B2F6E] focus:ring-2 focus:ring-[#0B2F6E]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Kota / Kabupaten <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    placeholder="Jakarta Selatan"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0B2F6E] focus:ring-2 focus:ring-[#0B2F6E]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Catatan (Opsional)
              </h2>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                maxLength={1000}
                placeholder="Contoh: Kirim siang hari, hubungi sebelum kirim..."
                className="mt-3 w-full resize-none rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0B2F6E] focus:ring-2 focus:ring-[#0B2F6E]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="mt-1 text-right text-[10px] text-zinc-400">
                {form.notes.length}/1000
              </p>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Ringkasan Pesanan
            </h2>

            {/* Item List */}
            <div className="mt-4 max-h-48 space-y-2 overflow-y-auto border-y border-zinc-100 py-3 dark:border-zinc-800">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2 text-xs">
                  <span className="line-clamp-1 text-zinc-600 dark:text-zinc-400">
                    {item.product?.name ?? "Produk"} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatPrice((item.product?.price ?? 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 flex justify-between">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Total
              </span>
              <span className="text-lg font-black text-[#0B2F6E] dark:text-blue-400">
                {formatPrice(total)}
              </span>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={checkout.isPending || items.length === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#FF6B00]/25 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkout.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Bayar Sekarang
                </>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Pembayaran aman via Midtrans
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}