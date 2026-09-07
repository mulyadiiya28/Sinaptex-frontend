"use client";

import { useState } from "react";
import {
  Crown,
  Check,
  Sparkles,
  Rocket,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  useMembershipStatus,
  useMembershipCheckout,
  useMembershipPlans,
} from "@/features/membership/membership.hooks";
import { useBoostPlans } from "@/features/boost/boost.hooks";

const membershipBenefits = [
  "Maksimal 20 Need & 20 Offer aktif bersamaan (kuota reguler: 1 Need + 1 Offer)",
  "Prioritas tinggi pada algoritma Business Matching Engine",
  "Akses fitur chat langsung tanpa batas origin type",
  "Badge Verified Member eksklusif di Marketplace",
  "Notifikasi instan prioritas saat ada partner baru yang cocok",
];

function formatIdr(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MembershipPage() {
  const { data: status, isLoading: isStatusLoading } = useMembershipStatus();
  const { data: plans, isLoading: isPlansLoading } = useMembershipPlans();
  const { data: boostPlans } = useBoostPlans();
  const checkout = useMembershipCheckout();

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isMemberActive = status?.isActive ?? false;

  async function handleCheckout(planId: string) {
    setCheckoutError(null);
    try {
      const result = await checkout.mutateAsync(planId);
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setCheckoutError(
        "Checkout membership belum mengembalikan URL pembayaran. Endpoint /api/v1/membership/checkout perlu diaktifkan di backend (payment gateway)."
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memproses checkout membership";
      if (msg.toLowerCase().includes("not found") || msg.includes("404")) {
        setCheckoutError(
          "API checkout membership belum tersedia di backend (404). Hubungi admin engine untuk mengaktifkan payment membership."
        );
      } else {
        setCheckoutError(msg);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B2F6E]">
          Membership & Boost
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tingkatkan kuota opportunity dan maksimalkan eksposur bisnis Anda di Sinaptex.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-xs text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0B2F6E]" />
        <p>
          Status membership diambil dari API backend. Jika endpoint status/checkout belum ada,
          akun ditampilkan sebagai <strong>Gratis</strong> dan tombol checkout menampilkan catatan
          (bukan mock dashboard).
        </p>
      </div>

      {checkoutError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00]">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-[#0B2F6E]">Status Langganan Anda</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isMemberActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isStatusLoading
                    ? "Memeriksa…"
                    : isMemberActive
                      ? "Member Aktif"
                      : "Akun Standar (Gratis)"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {isMemberActive && status?.expiresAt
                  ? `Berlaku hingga ${new Date(status.expiresAt).toLocaleDateString("id-ID")}`
                  : "Batas kuota gratis: 1 Need aktif dan 1 Offer aktif."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
              <span className="text-slate-500">Kuota Need</span>
              <p className="text-base font-bold text-[#0B2F6E]">
                {isMemberActive ? "20 Aktif" : "1 Aktif"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
              <span className="text-slate-500">Kuota Offer</span>
              <p className="text-base font-bold text-[#0B2F6E]">
                {isMemberActive ? "20 Aktif" : "1 Aktif"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans from API */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#FF6B00]" />
            <h2 className="text-lg font-semibold text-[#0B2F6E]">Pilihan Paket Membership</h2>
          </div>
          <p className="text-sm text-slate-500">
            {isPlansLoading
              ? "Memuat paket dari API…"
              : "Data paket dari /api/v1/membership/plans (fallback katalog jika kosong)."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {(plans ?? []).map((plan, idx) => {
            const featured = plan.billingCycle === "YEARLY" || idx === 1;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm ${
                  featured ? "border-2 border-[#0B2F6E]" : "border-slate-200"
                }`}
              >
                {featured && (
                  <div className="absolute -top-3 right-4 rounded-full bg-[#FF6B00] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                    Rekomendasi
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {plan.billingCycle === "YEARLY" ? "Tahunan" : "Bulanan"}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-[#0B2F6E]">{plan.name}</h3>
                  <p className="mt-3 text-3xl font-extrabold text-slate-900">
                    {formatIdr(plan.price)}
                    <span className="text-sm font-normal text-slate-500">
                      {" "}
                      / {plan.billingCycle === "YEARLY" ? "tahun" : "bulan"}
                    </span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {membershipBenefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckout(plan.id)}
                  disabled={checkout.isPending || isMemberActive}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50 ${
                    featured
                      ? "bg-[#FF6B00] hover:bg-orange-600"
                      : "bg-[#0B2F6E] hover:bg-[#082352]"
                  }`}
                >
                  {isMemberActive
                    ? "Sudah Aktif"
                    : checkout.isPending
                      ? "Memproses…"
                      : `Pilih ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Boost — dari /boosts/plans jika ada */}
      <div className="space-y-4 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-[#0B2F6E]" />
            <h2 className="text-lg font-semibold text-[#0B2F6E]">Boost Opportunity</h2>
          </div>
          <p className="text-sm text-slate-500">
            Paket dari <code className="text-xs">/api/v1/boosts/plans</code>. Aktivasi per
            opportunity lewat halaman detail opportunity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(boostPlans && boostPlans.length > 0
            ? boostPlans
            : [
                {
                  id: "boost_3d",
                  name: "Boost 3 Hari",
                  price: 49000,
                  description: "+15% bobot skor ranking matching selama 3 hari.",
                  tier: "BASIC",
                },
                {
                  id: "boost_7d",
                  name: "Boost 7 Hari",
                  price: 99000,
                  description: "+30% bobot skor & badge sorotan selama 7 hari.",
                  tier: "PREMIUM",
                },
                {
                  id: "boost_14d",
                  name: "Boost 14 Hari",
                  price: 179000,
                  description: "Prioritas ranking tertinggi & rekomendasi mitra.",
                  tier: "VIP",
                },
              ]
          ).map((b) => (
            <div
              key={String((b as { id: string }).id)}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#0B2F6E]">
                {String((b as { tier?: string; name?: string }).tier || "BOOST")}
              </span>
              <h4 className="mt-2 font-semibold text-slate-900">
                {String((b as { name?: string }).name || "Boost")}
              </h4>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatIdr(Number((b as { price?: number }).price || 0))}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {String(
                  (b as { description?: string }).description ||
                    "Tingkatkan posisi di hasil matching."
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
