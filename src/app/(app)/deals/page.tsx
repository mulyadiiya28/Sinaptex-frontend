"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Handshake,
  ArrowRight,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Star,
  MessageSquare,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { useDeals, useUpdateDealStatus } from "@/features/deal/deal.hooks";
import { useCreateReview } from "@/features/review/review.hooks";
import { Deal, DealStatus, getCounterpartyProfileId, getCounterpartyName } from "@/features/deal/deal.schema";
import { useSessionStore } from "@/store/use-session-store";

const statusFilterTabs: { label: string; status?: DealStatus | "CANCELLED_OR_EXPIRED" }[] = [
  { label: "Semua" },
  { label: "Negosiasi", status: "NEGOTIATION" },
  { label: "Deal", status: "DEAL" },
  { label: "Berjalan", status: "IN_PROGRESS" },
  { label: "Selesai", status: "COMPLETED" },
  { label: "Batal / Expired", status: "CANCELLED_OR_EXPIRED" },
];

const statusBadgeColor: Record<DealStatus, string> = {
  NEGOTIATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  DEAL: "bg-blue-100 text-[#082352] dark:bg-blue-900/40 dark:text-blue-400",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  EXPIRED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

/** Label & link chat yang aman untuk kedua jenis deal (invitation vs conversation). */
function dealOriginLabel(deal: Deal): string {
  if (deal.conversationId) return `Chat #${deal.conversationId.slice(0, 8)}`;
  if (deal.invitationId) return `Undangan #${deal.invitationId.slice(0, 8)}`;
  return "Deal";
}

function dealChatHref(deal: Deal): string {
  if (deal.conversationId) return `/chat?conversationId=${deal.conversationId}`;
  if (deal.invitationId) return `/chat?opportunityId=${deal.invitationId}`;
  return "/chat";
}

export default function DealsPage() {
  const me = useSessionStore((s) => s.me);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const { data: deals, isLoading, error, refetch, isFetching } = useDeals();
  const updateStatus = useUpdateDealStatus();
  const createReview = useCreateReview();

  // Review modal state
  const [reviewDeal, setReviewDeal] = useState<Deal | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Local optimistic state untuk deal status (sementara menunggu server)
  const [optimisticStatusMap, setOptimisticStatusMap] = useState<Record<string, DealStatus>>({});

  const activeTab = statusFilterTabs[selectedTabIdx];

  const displayedDeals = (deals ?? []).map((deal) => ({
    ...deal,
    status: optimisticStatusMap[deal.id] ?? deal.status,
  }));

  const items = displayedDeals.filter((deal) => {
    if (!activeTab.status) return true;
    if (activeTab.status === "CANCELLED_OR_EXPIRED") {
      return deal.status === "CANCELLED" || deal.status === "EXPIRED";
    }
    return deal.status === activeTab.status;
  });

  async function handleStatusChange(id: string, newStatus: DealStatus) {
    setActionError(null);

    let cancelReason: string | undefined;
    if (newStatus === "CANCELLED") {
      const input = window.prompt("Alasan pembatalan deal (wajib diisi):");
      if (!input || !input.trim()) return; // batal, user tidak isi alasan
      cancelReason = input.trim();
    }

    setOptimisticStatusMap((prev) => ({ ...prev, [id]: newStatus }));

    try {
      await updateStatus.mutateAsync({ id, status: newStatus, cancelReason });
      setOptimisticStatusMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setOptimisticStatusMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setActionError(err instanceof Error ? err.message : "Gagal mengubah status deal");
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewDeal || !me) return;
    setActionError(null);

    const revieweeId = getCounterpartyProfileId(reviewDeal, me.id);
    if (!revieweeId) {
      setActionError("Tidak bisa menentukan pihak yang direview untuk deal ini.");
      return;
    }

    try {
      await createReview.mutateAsync({
        dealId: reviewDeal.id,
        revieweeId,
        rating,
        comment: comment.trim() || undefined,
      });
      setReviewSuccessMsg("Ulasan berhasil dikirim! Terima kasih atas feedback Anda.");
      setReviewDeal(null);
      setComment("");
      setRating(5);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal mengirim ulasan");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
            Pengelolaan Deal
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pantau negosiasi, perkembangan proyek, hingga penyelesaian transaksi dan ulasan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {isFetching ? "Memuat…" : "Refresh"}
        </button>
      </div>

      {reviewSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{reviewSuccessMsg}</span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {statusFilterTabs.map((tab, idx) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setSelectedTabIdx(idx)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedTabIdx === idx
                ? "bg-[#0B2F6E] text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <p className="font-medium">Gagal memuat daftar deal</p>
          <p className="mt-1 text-xs">{error instanceof Error ? error.message : "Terjadi kesalahan"}</p>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <Handshake className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Belum ada deal di kategori ini
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Deal bisa dibuat otomatis saat undangan matching diterima, atau diajukan
            langsung dari halaman Chat.
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="space-y-4">
          {items.map((deal) => {
            const counterpartyName = me ? getCounterpartyName(deal, me.id) : null;
            return (
              <div
                key={deal.id}
                className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      <Handshake className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Deal #{deal.id.slice(0, 8)}
                        {counterpartyName ? ` — dengan ${counterpartyName}` : ""}
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {dealOriginLabel(deal)} · Dibuat: {new Date(deal.createdAt).toLocaleDateString("id-ID")}
                        {deal.agreedAmount
                          ? ` · ${new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: deal.currency || "IDR",
                              maximumFractionDigits: 0,
                            }).format(deal.agreedAmount)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      statusBadgeColor[deal.status] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {deal.status}
                  </span>
                </div>

                {/* Status Workflow Progress Indicator */}
                <div className="my-4 flex items-center justify-between px-2 text-xs text-zinc-500">
                  <span className={deal.status === "NEGOTIATION" ? "font-bold text-[#FF6B00]" : ""}>
                    1. Negosiasi
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
                  <span className={deal.status === "DEAL" ? "font-bold text-[#0B2F6E]" : ""}>
                    2. Kesepakatan
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
                  <span className={deal.status === "IN_PROGRESS" ? "font-bold text-indigo-600" : ""}>
                    3. Pengerjaan
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
                  <span className={deal.status === "COMPLETED" ? "font-bold text-emerald-600" : ""}>
                    4. Selesai
                  </span>
                </div>

                {/* Actions according to state machine */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={dealChatHref(deal)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Buka Chat
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {deal.status === "NEGOTIATION" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(deal.id, "DEAL")}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#0B2F6E] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#082352] disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Sepakati Deal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(deal.id, "CANCELLED")}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-400"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Batalkan
                        </button>
                      </>
                    )}

                    {deal.status === "DEAL" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(deal.id, "IN_PROGRESS")}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Mulai Pengerjaan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(deal.id, "CANCELLED")}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-400"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Batalkan
                        </button>
                      </>
                    )}

                    {deal.status === "IN_PROGRESS" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(deal.id, "COMPLETED")}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Tandai Selesai
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(deal.id, "CANCELLED")}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-400"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Batalkan
                        </button>
                      </>
                    )}

                    {deal.status === "COMPLETED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setReviewDeal(deal)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#FF6B00]"
                        >
                          <Star className="h-3.5 w-3.5" />
                          Beri Ulasan Mitra
                        </button>
                        <Link
                          href={`/business-suite/transaksi?dealId=${deal.id}${
                            deal.agreedAmount ? `&amount=${deal.agreedAmount}` : ""
                          }&notes=${encodeURIComponent(`Dari Deal #${deal.id.slice(0, 8)}`)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          title="Cuma isi otomatis form Business Suite — Anda tetap perlu pilih kontak & produk, lalu konfirmasi manual"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          Catat sebagai Transaksi
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Beri Ulasan Deal #{reviewDeal.id.slice(0, 8)}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Bagikan penilaian pengalaman transaksi dan kolaborasi bisnis Anda.
            </p>

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Rating Bintang (1 - 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-300 dark:text-zinc-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="comment"
                  className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Komentar & Testimoni (opsional)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Pelayanan sangat profesional, pengiriman tepat waktu..."
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewDeal(null)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createReview.isPending}
                  className="rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#082352] disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {createReview.isPending ? "Mengirim…" : "Kirim Ulasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
