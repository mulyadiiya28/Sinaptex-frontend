"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus, Pencil, Trash2, X, AlertCircle, ChevronLeft } from "lucide-react";
import { useMyParties } from "@/features/party/party.hooks";
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@/features/business-suite/contact/contact.hooks";
import {
  ContactType,
  contactTypeLabels,
  CreateContactInput,
} from "@/features/business-suite/contact/contact.schema";

const typeFilters: { label: string; value: ContactType | "" }[] = [
  { label: "Semua", value: "" },
  { label: "Pelanggan", value: "CUSTOMER" },
  { label: "Supplier", value: "SUPPLIER" },
  { label: "Debitur", value: "DEBTOR" },
  { label: "Kreditur", value: "CREDITOR" },
  { label: "Anggota", value: "MEMBER" },
];

const emptyForm: CreateContactInput = { type: "CUSTOMER", name: "" };

export default function KontakPage() {
  const { data: parties } = useMyParties();
  const primaryParty = parties?.[0];
  const partyId = primaryParty?.id ?? "";

  const [filterType, setFilterType] = useState<ContactType | "">("");
  const { data: contacts, isLoading, error } = useContacts(partyId, filterType || undefined);
  const createContact = useCreateContact(partyId);
  const updateContact = useUpdateContact(partyId);
  const deleteContact = useDeleteContact(partyId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateContactInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(contact: {
    id: string;
    type: ContactType;
    name: string;
    email?: string | null;
    phone?: string | null;
  }) {
    setForm({
      type: contact.type,
      name: contact.name,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
    });
    setEditingId(contact.id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError("Nama wajib diisi");
      return;
    }
    try {
      if (editingId) {
        await updateContact.mutateAsync({ contactId: editingId, input: form });
      } else {
        await createContact.mutateAsync(form);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan kontak");
    }
  }

  async function handleDelete(contactId: string) {
    if (!window.confirm("Hapus kontak ini? Riwayat piutang/hutang terkait juga akan terhapus.")) return;
    try {
      await deleteContact.mutateAsync(contactId);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus kontak");
    }
  }

  const isSaving = createContact.isPending || updateContact.isPending;

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
              Kontak
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Pelanggan, supplier, debitur, kreditur, dan anggota koperasi.
            </p>
          </div>
          {primaryParty && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352]"
            >
              <Plus className="h-4 w-4" />
              Tambah Kontak
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
          <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {typeFilters.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFilterType(f.value)}
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

          {isLoading && <p className="text-sm text-zinc-500">Memuat kontak…</p>}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              Gagal memuat kontak.
            </div>
          )}
          {!isLoading && contacts && contacts.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Belum ada kontak. Klik "Tambah Kontak" untuk mulai.
            </p>
          )}

          {!isLoading && contacts && contacts.length > 0 && (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B2F6E] dark:bg-blue-950/40 dark:text-blue-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{c.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {contactTypeLabels[c.type]}
                      {c.phone ? ` · ${c.phone}` : ""}
                      {c.email ? ` · ${c.email}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
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
                {editingId ? "Edit Kontak" : "Tambah Kontak"}
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
                  Tipe Kontak
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContactType }))}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  {Object.entries(contactTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nama
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Telepon
                  </label>
                  <input
                    value={form.phone ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </label>
                  <input
                    value={form.email ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
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
