"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Clock, Tag, MapPin } from "lucide-react";
import { useOpportunities } from "@/features/opportunity/opportunity.hooks";
import { OpportunityType, OpportunityStatus } from "@/features/opportunity/opportunity.schema";
import { OpportunitiesListSkeleton } from "@/components/skeleton";

const filters: { label: string; type?: OpportunityType }[] = [
  { label: "Semua" },
  { label: "Need", type: "NEED" },
  { label: "Offer", type: "OFFER" },
];

// ✅ Fix: Type-safe status color mapping
const statusColor: Record<OpportunityStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  CLOSED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  EXPIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  MATCHED: "bg-blue-100 text-[#082352] dark:bg-blue-900/40 dark:text-blue-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default function OpportunitiesPage() {
  const [filterIdx, setFilterIdx] = useState(0);
  const filter = filters[filterIdx];
  const { data, isLoading, error } = useOpportunities({
    type: filter.type,
    limit: 50,
  });

  const items = data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
            Opportunity Saya
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Kelola Need & Offer yang Anda posting. Jelajahi publik di{" "}
            <Link href="/marketplace" className="font-medium underline-offset-2 hover:underline">
              Marketplace
            </Link>
            .
          </p>
        </div>
        <Link
          href="/opportunities/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352] active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Buat Opportunity
        </Link>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {filters.map((f, i) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilterIdx(i)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filterIdx === i
                ? "bg-[#0B2F6E] text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <OpportunitiesListSkeleton count={4} />}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {error instanceof Error ? error.message : "Gagal memuat data"}
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Plus className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="mt-3 font-medium text-zinc-900 dark:text-zinc-50">
            Belum ada opportunity
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Buat Need atau Offer pertama Anda untuk mulai menemukan mitra bisnis.
          </p>
          <Link
            href="/opportunities/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#082352] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Buat Opportunity
          </Link>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((opp) => (
            <li key={opp.id}>
              <Link
                href={`/opportunities/${opp.id}`}
                className="group flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                    <h2 className="mt-2 text-base font-semibold text-zinc-900 transition group-hover:text-[#0B2F6E] dark:text-zinc-50 dark:group-hover:text-blue-400">
                      {opp.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {opp.description}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(opp.createdAt).toLocaleDateString("id-ID")}
                  </time>
                </div>

                {/* Footer meta */}
                <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  {opp.location && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <MapPin className="h-3 w-3" />
                      {opp.location}
                    </span>
                  )}
                  {opp.tags && opp.tags.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <Tag className="h-3 w-3" />
                      {opp.tags.length} tag
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}