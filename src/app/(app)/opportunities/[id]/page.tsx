"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Send,
  Loader2,
} from "lucide-react";
import { useOpportunity, useExpressInterest } from "@/features/opportunity/opportunity.hooks";
import { useBoostPlans, useActivateBoost } from "@/features/boost/boost.hooks";
import { OpportunityStatus } from "@/features/opportunity/opportunity.schema";
import { useSessionStore } from "@/store/use-session-store";

// ✅ Fix: Type-safe status color mapping
const statusColor: Record<OpportunityStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  CLOSED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  EXPIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  MATCHED: "bg-blue-100 text-[#082352] dark:bg-blue-900/40 dark:text-blue-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const me = useSessionStore((s) => s.me);
  const { data: opp, isLoading, error, refetch } = useOpportunity(id);
  const { data: boostPlans } = useBoostPlans();
  const activateBoost = useActivateBoost();
  const expressInterest = useExpressInterest();

  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [boostSuccess, setBoostSuccess] = useState<string | null>(null);
  const [boostError, setBoostError] = useState<string | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [interestError, setInterestError] = useState<string | null>(null);

  async function handleExpressInterest(e: React.FormEvent) {
    e.preventDefault();
    setInterestError(null);
    try {
      const result = await expressInterest.mutateAsync({ id, message: interestMessage.trim() || undefined });
      router.push(`/chat?conversationId=${result.conversationId}`);
    } catch (err) {
      setInterestError(err instanceof Error ? err.message : "Gagal mengirim minat");
    }
  }

  async function handleActivateBoost(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlanId) return;

    setBoostError(null);
    try {
      const result = await activateBoost.mutateAsync({
        opportunityId: id,
        planId: selectedPlanId,
      });
      // BUG FIX: sebelumnya modal selalu langsung nutup & bilang "berhasil"
      // tanpa cek apakah paket ini gratis atau berbayar. Untuk paket
      // berbayar, backend mengembalikan `paymentUrl` (Midtrans) yang WAJIB
      // dituju user buat menyelesaikan pembayaran — boost-nya baru aktif
      // betulan setelah webhook Midtrans masuk, bukan saat checkout dibuat.
      if (result?.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      setBoostSuccess("Boost berhasil diaktifkan! Postingan Anda kini diprioritaskan di matching engine.");
      setShowBoostModal(false);
      refetch();
    } catch (err) {
      setBoostError(err instanceof Error ? err.message : "Gagal mengaktifkan boost");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {error instanceof Error ? error.message : "Opportunity tidak ditemukan"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar
      </Link>

      {boostSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{boostSuccess}</span>
        </div>
      )}

      {boostError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{boostError}</span>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                opp.type === "NEED"
                  ? "bg-blue-50 text-[#082352] dark:bg-blue-950/50 dark:text-blue-400"
                  : "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400"
              }`}
            >
              {opp.type}
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                statusColor[opp.status]
              }`}
            >
              {opp.status}
            </span>
          </div>

          {opp.status === "ACTIVE" && opp.isOwner && (
            <button
              type="button"
              onClick={() => {
                if (boostPlans && boostPlans.length > 0) {
                  setSelectedPlanId(boostPlans[0].id);
                }
                setShowBoostModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              <Rocket className="h-3.5 w-3.5" />
              Boost Opportunity
            </button>
          )}
        </div>

        <h1 className="mt-3 text-xl font-black text-[#0B2F6E] dark:text-blue-400">
          {opp.title}
        </h1>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {opp.description}
        </p>

        <dl className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2 dark:border-zinc-800">
          {opp.location && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Lokasi
              </dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">{opp.location}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Dibuat
            </dt>
            <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
              {new Date(opp.createdAt).toLocaleString("id-ID")}
            </dd>
          </div>
          {(opp.budgetMin != null || opp.budgetMax != null) && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Budget
              </dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                {opp.budgetMin != null ? `Rp ${opp.budgetMin.toLocaleString("id-ID")}` : "—"}
                {" – "}
                {opp.budgetMax != null ? `Rp ${opp.budgetMax.toLocaleString("id-ID")}` : "—"}
              </dd>
            </div>
          )}
          {opp.tags && opp.tags.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Tags
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {opp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          {opp.isOwner ? (
            <>
              <Link
                href={`/matching/${opp.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352] active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                Jalankan Matching Engine
              </Link>
              <Link
                href={`/chat?opportunityId=${opp.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Chat Terkait Opportunity
              </Link>
            </>
          ) : me ? (
            <button
              type="button"
              onClick={() => setShowInterestModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352] active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
              Kirim Minat
            </button>
          ) : (
            <Link
              href={`/login?redirect=${encodeURIComponent(`/opportunities/${opp.id}`)}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352]"
            >
              Masuk untuk Kirim Minat
            </Link>
          )}
        </div>
      </div>

      {/* Kirim Minat Modal — Fase 2.2 */}
      {showInterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Kirim Minat
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Pesan Anda akan langsung membuka percakapan chat dengan pemilik
              opportunity ini.
            </p>
            <form onSubmit={handleExpressInterest} className="mt-4 space-y-3">
              <textarea
                value={interestMessage}
                onChange={(e) => setInterestMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={`Halo, saya tertarik dengan "${opp.title}"...`}
                className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-100"
              />
              {interestError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{interestError}</span>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowInterestModal(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={expressInterest.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#082352] disabled:opacity-50"
                >
                  {expressInterest.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Kirim & Buka Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Boost Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Boost Opportunity Ini
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tingkatkan bobot ranking dan visibilitas pencocokan untuk &ldquo;{opp.title}&rdquo;.
                </p>
              </div>
            </div>

            <form onSubmit={handleActivateBoost} className="mt-5 space-y-4">
              <div className="space-y-3">
                {(boostPlans ?? [
                  { id: "boost_basic", name: "Boost Basic (3 Hari)", tier: "BASIC", price: 49000, durationDays: 3 },
                  { id: "boost_premium", name: "Boost Premium (7 Hari)", tier: "PREMIUM", price: 99000, durationDays: 7 },
                  { id: "boost_vip", name: "Boost VIP (14 Hari)", tier: "VIP", price: 179000, durationDays: 14 },
                ]).map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <label
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="boostPlan"
                          checked={isSelected}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {plan.name}
                            </span>
                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {plan.tier}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            Durasi {plan.durationDays} hari aktif · Prioritas skor matching
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Rp {plan.price.toLocaleString("id-ID")}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  Opportunity yang di-boost mendapat kenaikan bobot hingga 30% pada algoritma ranking pencocokan.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBoostModal(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedPlanId || activateBoost.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {activateBoost.isPending ? "Mengaktifkan…" : "Konfirmasi & Aktifkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}