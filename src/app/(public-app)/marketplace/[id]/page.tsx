"use client";

import { use } from "react";
import Link from "next/link";
import { MapPin, Building2, ArrowLeft } from "lucide-react";
import { useOpportunity } from "@/features/opportunity/opportunity.hooks";
import { MarketplaceDetailSkeleton } from "@/components/skeleton";

export default function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: opp, isLoading, error } = useOpportunity(id);

  if (isLoading) {
    return <MarketplaceDetailSkeleton />;
  }

  if (error || !opp) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke marketplace
        </Link>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {error instanceof Error ? error.message : "Opportunity tidak ditemukan"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke marketplace
      </Link>

      <article className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
              opp.type === "NEED"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
            }`}
          >
            {opp.type}
          </span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {opp.status}
          </span>
          {opp.priority && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              {opp.priority}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {opp.title}
        </h1>

        {opp.party && (
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Building2 className="h-4 w-4 shrink-0" />
            <span>{opp.party.name}</span>
            {opp.party.verificationStatus === "APPROVED" && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                verified
              </span>
            )}
          </div>
        )}

        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {opp.description}
        </p>

        <dl className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2 dark:border-zinc-800">
          {opp.location && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Lokasi
              </dt>
              <dd className="mt-0.5 flex items-center gap-1 text-sm text-zinc-900 dark:text-zinc-50">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                {opp.location}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Diposting
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
                {formatBudget(opp.budgetMin, opp.budgetMax)}
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
                    className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <Link
            href={`/chat?opportunityId=${opp.id}`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Chat terkait opportunity
          </Link>
          <Link
            href={`/matching/${opp.id}`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Lihat matching
          </Link>
        </div>
      </article>
    </div>
  );
}

function formatBudget(min?: number | null, max?: number | null) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `dari ${fmt(min)}`;
  if (max != null) return `hingga ${fmt(max)}`;
  return "—";
}
