"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  PackageCheck,
  PackageX,
  Lock,
} from "lucide-react";
import { useSessionStore } from "@/store/use-session-store";
import {
  useEscrowList,
  useEscrowSellerConfirm,
  useEscrowBuyerConfirm,
  useEscrowRelease,
  useEscrowRefund,
  useEscrowDispute,
} from "@/features/escrow/escrow.hooks";
import { Escrow, EscrowStatus } from "@/features/escrow/escrow.schema";

function formatIdr(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_STYLES: Record<EscrowStatus, string> = {
  PENDING_HOLD: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  HELD: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  SELLER_CONFIRMED: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  BUYER_CONFIRMED: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  RELEASED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  REFUNDED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  DISPUTED: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

const STATUS_LABELS: Record<EscrowStatus, string> = {
  PENDING_HOLD: "Menunggu Hold",
  HELD: "Dana Ditahan",
  SELLER_CONFIRMED: "Seller Konfirmasi Kirim",
  BUYER_CONFIRMED: "Buyer Konfirmasi Terima",
  RELEASED: "Dana Dicairkan",
  REFUNDED: "Dana Dikembalikan",
  DISPUTED: "Dalam Sengketa",
  CANCELLED: "Dibatalkan",
};

export default function EscrowPage() {
  const me = useSessionStore((s) => s.me);
  const { data, isLoading, isError, refetch } = useEscrowList({ limit: 50 });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Escrow</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Dana transaksi antara Buyer dan Seller ditahan di sini sampai barang/jasa
          dikonfirmasi diterima, lalu dicairkan ke Seller. Cuma menampilkan transaksi
          yang melibatkan Party milik kamu.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <span>Gagal memuat daftar Escrow.</span>
          <button onClick={() => refetch()} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      )}

      {!isLoading && !isError && (data?.data?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Lock className="h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Belum ada transaksi Escrow. Escrow dibuat otomatis saat Deal berjalan
            (lihat halaman Deal).
          </p>
        </div>
      )}

      <div className="space-y-3">
        {data?.data?.map((escrow) => (
          <EscrowCard key={escrow.id} escrow={escrow} myProfileId={me?.id} />
        ))}
      </div>
    </div>
  );
}

function EscrowCard({ escrow, myProfileId }: { escrow: Escrow; myProfileId?: string }) {
  const sellerConfirm = useEscrowSellerConfirm();
  const buyerConfirm = useEscrowBuyerConfirm();
  const release = useEscrowRelease();
  const refund = useEscrowRefund();
  const dispute = useEscrowDispute();

  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBuyer = Boolean(myProfileId && escrow.buyerParty?.ownerId === myProfileId);
  const isSeller = Boolean(myProfileId && escrow.sellerParty?.ownerId === myProfileId);

  const canSellerConfirm = isSeller && escrow.status === "HELD";
  const canBuyerConfirm = isBuyer && escrow.status === "SELLER_CONFIRMED";
  // Backend: release HANYA boleh oleh Buyer, dan idealnya setelah BUYER_CONFIRMED.
  const canRelease = isBuyer && escrow.status === "BUYER_CONFIRMED";
  // Backend: refund & dispute boleh Buyer ATAUPUN Seller, selama belum RELEASED/REFUNDED.
  const canActOnOpenEscrow =
    (isBuyer || isSeller) && !["RELEASED", "REFUNDED", "CANCELLED"].includes(escrow.status);

  async function runAction(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aksi gagal diproses.");
    }
  }

  const busy =
    sellerConfirm.isPending ||
    buyerConfirm.isPending ||
    release.isPending ||
    refund.isPending ||
    dispute.isPending;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatIdr(escrow.amount)}
              {escrow.fee ? (
                <span className="ml-1 text-xs font-normal text-zinc-400">
                  (fee {formatIdr(escrow.fee)})
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              {escrow.buyerParty?.name ?? "Buyer"}
              <ArrowRight className="h-3 w-3" />
              {escrow.sellerParty?.name ?? "Seller"}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[escrow.status]}`}
        >
          {STATUS_LABELS[escrow.status]}
        </span>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isBuyer && !isSeller && (
        <p className="mt-3 text-xs text-zinc-400">
          Kamu bukan Buyer atau Seller pada transaksi ini — tidak ada aksi yang bisa dilakukan.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canSellerConfirm && (
          <button
            disabled={busy}
            onClick={() => runAction(() => sellerConfirm.mutateAsync({ id: escrow.id }))}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <PackageCheck className="h-3.5 w-3.5" />
            Konfirmasi Sudah Dikirim
          </button>
        )}

        {canBuyerConfirm && (
          <button
            disabled={busy}
            onClick={() =>
              runAction(() => buyerConfirm.mutateAsync({ id: escrow.id, autoRelease: false }))
            }
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <PackageCheck className="h-3.5 w-3.5" />
            Konfirmasi Sudah Diterima
          </button>
        )}

        {canRelease && (
          <button
            disabled={busy}
            onClick={() => runAction(() => release.mutateAsync({ id: escrow.id }))}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Cairkan Dana ke Seller
          </button>
        )}

        {canActOnOpenEscrow && (
          <button
            disabled={busy}
            onClick={() =>
              runAction(() => refund.mutateAsync({ id: escrow.id, reason: "Mutual cancellation" }))
            }
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PackageX className="h-3.5 w-3.5" />
            Batalkan & Refund
          </button>
        )}

        {canActOnOpenEscrow && !showDisputeForm && (
          <button
            disabled={busy}
            onClick={() => setShowDisputeForm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Ajukan Dispute
          </button>
        )}
      </div>

      {showDisputeForm && (
        <div className="mt-3 space-y-2 rounded-lg border border-red-100 bg-red-50/50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Jelaskan alasan dispute (minimal 5 karakter)..."
            rows={2}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex gap-2">
            <button
              disabled={busy || disputeReason.trim().length < 5}
              onClick={() =>
                runAction(() =>
                  dispute.mutateAsync({ id: escrow.id, disputeReason: disputeReason.trim() })
                ).then(() => setShowDisputeForm(false))
              }
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Kirim Dispute
            </button>
            <button
              onClick={() => setShowDisputeForm(false)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
