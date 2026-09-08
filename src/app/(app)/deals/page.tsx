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
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useDeals, useUpdateDealStatus } from "@/features/deal/deal.hooks";
import { useCreateReview } from "@/features/review/review.hooks";
import { Deal, DealStatus } from "@/features/deal/deal.schema";
import { useMyParties } from "@/features/party/party.hooks";
import { useInitiateEscrowHold } from "@/features/escrow/escrow.hooks";

// ✅ Fix: Type-safe status badge mapping
const statusFilterTabs: { label: string; status?: DealStatus | "CANCELLED_OR_EXPIRED" }[] = [
  { label: "Semua" },
  { label: "Negosiasi", status: "NEGOTIATION" },
  { label: "Deal", status: "DEAL" },
  { label: "Berjalan", status: "IN_PROGRESS" },
  { label: "Selesai", status: "COMPLETED" },
  { label: "Batal / Expired", status: "CANCELLED_OR_EXPIRED" },
];

// ✅ Fix: Strict typing untuk status badge colors
const statusBadgeColor: Record<DealStatus, string> = {
  NEGOTIATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  DEAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  EXPIRED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function DealsPage() {
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

  // Escrow modal state (trigger manual dari Deal — lihat handleInitiateEscrow)
  const [escrowDeal, setEscrowDeal] = useState<Deal | null>(null);
  const [escrowRole, setEscrowRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [myPartyId, setMyPartyId] = useState("");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("");
  const [escrowNotes, setEscrowNotes] = useState("");
  const [escrowError, setEscrowError] = useState<string | null>(null);
  const [escrowSuccessMsg, setEscrowSuccessMsg] = useState<string | null>(null);
  const { data: myParties } = useMyParties();
  const initiateEscrow = useInitiateEscrowHold();

  function openEscrowModal(deal: Deal) {
    setEscrowDeal(deal);
    setEscrowRole("BUYER");
    setMyPartyId(myParties?.[0]?.id ?? "");
    setCounterpartyId("");
    setEscrowAmount("");
    setEscrowNotes("");
    setEscrowError(null);
  }

  async function handleInitiateEscrow(e: React.FormEvent) {
    e.preventDefault();
    if (!escrowDeal) return;
    setEscrowError(null);

    const amountNum = Number(escrowAmount);
    if (!myPartyId) {
      setEscrowError("Pilih Party kamu terlebih dahulu.");
      return;
    }
    if (!counterpartyId.trim()) {
      setEscrowError("Isi Party ID pihak lawan transaksi.");
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setEscrowError("Jumlah dana harus lebih dari 0.");
      return;
    }

    const buyerPartyId = escrowRole === "BUYER" ? myPartyId : counterpartyId.trim();
    const sellerPartyId = escrowRole === "BUYER" ? counterpartyId.trim() : myPartyId;

    try {
      await initiateEscrow.mutateAsync({
        buyerPartyId,
        sellerPartyId,
        amount: amountNum,
        dealId: escrowDeal.id,
        notes: escrowNotes.trim() || undefined,
      });
      setEscrowSuccessMsg(
        `Escrow untuk Deal #${escrowDeal.id.slice(0, 8)} berhasil dibuat — dana sudah ditahan (HELD). Lihat & kelola di halaman Escrow.`
      );
      setEscrowDeal(null);
    } catch (err) {
      setEscrowError(err instanceof Error ? err.message : "Gagal membuat escrow.");
    }
  }

  // ✅ Fix: Local optimistic state untuk deal status (sementara menunggu server)
  const [optimisticStatusMap, setOptimisticStatusMap] = useState<Record<string, DealStatus>>({});

  const activeTab = statusFilterTabs[selectedTabIdx];

  // ✅ Fix: Apply optimistic status ke data deals
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
    // ✅ Fix: Optimistic update — langsung update UI
    setOptimisticStatusMap((prev) => ({ ...prev, [id]: newStatus }));

    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      // Success: server state akan sync via invalidate
      setOptimisticStatusMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      // ✅ Fix: Rollback optimistic update saat error
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
    if (!reviewDeal) return;
    setActionError(null);

    try {
      await createReview.mutateAsync({
        dealId: reviewDeal.id,
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
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

      {escrowSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>{escrowSuccessMsg}</span>
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
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
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
            Deal dibuat otomatis ketika undangan matching diterima (Accepted).
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="space-y-4">
          {items.map((deal) => (
            <div
              key={deal.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    <Handshake className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Deal #{deal.id.slice(0, 8)}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Undangan #{deal.invitationId.slice(0, 8)} · Dibuat: {new Date(deal.createdAt).toLocaleDateString("id-ID")}
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
                <span className={deal.status === "NEGOTIATION" ? "font-bold text-amber-600" : ""}>
                  1. Negosiasi
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
                <span className={deal.status === "DEAL" ? "font-bold text-blue-600" : ""}>
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
                  {/* ✅ Fix: Link chat dengan opportunityId untuk context spesifik */}
                  <Link
                    href={`/chat?opportunityId=${deal.invitationId}`}
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
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
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
                        onClick={() => openEscrowModal(deal)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-400"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Mulai Escrow
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
                        onClick={() => openEscrowModal(deal)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-400"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Mulai Escrow
                      </button>
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
                    <button
                      type="button"
                      onClick={() => setReviewDeal(deal)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Beri Ulasan Mitra
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
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
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {createReview.isPending ? "Mengirim…" : "Kirim Ulasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escrow Modal — trigger manual POST /escrow/hold terkait Deal ini */}
      {escrowDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Mulai Escrow — Deal #{escrowDeal.id.slice(0, 8)}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Dana akan langsung ditahan (status HELD) begitu escrow dibuat. Pastikan
              Party ID pihak lawan transaksi sudah benar.
            </p>

            <form onSubmit={handleInitiateEscrow} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Peran Party kamu di transaksi ini
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEscrowRole("BUYER")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      escrowRole === "BUYER"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                        : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Buyer (Pembayar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscrowRole("SELLER")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      escrowRole === "SELLER"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                        : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Seller (Penerima)
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Party kamu
                </label>
                <select
                  value={myPartyId}
                  onChange={(e) => setMyPartyId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">— pilih Party —</option>
                  {myParties?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {(myParties?.length ?? 0) === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Kamu belum punya Party. Buat dulu di halaman{" "}
                    <span className="font-semibold">Party Saya</span>.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Party ID lawan transaksi ({escrowRole === "BUYER" ? "Seller" : "Buyer"})
                </label>
                <input
                  value={counterpartyId}
                  onChange={(e) => setCounterpartyId(e.target.value)}
                  placeholder="Tempel Party ID mitra transaksi"
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Jumlah Dana (IDR)
                </label>
                <input
                  type="number"
                  min={1}
                  value={escrowAmount}
                  onChange={(e) => setEscrowAmount(e.target.value)}
                  placeholder="mis. 5000000"
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Catatan (opsional)
                </label>
                <textarea
                  value={escrowNotes}
                  onChange={(e) => setEscrowNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              {escrowError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{escrowError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEscrowDeal(null)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={initiateEscrow.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {initiateEscrow.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Buat Escrow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}