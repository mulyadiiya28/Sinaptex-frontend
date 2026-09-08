"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  MessageSquare,
  Handshake,
  Crown,
  Store,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  TrendingUp,
  ChevronRight,
  Bell,
} from "lucide-react";
import { useSessionStore } from "@/store/use-session-store";
import { useOpportunities } from "@/features/opportunity/opportunity.hooks";
import { useInvitations, useRespondInvitation } from "@/features/invitation/invitation.hooks";
import { useDeals } from "@/features/deal/deal.hooks";
import { DashboardStatsSkeleton, DashboardInvitationsSkeleton } from "@/components/skeleton";

const navItems = [
  {
    href: "/marketplace",
    label: "Marketplace",
    desc: "Jelajahi Need & Offer publik",
    icon: Store,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    borderColor: "group-hover:border-blue-200 dark:group-hover:border-blue-800",
  },
  {
    href: "/opportunities",
    label: "Opportunity Saya",
    desc: "Kelola Need & Offer aktif",
    icon: Briefcase,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
    borderColor: "group-hover:border-violet-200 dark:group-hover:border-violet-800",
  },
  {
    href: "/chat",
    label: "Chat",
    desc: "Percakapan dengan partner",
    icon: MessageSquare,
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    borderColor: "group-hover:border-emerald-200 dark:group-hover:border-emerald-800",
  },
  {
    href: "/deals",
    label: "Deal",
    desc: "Negosiasi hingga selesai",
    icon: Handshake,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    borderColor: "group-hover:border-amber-200 dark:group-hover:border-amber-800",
  },
  {
    href: "/membership",
    label: "Membership",
    desc: "Upgrade kuota & fitur",
    icon: Crown,
    color: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
    borderColor: "group-hover:border-rose-200 dark:group-hover:border-rose-800",
  },
];

export default function DashboardPage() {
  const me = useSessionStore((s) => s.me);
  const { data, isLoading } = useOpportunities({ limit: 50 });
  const { data: invitations, isLoading: isInvLoading } = useInvitations();
  const { data: dealsData } = useDeals();
  const respondInvitation = useRespondInvitation();

  const [invActionError, setInvActionError] = useState<string | null>(null);
  const [invActionSuccess, setInvActionSuccess] = useState<string | null>(null);

  const myOpps = data?.data ?? [];
  const activeCount = myOpps.filter((o) => o.status === "ACTIVE").length;
  const needCount = myOpps.filter((o) => o.type === "NEED" && o.status === "ACTIVE").length;
  const offerCount = myOpps.filter((o) => o.type === "OFFER" && o.status === "ACTIVE").length;

  const pendingInvitations = (invitations ?? []).filter((inv) => inv.status === "PENDING");

  // ✅ UX: Hitung deal stats
  const deals = dealsData ?? [];
  const dealNegotiation = deals.filter((d) => d.status === "NEGOTIATION").length;
  const dealInProgress = deals.filter((d) => d.status === "IN_PROGRESS").length;
  const dealCompleted = deals.filter((d) => d.status === "COMPLETED").length;

  async function handleRespond(id: string, action: "ACCEPTED" | "REJECTED") {
    setInvActionError(null);
    setInvActionSuccess(null);
    try {
      await respondInvitation.mutateAsync({ id, action });
      setInvActionSuccess(
        action === "ACCEPTED"
          ? "Undangan diterima! Deal negosiasi baru telah dibuat."
          : "Undangan telah ditolak."
      );
    } catch (err) {
      setInvActionError(err instanceof Error ? err.message : "Gagal memproses undangan");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Selamat datang kembali
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {me?.fullName ?? "Pengguna Sinaptex"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Ringkasan aktivitas business matching dan transaksi kemitraan Anda.
          </p>
        </div>
        <Link
          href="/opportunities/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Zap className="h-4 w-4" />
          Buat Opportunity
        </Link>
      </div>

      {/* Toast Messages */}
      {invActionSuccess && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="font-medium">{invActionSuccess}</span>
        </div>
      )}

      {invActionError && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <AlertCircle className="h-4 w-4" />
          </div>
          <span className="font-medium">{invActionError}</span>
        </div>
      )}

      {/* Stats Grid — Modern cards with icons */}
      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Opportunity Aktif"
            value={activeCount}
            icon={Briefcase}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-50 dark:bg-blue-950/30"
          />
          <StatCard
            label="Need Aktif"
            value={needCount}
            icon={TrendingUp}
            color="text-violet-600 dark:text-violet-400"
            bg="bg-violet-50 dark:bg-violet-950/30"
          />
          <StatCard
            label="Offer Aktif"
            value={offerCount}
            icon={Store}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-50 dark:bg-emerald-950/30"
          />
          <StatCard
            label="Deal Berjalan"
            value={dealInProgress + dealNegotiation}
            icon={Handshake}
            color="text-amber-600 dark:text-amber-400"
            bg="bg-amber-50 dark:bg-amber-950/30"
          />
        </div>
      )}

      {/* Deal Progress Mini Overview */}
      {!isLoading && deals.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Progres Deal</h3>
            <Link href="/deals" className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Lihat semua →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{dealNegotiation}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Negosiasi</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                <Handshake className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{dealInProgress}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Pengerjaan</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{dealCompleted}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Selesai</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invitations — Modern Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Undangan Matching
                </h2>
                {pendingInvitations.length > 0 && (
                  <span className="flex h-5 items-center justify-center rounded-full bg-blue-600 px-2 text-[10px] font-bold text-white">
                    {pendingInvitations.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Calon mitra yang mengundang Anda untuk berkolaborasi.
              </p>
            </div>
          </div>

          <Link
            href="/deals"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
          >
            Lihat semua deal
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="p-5">
          {isInvLoading ? (
            <DashboardInvitationsSkeleton count={2} />
          ) : pendingInvitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Bell className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Tidak ada undangan tertunda
              </p>
              <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
                Jalankan matching pada opportunity Anda untuk menemukan dan mengundang calon mitra.
              </p>
              <Link
                href="/opportunities"
                className="mt-4 inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Zap className="h-3.5 w-3.5" />
                Jalankan Matching
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-100 p-4 transition hover:border-zinc-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {inv.id.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Undangan #{inv.id.slice(0, 8)}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        Menunggu
                      </span>
                    </div>
                    {inv.message && (
                      <p className="pl-10 text-xs italic text-zinc-500 dark:text-zinc-400">
                        &ldquo;{inv.message}&rdquo;
                      </p>
                    )}
                    <p className="pl-10 text-[11px] text-zinc-400">
                      {new Date(inv.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pl-10 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => handleRespond(inv.id, "ACCEPTED")}
                      disabled={respondInvitation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Terima
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespond(inv.id, "REJECTED")}
                      disabled={respondInvitation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation — Colorful cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Menu Cepat</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 ${item.borderColor}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.label}</h2>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-600" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );
}