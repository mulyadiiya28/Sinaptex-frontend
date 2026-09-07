"use client";

import Link from "next/link";
import { GitCompareArrows, Briefcase, ArrowRight, Plus } from "lucide-react";
import { useOpportunities } from "@/features/opportunity/opportunity.hooks";
import { OpportunitiesListSkeleton } from "@/components/skeleton";

export default function MatchingIndexPage() {
  const { data, isLoading, error } = useOpportunities({ limit: 50, status: "ACTIVE" });
  const items = (data?.data ?? []).filter((o) => o.status === "ACTIVE");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B2F6E]">
          Business Matching
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pilih opportunity aktif untuk menjalankan matching engine dan temukan calon mitra.
        </p>
      </div>

      {isLoading && <OpportunitiesListSkeleton count={3} />}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : "Gagal memuat opportunity"}
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <GitCompareArrows className="h-6 w-6 text-[#0B2F6E]" />
          </div>
          <p className="mt-3 font-medium text-slate-900">Belum ada opportunity aktif</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Buat Need atau Offer terlebih dahulu, lalu jalankan matching dari sini.
          </p>
          <Link
            href="/opportunities/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#082352]"
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
                href={`/matching/${opp.id}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0B2F6E]/30 hover:shadow-md"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B2F6E]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase ${
                          opp.type === "NEED"
                            ? "bg-[#FF6B00]/10 text-[#FF6B00]"
                            : "bg-[#0B2F6E]/10 text-[#0B2F6E]"
                        }`}
                      >
                        {opp.type}
                      </span>
                      <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {opp.status}
                      </span>
                    </div>
                    <h2 className="mt-1 truncate text-base font-semibold text-slate-900 group-hover:text-[#0B2F6E]">
                      {opp.title}
                    </h2>
                    {opp.description && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{opp.description}</p>
                    )}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-[#0B2F6E] transition group-hover:bg-[#0B2F6E] group-hover:text-white">
                  Jalankan
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
