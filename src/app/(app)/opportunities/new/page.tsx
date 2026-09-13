"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateOpportunity } from "@/features/opportunity/opportunity.hooks";
import {
  CreateOpportunityInput,
  OpportunityType,
  createOpportunitySchema,
} from "@/features/opportunity/opportunity.schema";
import { TagInput } from "@/components/tag-input";

// ✅ Fix: Kategori dari backend (placeholder — ganti dengan useCategories hook)
const CATEGORY_OPTIONS = [
  { value: "general", label: "Umum" },
  { value: "manufacturing", label: "Manufaktur" },
  { value: "logistics", label: "Logistik & Supply Chain" },
  { value: "technology", label: "Teknologi & IT" },
  { value: "agriculture", label: "Pertanian & Pangan" },
  { value: "construction", label: "Konstruksi & Properti" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "finance", label: "Keuangan & Fintech" },
  { value: "healthcare", label: "Kesehatan & Farmasi" },
  { value: "energy", label: "Energi & Utilitas" },
];

export default function NewOpportunityPage() {
  const router = useRouter();
  const create = useCreateOpportunity();
  const [type, setType] = useState<OpportunityType>("NEED");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("general");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ✅ Fix: Validasi budget helper
  function validateBudget(min: string, max: string): string | null {
    const minNum = min ? Number(min) : undefined;
    const maxNum = max ? Number(max) : undefined;

    if (minNum !== undefined) {
      if (isNaN(minNum) || minNum < 0) return "Budget minimum tidak valid (harus ≥ 0)";
      if (!Number.isInteger(minNum)) return "Budget minimum harus berupa angka bulat";
    }
    if (maxNum !== undefined) {
      if (isNaN(maxNum) || maxNum < 0) return "Budget maksimum tidak valid (harus ≥ 0)";
      if (!Number.isInteger(maxNum)) return "Budget maksimum harus berupa angka bulat";
    }
    if (minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
      return "Budget minimum tidak boleh lebih besar dari maksimum";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // ✅ Fix: Validasi budget sebelum parse
    const budgetError = validateBudget(budgetMin, budgetMax);
    if (budgetError) {
      setFieldErrors({ budget: budgetError });
      return;
    }

    const minNum = budgetMin ? Number(budgetMin) : undefined;
    const maxNum = budgetMax ? Number(budgetMax) : undefined;

    const payload: CreateOpportunityInput = {
      type,
      title,
      description,
      categoryId,
      location: location || undefined,
      tags: tags.length > 0 ? tags : undefined,
      budgetMin: minNum,
      budgetMax: maxNum,
    };

    const parsed = createOpportunitySchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() ?? "form";
        errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    try {
      const opp = await create.mutateAsync(parsed.data);
      router.replace(`/opportunities/${opp.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat opportunity");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/opportunities"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Kembali
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
          Buat Opportunity
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Posting Need (mencari) atau Offer (menawarkan).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tipe
          </label>
          <div className="flex gap-2">
            {(["NEED", "OFFER"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  type === t
                    ? "border-[#0B2F6E] bg-[#0B2F6E] text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {t === "NEED" ? "Need (mencari)" : "Offer (menawarkan)"}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Judul
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
            placeholder="Contoh: Butuh supplier kemasan biodegradable"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Deskripsi
          </label>
          <textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
            placeholder="Jelaskan kebutuhan atau penawaran Anda secara detail…"
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
          )}
        </div>

        {/* Category — ✅ Fix: Dropdown select, bukan free-text */}
        <div>
          <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Kategori
          </label>
          <select
            id="categoryId"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.categoryId}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Lokasi <span className="font-normal text-zinc-400">(opsional)</span>
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
            placeholder="Jakarta, Indonesia"
          />
        </div>

        {/* Tags — ✅ Fix: Gunakan TagInput component */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tag <span className="font-normal text-zinc-400">(opsional)</span>
          </label>
          <TagInput
            tags={tags}
            onChange={setTags}
            placeholder="Tambah tag dan tekan Enter…"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Tag membantu sistem matching menemukan partner yang relevan.
          </p>
        </div>

        {/* Budget — ✅ Fix: Validasi range dan numeric */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Rentang Budget <span className="font-normal text-zinc-400">(opsional)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="Minimum"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
            />
            <span className="text-sm text-zinc-400">—</span>
            <input
              type="number"
              min={0}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="Maksimum"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-100"
            />
          </div>
          {fieldErrors.budget && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.budget}</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={create.isPending}
            className="flex-1 rounded-lg bg-[#0B2F6E] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352] disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {create.isPending ? "Menyimpan…" : "Publikasikan"}
          </button>
          <Link
            href="/opportunities"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}