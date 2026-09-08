"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  X,
  Pencil,
  Tag,
  Trash2,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useMyParties,
  useCreateParty,
  useUpdateParty,
  useAddCapability,
  useRemoveCapability,
} from "@/features/party/party.hooks";
import { getCapabilityNames, Party } from "@/features/party/party.schema";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    REJECTED: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${styles[status] ?? styles.PENDING}`}>
      {status}
    </span>
  );
}

export default function PartiesPage() {
  const { data: parties, isLoading, isError, refetch } = useMyParties();
  const createParty = useCreateParty();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [isCompany, setIsCompany] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [npwp, setNpwp] = useState("");
  const [nib, setNib] = useState("");
  const [capabilityInput, setCapabilityInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setIsCompany(false);
    setDescription("");
    setLocation("");
    setNpwp("");
    setNib("");
    setCapabilityInput("");
    setFormError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (name.trim().length < 2) {
      setFormError("Nama Party minimal 2 karakter.");
      return;
    }
    try {
      await createParty.mutateAsync({
        name: name.trim(),
        isCompany,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        npwp: isCompany ? npwp.trim() || undefined : undefined,
        nib: isCompany ? nib.trim() || undefined : undefined,
        capabilityNames: capabilityInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      resetForm();
      setIsCreating(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat Party baru.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Party Saya</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Kelola akun individu maupun perusahaan yang kamu pakai untuk bertransaksi di
            Sinaptex. Satu Profile bisa punya lebih dari satu Party.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Party Baru
          </button>
        )}
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="mb-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Buat Party Baru
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                resetForm();
              }}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Nama Party *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. PT Sinaptex Solusi Digital"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="isCompany"
                type="checkbox"
                checked={isCompany}
                onChange={(e) => setIsCompany(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <label htmlFor="isCompany" className="text-sm text-zinc-700 dark:text-zinc-300">
                Ini akun perusahaan (bukan individu)
              </label>
            </div>

            {isCompany && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    NPWP
                  </label>
                  <input
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    NIB
                  </label>
                  <input
                    value={nib}
                    onChange={(e) => setNib(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Lokasi
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="mis. Jakarta Selatan"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Capability (pisahkan koma)
              </label>
              <input
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                placeholder="mis. Manufaktur, Logistik, Ekspor"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createParty.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {createParty.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Party
          </button>
        </form>
      )}

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <span>Gagal memuat daftar Party.</span>
          <button onClick={() => refetch()} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      )}

      {!isLoading && !isError && (parties?.length ?? 0) === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Building2 className="h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Kamu belum punya Party. Buat satu untuk mulai posting Opportunity atau produk.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {parties?.map((party) => (
          <PartyCard key={party.id} party={party} />
        ))}
      </div>
    </div>
  );
}

function PartyCard({ party }: { party: Party }) {
  const updateParty = useUpdateParty();
  const addCapability = useAddCapability();
  const removeCapability = useRemoveCapability();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(party.name);
  const [description, setDescription] = useState(party.description ?? "");
  const [location, setLocation] = useState(party.location ?? "");
  const [newCapability, setNewCapability] = useState("");
  const [error, setError] = useState<string | null>(null);

  const capabilityNames = getCapabilityNames(party);

  async function handleSave() {
    setError(null);
    try {
      await updateParty.mutateAsync({
        id: party.id,
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
        },
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    }
  }

  async function handleAddCapability() {
    const trimmed = newCapability.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await addCapability.mutateAsync({ partyId: party.id, name: trimmed });
      setNewCapability("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah capability.");
    }
  }

  async function handleRemoveCapability(capabilityId: string) {
    setError(null);
    try {
      await removeCapability.mutateAsync({ partyId: party.id, capabilityId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus capability.");
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            {isEditing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-zinc-300 px-2 py-1 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-950"
              />
            ) : (
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {party.name}
              </p>
            )}
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {party.isCompany ? "Perusahaan" : "Individu"}
              {party.category?.name ? ` · ${party.category.name}` : ""}
              {party.location ? ` · ${party.location}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {party.verifications?.map((v) => (
            <span key={v.id} className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
              <StatusBadge status={v.status} />
            </span>
          ))}
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={updateParty.isPending}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Deskripsi"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lokasi"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateParty.isPending}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Simpan
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        party.description && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{party.description}</p>
        )
      )}

      <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Tag className="h-3.5 w-3.5" />
          Capability
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {party.capabilities?.map((link) => (
            <span
              key={link.capability.id}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {link.capability.name}
              <button
                onClick={() => handleRemoveCapability(link.capability.id)}
                disabled={removeCapability.isPending}
                className="text-zinc-400 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
          {capabilityNames.length === 0 && (
            <span className="text-xs text-zinc-400">Belum ada capability.</span>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newCapability}
            onChange={(e) => setNewCapability(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCapability())}
            placeholder="Tambah capability baru"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            onClick={handleAddCapability}
            disabled={addCapability.isPending}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {addCapability.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}
