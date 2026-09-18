"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useMyParties } from "@/features/party/party.hooks";
import { useContacts } from "@/features/business-suite/contact/contact.hooks";
import { ContactType } from "@/features/business-suite/contact/contact.schema";
import { CreateLedgerEntryInput } from "@/features/business-suite/ledger.schema";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface LedgerHooks {
  useLedgerEntries: (
    partyId: string,
    contactId: string,
    page?: number
  ) => {
    data?: {
      card: { currentBalance: number; totalDebit: number; totalCredit: number } | null;
      entries: { id: string; date: string; description: string; debit: number; credit: number; balance: number }[];
    };
    isLoading: boolean;
  };
  useAddLedgerEntry: (
    partyId: string,
    contactId: string
  ) => {
    mutateAsync: (input: CreateLedgerEntryInput) => Promise<unknown>;
    isPending: boolean;
  };
}

export function LedgerCardPageContent({
  title,
  description,
  contactType,
  debitLabel,
  creditLabel,
  balanceLabel,
  hooks,
}: {
  title: string;
  description: string;
  contactType: ContactType;
  debitLabel: string;
  creditLabel: string;
  balanceLabel: string;
  hooks: LedgerHooks;
}) {
  const { data: parties } = useMyParties();
  const primaryParty = parties?.[0];
  const partyId = primaryParty?.id ?? "";

  const { data: contacts, isLoading: isContactsLoading } = useContacts(partyId, contactType);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>

      {!primaryParty ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Anda belum punya Party (profil bisnis)
          </p>
        </div>
      ) : isContactsLoading ? (
        <p className="text-sm text-zinc-500">Memuat kontak…</p>
      ) : !contacts || contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Belum ada kontak bertipe ini
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tambahkan kontak dulu di halaman{" "}
            <Link href="/business-suite/kontak" className="font-semibold text-[#0B2F6E] underline">
              Kontak
            </Link>
            , baru catat transaksinya di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <LedgerContactRow
              key={c.id}
              partyId={partyId}
              contact={c}
              isExpanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              debitLabel={debitLabel}
              creditLabel={creditLabel}
              balanceLabel={balanceLabel}
              hooks={hooks}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LedgerContactRow({
  partyId,
  contact,
  isExpanded,
  onToggle,
  debitLabel,
  creditLabel,
  balanceLabel,
  hooks,
}: {
  partyId: string;
  contact: { id: string; name: string; phone?: string | null };
  isExpanded: boolean;
  onToggle: () => void;
  debitLabel: string;
  creditLabel: string;
  balanceLabel: string;
  hooks: LedgerHooks;
}) {
  const { data, isLoading } = hooks.useLedgerEntries(partyId, contact.id, 1);
  const addEntry = hooks.useAddLedgerEntry(partyId, contact.id);

  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [refNo, setRefNo] = useState("");
  const [amount, setAmount] = useState("");
  const [entryKind, setEntryKind] = useState<"debit" | "credit">("debit");
  const [formError, setFormError] = useState<string | null>(null);

  const balance = data?.card?.currentBalance ?? 0;

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const amountNum = Number(amount);
    if (!desc.trim()) {
      setFormError("Keterangan wajib diisi");
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setFormError("Nominal harus lebih dari 0");
      return;
    }
    try {
      await addEntry.mutateAsync({
        description: desc.trim(),
        referenceNo: refNo.trim() || undefined,
        debit: entryKind === "debit" ? amountNum : undefined,
        credit: entryKind === "credit" ? amountNum : undefined,
      });
      setDesc("");
      setRefNo("");
      setAmount("");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambah transaksi");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{contact.name}</p>
          {contact.phone && <p className="text-xs text-zinc-500 dark:text-zinc-400">{contact.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{balanceLabel}</p>
          <p
            className={`font-semibold ${balance > 0 ? "text-red-600" : "text-zinc-900 dark:text-zinc-50"}`}
          >
            {formatIDR(balance)}
          </p>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Riwayat Transaksi
            </p>
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0B2F6E] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#082352]"
            >
              <Plus className="h-3 w-3" />
              Tambah Transaksi
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleAddEntry}
              className="mt-3 space-y-3 rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50"
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEntryKind("debit")}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    entryKind === "debit"
                      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40"
                      : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {debitLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setEntryKind("credit")}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    entryKind === "credit"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                      : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {creditLabel}
                </button>
              </div>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Keterangan (mis. Invoice #001)"
                className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <div className="flex gap-2">
                <input
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  placeholder="No. Referensi (opsional)"
                  className="flex-1 rounded-lg border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Nominal"
                  className="w-32 rounded-lg border border-zinc-300 bg-white p-2 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
              {formError && (
                <div className="flex items-start gap-1.5 rounded-lg bg-red-50 p-2 text-[11px] text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addEntry.isPending}
                  className="rounded-lg bg-[#0B2F6E] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#082352] disabled:opacity-50"
                >
                  {addEntry.isPending ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          )}

          {isLoading && <p className="mt-3 text-xs text-zinc-500">Memuat riwayat…</p>}
          {!isLoading && data?.entries.length === 0 && (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Belum ada transaksi.</p>
          )}
          {!isLoading && data && data.entries.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {data.entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div>
                    <p className="text-zinc-700 dark:text-zinc-300">{e.description}</p>
                    <p className="text-[11px] text-zinc-400">
                      {new Date(e.date).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${e.debit > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {e.debit > 0 ? "+" : "-"}
                    {formatIDR(e.debit > 0 ? e.debit : e.credit)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
