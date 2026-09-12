"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useProducts } from "@/features/marketplace/product/product.hooks";
import { ListProductParams, ProductSector } from "@/features/marketplace/product/product.schema";
import { ProductCard } from "@/components/marketplace/product-card";

const SECTOR_TABS: { label: string; sector?: ProductSector }[] = [
  { label: "Semua" },
  { label: "Barang", sector: "GOODS" },
  { label: "Jasa", sector: "SERVICE" },
  { label: "Properti", sector: "PROPERTY" },
];

const SORT_OPTIONS: {
  label: string;
  sortBy: ListProductParams["sortBy"];
  sortOrder: ListProductParams["sortOrder"];
}[] = [
  { label: "Terbaru", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Harga terendah", sortBy: "price", sortOrder: "asc" },
  { label: "Harga tertinggi", sortBy: "price", sortOrder: "desc" },
  { label: "Nama A-Z", sortBy: "name", sortOrder: "asc" },
];

export default function MarketplacePage() {
  const [sectorIdx, setSectorIdx] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortIdx, setSortIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 12;

  const params: Partial<ListProductParams> = useMemo(
    () => ({
      sector: SECTOR_TABS[sectorIdx].sector,
      search: search || undefined,
      minPrice: typeof minPrice === "number" ? minPrice : undefined,
      maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
      sortBy: SORT_OPTIONS[sortIdx].sortBy,
      sortOrder: SORT_OPTIONS[sortIdx].sortOrder,
      page,
      limit,
    }),
    [sectorIdx, search, minPrice, maxPrice, sortIdx, page]
  );

  const { data, isLoading, error } = useProducts(params);
  const products = data?.data ?? [];
  const meta = data?.meta;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSectorIdx(0);
    setSortIdx(0);
    setPage(1);
  };

  const hasActiveFilters =
    search || typeof minPrice === "number" || typeof maxPrice === "number" || sectorIdx !== 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#FF6B00]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
              Marketplace
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B2F6E] sm:text-3xl dark:text-blue-400">
            Katalog Produk & Jasa
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Temukan barang, jasa, dan properti dari vendor terverifikasi
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari produk, jasa, atau properti..."
                className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0B2F6E] focus:ring-2 focus:ring-[#0B2F6E]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#082352]"
            >
              Cari
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                showFilters
                  ? "border-[#0B2F6E] bg-[#0B2F6E] text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-[#FF6B00] px-1.5 text-[10px] text-white">
                  !
                </span>
              )}
            </button>
          </form>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Harga Minimum
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value === "" ? "" : Number(e.target.value));
                    setPage(1);
                  }}
                  placeholder="0"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Harga Maksimum
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value === "" ? "" : Number(e.target.value));
                    setPage(1);
                  }}
                  placeholder="Tidak terbatas"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                  Reset Filter
                </button>
              </div>
            </div>
          )}

          {/* Sector Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {SECTOR_TABS.map((tab, idx) => (
              <button
                key={tab.label}
                onClick={() => {
                  setSectorIdx(idx);
                  setPage(1);
                }}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  sectorIdx === idx
                    ? "bg-[#0B2F6E] text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Sort + Result Info */}
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isLoading
              ? "Memuat produk..."
              : `${meta?.total ?? 0} produk ditemukan`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Urutkan:</span>
            <select
              value={sortIdx}
              onChange={(e) => {
                setSortIdx(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {SORT_OPTIONS.map((opt, idx) => (
                <option key={opt.label} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Gagal memuat produk
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-500">
              {(error as Error)?.message ?? "Coba lagi nanti"}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 dark:border-zinc-700 dark:bg-zinc-900">
            <Package className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Belum ada produk
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && products.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && meta && meta.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </button>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Halaman {meta.page} dari {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Berikutnya
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}