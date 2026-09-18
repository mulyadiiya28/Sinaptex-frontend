"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  X,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { useMyParties } from "@/features/party/party.hooks";
import {
  useCashEntries,
  useAddCashEntry,
  useDeleteCashEntry,
} from "@/features/business-suite/cashbook/cashbook.hooks";
import {
  cashCategoryOptions,
  CashEntryType,
  CashAccountType,
} from "@/features/business-suite/cashbook/cashbook.schema";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function KasPage() {
  const { data: parties, isLoading: isPartiesLoading } = useMyParties();
  const primaryParty = parties?.[0];
  const partyId = primaryParty?.id ?? "";

  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<CashEntryType | "">("");
  const { data, isLoading, error } = useCashEntries(partyId, {
    page,
    limit: 20,
    type: filterType || undefined,
  });
  const addEntry = useAddCashEntry(partyId);
  const deleteEntry = useDeleteCashEntry(partyId);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<CashEntryType>("INCOME");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<string>(cashCategoryOptions[0]);
  const [formAccountType, setFormAccountType] = useState<CashAccountType>("ON_HAND");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setFormType("INCOME");
    setFormAmount("");
    setFormCategory(cashCategoryOptions[0]);
    setFormAccountType("ON_HAND");
    setFormDescription("");
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const amountNum = Number(formAmount);
    if (!amountNum || amountNum <= 0) {
      setFormError("Nominal harus lebih dari 0");
      return;
    }
    try {
      await addEntry.mutateAsync({
        type: formType,
        amount: amountNum,
        category: formCategory,
        accountType: formAccountType,
        description: formDescription.trim() || undefined,
      });
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambah entry kas");
    }
  }

  async function handleDelete(entryId: string) {
    if (!window.confirm("Hapus entry kas ini? Saldo akan disesuaikan otomatis.")) return;
    try {
      await deleteEntry.mutateAsync(entryId);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus entry");
    }
  }

  const summary = data?.meta?.summary;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/business-suite"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Business Suite
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
              Buku Kas
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Catat pemasukan & pengeluaran kas bisnis Anda.
            </p>
          </div>
          {primaryParty && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352]"
            >
              <Plus className="h-4 w-4" />
              Tambah Entry
            </button>
          )}
        </div>
      </div>

      {isPartiesLoading && <p className="text-sm text-zinc-500">Memuat data party…</p>}

      {!isPartiesLoading && !primaryParty && (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <Wallet className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Anda belum punya Party (profil bisnis)
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Buat Party dulu di halaman Profil untuk mulai mencatat kas.
          </p>
        </div>
      )}

      {primaryParty && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Saldo Kas</p>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatIDR(summary?.balance ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Pemasukan</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {formatIDR(summary?.income ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Pengeluaran</p>
              <p className="mt-1 text-xl font-bold text-red-600">{formatIDR(summary?.expense ?? 0)}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {[
              { label: "Semua", value: "" as const },
              { label: "Pemasukan", value: "INCOME" as const },
              { label: "Pengeluaran", value: "EXPENSE" as const },
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setFilterType(f.value);
                  setPage(1);
                }}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                  filterType === f.value
                    ? "bg-[#0B2F6E] text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Entries List */}
          {isLoading && <p className="text-sm text-zinc-500">Memuat entry kas…</p>}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              Gagal memuat data kas: {error instanceof Error ? error.message : "Terjadi kesalahan"}
            </div>
          )}

          {!isLoading && data && data.items.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Belum ada entry kas.
            </p>
          )}

          {!isLoading && data && data.items.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800">
              <table className="w-full text-sm">
                <tbody>
                  {data.items.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              entry.type === "INCOME"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                                : "bg-red-50 text-red-600 dark:bg-red-950/40"
                            }`}
                          >
                            {entry.type === "INCOME" ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-50">
                              {entry.category}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {entry.description || "—"} ·{" "}
                              {new Date(entry.createdAt).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`font-semibold ${
                            entry.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {entry.type === "INCOME" ? "+" : "-"}
                          {formatIDR(entry.amount)}
                        </span>
                      </td>
                      <td className="w-10 p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-zinc-700"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-zinc-500">
                {page} / {data.meta.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-zinc-700"
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Tambah Entry Kas
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="flex gap-2">
                {(["INCOME", "EXPENSE"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormType(t)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      formType === t
                        ? t === "INCOME"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                          : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40"
                        : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {t === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nominal (IDR)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Kategori
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  {cashCategoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Sumber Dana
                </label>
                <div className="flex gap-2">
                  {(["ON_HAND", "BANK"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setFormAccountType(a)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        formAccountType === a
                          ? "border-[#0B2F6E] bg-blue-50 text-[#0B2F6E] dark:bg-blue-950/40"
                          : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {a === "ON_HAND" ? "Kas Tunai" : "Rekening Bank"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Catatan (opsional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {formError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addEntry.isPending}
                  className="rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white hover:bg-[#082352] disabled:opacity-50"
                >
                  {addEntry.isPending ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
