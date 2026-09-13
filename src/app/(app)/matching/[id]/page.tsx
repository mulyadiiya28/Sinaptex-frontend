"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useOpportunity } from "@/features/opportunity/opportunity.hooks";
import { useMatching } from "@/features/matching/matching.hooks";
import { useCreateInvitation } from "@/features/invitation/invitation.hooks";
import { MatchResult } from "@/features/matching/matching.schema";
import { MatchingResultsSkeleton } from "@/components/skeleton";

const INVITED_STORAGE_KEY = "sinaptex_invited_map";

function loadInvitedMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(INVITED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveInvitedMap(map: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INVITED_STORAGE_KEY, JSON.stringify(map));
}

export default function MatchingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: opp, isLoading: isOppLoading } = useOpportunity(id);
  const { data: matches, isLoading: isMatchLoading, error, refetch, isFetching } = useMatching(id);
  const createInvitation = useCreateInvitation();

  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  // ✅ Fix: invitedMap persisten via sessionStorage
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>(loadInvitedMap);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

  // Persist ke sessionStorage setiap berubah
  useEffect(() => {
    saveInvitedMap(invitedMap);
  }, [invitedMap]);

  const isLoading = isOppLoading || isMatchLoading;

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;

    setInviteErrorMsg(null);
    setInviteSuccessMsg(null);

    try {
      await createInvitation.mutateAsync({
        opportunityId: id,
        targetOpportunityId: selectedMatch.opportunityId,
        message: inviteMessage.trim() || undefined,
      });

      setInvitedMap((prev) => {
        const next = { ...prev, [selectedMatch.opportunityId]: true };
        return next;
      });
      setInviteSuccessMsg(
        `Undangan berhasil dikirim ke ${selectedMatch.counterparty.name}!`
      );
      setSelectedMatch(null);
      setInviteMessage("");
    } catch (err) {
      setInviteErrorMsg(
        err instanceof Error ? err.message : "Gagal mengirim undangan"
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href={`/opportunities/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke detail opportunity
        </Link>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {isFetching ? "Mencocokkan ulang…" : "Perbarui Matching"}
        </button>
      </div>

      {/* Opportunity Banner Header */}
      {opp && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                opp.type === "NEED"
                  ? "bg-blue-100 text-[#082352] dark:bg-blue-900/40 dark:text-blue-400"
                  : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
              }`}
            >
              {opp.type}
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {opp.status}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-black text-[#0B2F6E] dark:text-blue-400">
            {opp.title}
          </h1>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {opp.description}
          </p>
        </div>
      )}

      {/* Notification Toast */}
      {inviteSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{inviteSuccessMsg}</span>
        </div>
      )}

      {inviteErrorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{inviteErrorMsg}</span>
        </div>
      )}

      {/* Header section */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Hasil Matching Engine
          </h2>
        </div>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Sistem menganalisis kecocokan kebutuhan, kapabilitas, reputasi, verifikasi, dan performa respon.
        </p>
      </div>

      {isLoading && (
        <MatchingResultsSkeleton count={3} />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="mx-auto mb-2 h-6 w-6" />
          <p className="font-medium">Gagal memuat hasil matching</p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : "Terjadi kesalahan pada server"}
          </p>
        </div>
      )}

      {!isLoading && !error && (!matches || matches.length === 0) && (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Belum ada pasangan bisnis yang cocok
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pastikan deskripsi dan tag opportunity Anda lengkap agar sistem dapat menemukan partner terbaik.
          </p>
          <Link
            href="/marketplace"
            className="mt-4 inline-block rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#082352] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Jelajahi Marketplace Manual
          </Link>
        </div>
      )}

      {!isLoading && matches && matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((item) => {
            // ✅ Fix: Gunakan opportunityId sebagai key, jangan fallback ke index
            const key = item.opportunityId || item.counterparty.partyId;
            const isInvited = invitedMap[item.opportunityId];
            return (
              <div
                key={key}
                className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {item.counterparty.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                          {item.counterparty.name}
                        </h3>
                        <span className="flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          <ShieldCheck className="h-3 w-3" />
                          Partner
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        ID: {item.counterparty.partyId}
                      </p>
                    </div>
                  </div>

                  {/* Scores breakdown */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-zinc-500">Kecocokan:</span>
                      <span className="font-semibold text-[#0B2F6E] dark:text-blue-400">
                        {Math.round(item.matchScore)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-medium text-zinc-500">Ranking Score:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.rankingScore}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full bg-[#0B2F6E] transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, item.matchScore))}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  <Link
                    href={`/chat?opportunityId=${item.opportunityId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3.5 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </Link>

                  {isInvited ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-3.5 py-2 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Undangan Terkirim
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedMatch(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#082352] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Kirim Undangan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invitation Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Kirim Undangan Matching
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Kirim undangan kolaborasi bisnis ke{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {selectedMatch.counterparty.name}
              </strong>
              .
            </p>

            <form onSubmit={handleSendInvitation} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="inviteMessage"
                  className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Pesan Pembuka (opsional)
                </label>
                <textarea
                  id="inviteMessage"
                  rows={3}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Halo, kami tertarik berkolaborasi terkait opportunity ini..."
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createInvitation.isPending}
                  className="rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#082352] disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {createInvitation.isPending ? "Mengirim…" : "Kirim Undangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}