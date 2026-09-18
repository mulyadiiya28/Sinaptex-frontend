"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Truck,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useMyParties } from "@/features/party/party.hooks";
import { useContacts } from "@/features/business-suite/contact/contact.hooks";
import { useMyProducts } from "@/features/marketplace/product/product.hooks";
import { useCreateBusinessTransaction } from "@/features/business-suite/businessTransaction/businessTransaction.hooks";
import { TransactionType, CreateTransactionItemInput } from "@/features/business-suite/businessTransaction/businessTransaction.schema";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface LineItem {
  key: string;
  productId: string;
  qty: string;
  unitPrice: string;
}

function emptyLine(): LineItem {
  return { key: Math.random().toString(36).slice(2), productId: "", qty: "1", unitPrice: "" };
}

export default function TransaksiPage() {
  const { data: parties } = useMyParties();
  const primaryParty = parties?.[0];
  const partyId = primaryParty?.id ?? "";

  const [type, setType] = useState<TransactionType>("SALE");
  // SALE -> lawan transaksi biasanya kontak bertipe DEBTOR/CUSTOMER,
  // PURCHASE -> SUPPLIER/CREDITOR. Tapi kita tampilkan semua kontak supaya
  // fleksibel (user yang tahu konteks bisnisnya sendiri).
  const { data: contacts } = useContacts(partyId);
  const { data: productsResult } = useMyProducts();
  const products = productsResult?.data ?? [];

  const [contactId, setContactId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [paidAmount, setPaidAmount] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [dealId, setDealId] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    // Prefill dari tombol "Catat sebagai Transaksi" di halaman Deal — cuma
    // isi otomatis, TIDAK auto-submit. User tetap wajib pilih kontak & item
    // produk sendiri, lalu konfirmasi manual (lihat catatan arsitektur:
    // transaksi Business Suite sengaja tidak dibuat otomatis dari Deal).
    const qDealId = searchParams.get("dealId");
    const qAmount = searchParams.get("amount");
    const qNotes = searchParams.get("notes");
    if (qDealId) setDealId(qDealId);
    if (qAmount) setPaidAmount(qAmount);
    if (qNotes) setNotes(qNotes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createTransaction = useCreateBusinessTransaction(partyId);

  const totalAmount = useMemo(() => {
    return lines.reduce((sum, l) => {
      const qty = Number(l.qty) || 0;
      const price = Number(l.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [lines]);

  function updateLine(key: string, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function handleProductSelect(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateLine(key, {
      productId,
      unitPrice: product ? String(product.price) : "",
    });
  }

  function resetForm() {
    setContactId("");
    setLines([emptyLine()]);
    setPaidAmount("");
    setReferenceNo("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!contactId) {
      setFormError("Pilih kontak (pelanggan/supplier) dulu");
      return;
    }

    const items: CreateTransactionItemInput[] = [];
    for (const l of lines) {
      if (!l.productId) continue;
      const qty = Number(l.qty);
      const unitPrice = Number(l.unitPrice);
      if (!qty || qty <= 0) {
        setFormError("Qty setiap item harus lebih dari 0");
        return;
      }
      if (isNaN(unitPrice) || unitPrice < 0) {
        setFormError("Harga setiap item tidak valid");
        return;
      }
      items.push({ productId: l.productId, qty, unitPrice });
    }
    if (items.length === 0) {
      setFormError("Tambahkan minimal 1 item produk");
      return;
    }

    const paidNum = paidAmount.trim() ? Number(paidAmount) : 0;
    if (isNaN(paidNum) || paidNum < 0) {
      setFormError("Nominal dibayar tidak valid");
      return;
    }

    try {
      await createTransaction.mutateAsync({
        contactId,
        type,
        items,
        paidAmount: paidNum,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
        dealId,
      });
      setSuccessMsg(
        `Transaksi ${type === "SALE" ? "penjualan" : "pembelian"} berhasil dicatat. Persediaan${
          paidNum > 0 ? ", Kas," : ""
        }${paidNum < totalAmount ? ` dan ${type === "SALE" ? "Piutang" : "Hutang"}` : ""} sudah diperbarui.`
      );
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal mencatat transaksi");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/business-suite"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Business Suite
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
          Catat Transaksi
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Satu form ini otomatis memperbarui Persediaan, Piutang/Hutang (kalau
          belum lunas), dan Kas (kalau ada bagian yang dibayar).
        </p>
        <Link
          href="/business-suite/transaksi/riwayat"
          className="mt-2 inline-block text-xs font-semibold text-[#0B2F6E] hover:underline"
        >
          Lihat riwayat transaksi →
        </Link>
      </div>

      {dealId && (
        <div className="rounded-xl bg-blue-50 p-3.5 text-xs text-[#0B2F6E] dark:bg-blue-950/40 dark:text-blue-400">
          Formulir ini diisi otomatis dari Deal #{dealId.slice(0, 8)} — nominal
          & catatan sudah terisi, tapi Anda tetap perlu pilih kontak & item
          produk secara manual sebelum menyimpan.
        </div>
      )}

      {!primaryParty ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Anda belum punya Party (profil bisnis)
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("SALE")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                type === "SALE"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                  : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Penjualan
            </button>
            <button
              type="button"
              onClick={() => setType("PURCHASE")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                type === "PURCHASE"
                  ? "border-orange-500 bg-orange-50 text-[#FF6B00] dark:bg-orange-950/30"
                  : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Truck className="h-4 w-4" />
              Pembelian
            </button>
          </div>

          {/* Contact */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {type === "SALE" ? "Pelanggan" : "Supplier"}
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">— Pilih kontak —</option>
              {(contacts ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {(!contacts || contacts.length === 0) && (
              <p className="mt-1 text-[11px] text-zinc-400">
                Belum ada kontak.{" "}
                <Link href="/business-suite/kontak" className="font-semibold text-[#0B2F6E] underline">
                  Tambah kontak dulu
                </Link>
                .
              </p>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Item</label>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B2F6E] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah baris
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line) => {
                const subtotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
                return (
                  <div key={line.key} className="flex items-center gap-2">
                    <select
                      value={line.productId}
                      onChange={(e) => handleProductSelect(line.key, e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    >
                      <option value="">— Produk —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                      placeholder="Qty"
                      className="w-16 rounded-lg border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                    <input
                      type="number"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                      placeholder="Harga"
                      className="w-28 rounded-lg border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                    <span className="w-24 shrink-0 text-right text-xs text-zinc-500">
                      {formatIDR(subtotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            {products.length === 0 && (
              <p className="mt-1 text-[11px] text-zinc-400">
                Belum ada produk.{" "}
                <Link href="/business-suite/produk" className="font-semibold text-[#0B2F6E] underline">
                  Tambah produk dulu
                </Link>
                .
              </p>
            )}
          </div>

          {/* Total & Paid */}
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {formatIDR(totalAmount)}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Sudah Dibayar (IDR) — kosongkan/0 kalau belum sama sekali
            </label>
            <input
              type="number"
              min={0}
              max={totalAmount || undefined}
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Kurang dari Total → sisanya otomatis tercatat sebagai{" "}
              {type === "SALE" ? "Piutang" : "Hutang"}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                No. Referensi (opsional)
              </label>
              <input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="mis. INV-001"
                className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Catatan (opsional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={createTransaction.isPending}
            className="w-full rounded-xl bg-[#0B2F6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#082352] disabled:opacity-50"
          >
            {createTransaction.isPending ? "Menyimpan…" : "Catat Transaksi"}
          </button>
        </form>
      )}
    </div>
  );
}
