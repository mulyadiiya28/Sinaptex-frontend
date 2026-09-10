"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, ChevronLeft, ChevronRight, SlidersHorizontal, X, TrendingUp, Clock, ShieldCheck, MessageSquare } from "lucide-react";
import { useMarketplace } from "@/features/opportunity/opportunity.hooks";
import {
  MarketplaceListParams,
  OpportunityType,
} from "@/features/opportunity/opportunity.schema";
import { MarketplaceGridSkeleton } from "@/components/skeleton";

const TYPE_TABS: { label: string; type?: OpportunityType; count?: number }[] = [
  { label: "Semua" },
  { label: "Need", type: "NEED" },
  { label: "Offer", type: "OFFER" },
];

const SORT_OPTIONS: {
  label: string;
  sortBy: MarketplaceListParams["sortBy"];
  sortOrder: MarketplaceListParams["sortOrder"];
}[] = [
  { label: "Terbaru", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Budget terendah", sortBy: "budgetMin", sortOrder: "asc" },
  { label: "Budget tertinggi", sortBy: "budgetMax", sortOrder: "desc" },
  { label: "Prioritas", sortBy: "priority", sortOrder: "desc" },
];

export default function MarketplacePage() {
  const [typeIdx, setTypeIdx] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [sortIdx, setSortIdx] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 12;

  const params: MarketplaceListParams = useMemo(
    () => ({
      type: TYPE_TABS[typeIdx].type,
      search: search || undefined,
      location: location || undefined,
      sortBy: SORT_OPTIONS[sortIdx].sortBy,
      sortOrder: SORT_OPTIONS[sortIdx].sortOrder,
      page,
      limit,
    }),
    [typeIdx, search, location, sortIdx, page]
  );

  const { data, isLoading, isFetching, error } = useMarketplace(params);
  const items = data?.data ?? [];
  const meta = data?.meta;

  // ✅ UX: Debounced search — apply search saat user stop typing 300ms
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(value.trim());
    }, 300);
    setSearchTimeout(timeout);
  }, [searchTimeout]);

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTimeout) clearTimeout(searchTimeout);
    setPage(1);
    setSearch(searchInput.trim());
  }

  function changeType(idx: number) {
    setTypeIdx(idx);
    setPage(1);
  }

  function clearFilters() {
    setTypeIdx(0);
    setSearchInput("");
    setSearch("");
    setLocation("");
    setSortIdx(0);
    setPage(1);
  }

  const hasActiveFilters = typeIdx !== 0 || search || location || sortIdx !== 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Marketplace
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Jelajahi Need & Offer publik dari pelaku bisnis lain.
          </p>
        </div>
        <Link
          href="/opportunities/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <TrendingUp className="h-4 w-4" />
          Posting Opportunity
        </Link>
      </div>

      {/* Search Bar — Modern pill-style */}
      <form
        onSubmit={applySearch}
        className="relative flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Cari judul, deskripsi, atau tag…"
            className="w-full rounded-xl border-0 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none ring-0 transition focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-900 dark:focus:ring-zinc-700"
          />
        </div>
        <div className="relative sm:w-56">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
            placeholder="Semua lokasi"
            className="w-full rounded-xl border-0 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none ring-0 transition focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-900 dark:focus:ring-zinc-700"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Cari
        </button>
      </form>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type pills */}
          <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {TYPE_TABS.map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => changeType(i)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  typeIdx === i
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
            >
              <X className="h-3 w-3" />
              Reset Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
          <select
            value={sortIdx}
            onChange={(e) => {
              setSortIdx(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border-0 bg-transparent py-2 pr-8 text-sm font-medium text-zinc-600 outline-none dark:text-zinc-300"
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={opt.label} value={i}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results meta + loading indicator */}
      <div className="flex items-center justify-between">
        {meta ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">{meta.total}</span> opportunity ditemukan
            {isFetching && !isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-zinc-400">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-zinc-300 border-t-zinc-600" />
                memperbarui…
              </span>
            )}
          </p>
        ) : (
          <div />
        )}
        {meta && meta.totalPages > 1 && (
          <p className="text-xs text-zinc-400">
            Halaman {page} dari {meta.totalPages}
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && <MarketplaceGridSkeleton count={6} />}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <p className="font-medium text-red-700 dark:text-red-400">Gagal memuat marketplace</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error instanceof Error ? error.message : "Terjadi kesalahan"}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty State — Modern */}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-20 text-center dark:border-zinc-700">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <Search className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Tidak ditemukan
          </h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Coba ubah kata kunci pencarian, lokasi, atau filter tipe opportunity.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Hapus Semua Filter
            </button>
          )}
        </div>
      )}

      {/* Grid — Modern Cards */}
      {!isLoading && items.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((opp) => (
            <li key={opp.id} className="group relative">
              <Link
                href={`/chat?opportunityId=${opp.id}`}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:text-blue-600 dark:bg-zinc-800/95 dark:text-zinc-400 dark:ring-zinc-700"
                title="Chat terkait opportunity ini (perlu login)"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
              <Link
                href={`/marketplace/${opp.id}`}
                className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                {/* Top row: badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      opp.type === "NEED"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                        : "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400"
                    }`}
                  >
                    {opp.type}
                  </span>
                  {opp.priority && opp.priority !== "MEDIUM" && (
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                      {opp.priority}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(opp.createdAt)}
                  </span>
                </div>

                <h2 className="mt-3 line-clamp-2 text-base font-semibold text-zinc-900 transition group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
                  {opp.title}
                </h2>
                <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {opp.description}
                </p>

                {/* Footer info */}
                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  {opp.party && (
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {opp.party.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate font-medium">{opp.party.name}</span>
                      {opp.party.verificationStatus === "APPROVED" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  )}
                  {opp.location && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{opp.location}</span>
                    </div>
                  )}
                  {(opp.budgetMin != null || opp.budgetMax != null) && (
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {formatBudget(opp.budgetMin, opp.budgetMax)}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination — Modern */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </button>

          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {meta.totalPages > 5 && (
              <span className="px-1 text-zinc-400">…</span>
            )}
          </div>

          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Selanjutnya
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
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
  return "";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "baru saja";
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}