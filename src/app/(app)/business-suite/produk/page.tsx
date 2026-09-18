"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMyParties } from "@/features/party/party.hooks";
import {
  useMyProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/features/marketplace/product/product.hooks";
import { Product } from "@/features/marketplace/product/product.schema";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ProductForm {
  name: string;
  price: string;
  stock: string;
  baseUnit: string;
  sector: "GOODS" | "SERVICE" | "PROPERTY";
  isListedInMarketplace: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  price: "",
  stock: "0",
  baseUnit: "PCS",
  sector: "GOODS",
  isListedInMarketplace: true,
};

export default function ProdukPage() {
  const { data: parties } = useMyParties();
  const primaryParty = parties?.[0];

  const { data, isLoading, error } = useMyProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      baseUnit: p.baseUnit,
      sector: p.sector,
      isListedInMarketplace: p.isListedInMarketplace,
    });
    setEditingId(p.id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Nama produk wajib diisi");
      return;
    }
    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Harga tidak valid");
      return;
    }

    try {
      if (editingId) {
        await updateProduct.mutateAsync({
          id: editingId,
          input: {
            name: form.name.trim(),
            price: priceNum,
            stock: stockNum,
            baseUnit: form.baseUnit,
            isListedInMarketplace: form.isListedInMarketplace,
          },
        });
      } else {
        if (!primaryParty) return;
        await createProduct.mutateAsync({
          partyId: primaryParty.id,
          name: form.name.trim(),
          price: priceNum,
          stock: stockNum,
          baseUnit: form.baseUnit,
          sector: form.sector,
          isListedInMarketplace: form.isListedInMarketplace,
        });
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan produk");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus produk ini? Riwayat transaksi terkait tetap tersimpan.")) return;
    try {
      await deleteProduct.mutateAsync(id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus produk");
    }
  }

  const isSaving = createProduct.isPending || updateProduct.isPending;
  const products = data?.data ?? [];

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
              Produk / Barang
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Katalog produk Anda — bisa dijual di Marketplace publik, atau
              dipakai internal saja (mis. bahan baku) untuk pencatatan
              Persediaan & transaksi.
            </p>
          </div>
          {primaryParty && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352]"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
          )}
        </div>
      </div>

      {!primaryParty ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Anda belum punya Party (profil bisnis)
          </p>
        </div>
      ) : (
        <>
          {isLoading && <p className="text-sm text-zinc-500">Memuat produk…</p>}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              Gagal memuat produk.
            </div>
          )}
          {!isLoading && products.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Belum ada produk. Klik "Tambah Produk" untuk mulai.
            </p>
          )}

          {!isLoading && products.length > 0 && (
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B2F6E] dark:bg-blue-950/40 dark:text-blue-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-50">
                      {p.name}
                      {p.isListedInMarketplace ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          <Eye className="h-2.5 w-2.5" />
                          Marketplace
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          <EyeOff className="h-2.5 w-2.5" />
                          Internal saja
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatIDR(p.price)} / {p.baseUnit} · Stok: {p.stock}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {editingId ? "Edit Produk" : "Tambah Produk"}
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
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nama Produk
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Sektor
                  </label>
                  <select
                    value={form.sector}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sector: e.target.value as ProductForm["sector"] }))
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="GOODS">Barang</option>
                    <option value="SERVICE">Jasa</option>
                    <option value="PROPERTY">Properti</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Harga (IDR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    disabled={Boolean(editingId)}
                    className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>
              {editingId && (
                <p className="-mt-2 text-[11px] text-zinc-400">
                  Stok cuma bisa diubah lewat Persediaan/Catat Transaksi, bukan di sini.
                </p>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Satuan
                </label>
                <input
                  value={form.baseUnit}
                  onChange={(e) => setForm((f) => ({ ...f, baseUnit: e.target.value }))}
                  placeholder="PCS, KG, GRAM, dst."
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <label className="flex items-center gap-2.5 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <input
                  type="checkbox"
                  checked={form.isListedInMarketplace}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isListedInMarketplace: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-[#0B2F6E]"
                />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                  Tampilkan di Marketplace publik (matikan kalau ini item
                  internal saja, mis. bahan baku)
                </span>
              </label>

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
                  disabled={isSaving}
                  className="rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white hover:bg-[#082352] disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
