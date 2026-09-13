"use client";

import { useState } from "react";
import {
  User,
  ShieldCheck,
  FileCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  Pencil,
  X,
  Mail,
  Phone,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useSessionStore } from "@/store/use-session-store";
import { useProfile, useUpdateProfile } from "@/features/profile/profile.hooks";
import { useMyVerifications, useSubmitVerification } from "@/features/verification/verification.hooks";
import { PushNotificationSettings } from "@/components/push-notification-settings";

// Profile completion steps
interface ProfileCheck {
  key: string;
  label: string;
  check: (me: { fullName?: string | null; phone?: string | null; isVerified?: boolean } | null) => boolean;
}

const PROFILE_STEPS: ProfileCheck[] = [
  { key: "name", label: "Nama Lengkap", check: (me) => !!me?.fullName },
  { key: "phone", label: "Nomor Telepon", check: (me) => !!me?.phone },
  { key: "verified", label: "Verifikasi Legal", check: (me) => !!me?.isVerified },
];

export default function ProfilePage() {
  const me = useSessionStore((s) => s.me);
  const { refetch: refetchProfile } = useProfile();
  const updateProfile = useUpdateProfile();

  const { data: verifications, isLoading: isVerifLoading } = useMyVerifications();
  const submitVerification = useSubmitVerification();

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Verification form state
  const [documentType, setDocumentType] = useState("NIB / SIUP");
  const [documentUrl, setDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [verifSuccessMsg, setVerifSuccessMsg] = useState<string | null>(null);
  const [verifErrorMsg, setVerifErrorMsg] = useState<string | null>(null);

  // ✅ UX: Profile completion progress
  const completedSteps = PROFILE_STEPS.filter((s) => s.check(me)).length;
  const progressPercent = Math.round((completedSteps / PROFILE_STEPS.length) * 100);

  function handleStartEdit() {
    setFullName(me?.fullName ?? "");
    setPhone(me?.phone ?? "");
    setIsEditing(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setProfileSuccessMsg("Profil berhasil diperbarui!");
      setIsEditing(false);
      refetchProfile();
    } catch (err) {
      setProfileErrorMsg(err instanceof Error ? err.message : "Gagal memperbarui profil");
    }
  }

  async function handleSubmitVerification(e: React.FormEvent) {
    e.preventDefault();
    setVerifErrorMsg(null);
    setVerifSuccessMsg(null);

    if (!documentUrl.startsWith("http://") && !documentUrl.startsWith("https://")) {
      setVerifErrorMsg("URL dokumen harus diawali http:// atau https://");
      return;
    }

    try {
      await submitVerification.mutateAsync({
        documentType,
        documentUrl,
        notes: notes.trim() || undefined,
      });
      setVerifSuccessMsg("Dokumen legal berhasil diajukan untuk verifikasi!");
      setDocumentUrl("");
      setNotes("");
    } catch (err) {
      setVerifErrorMsg(err instanceof Error ? err.message : "Gagal mengajukan verifikasi");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
          Profil & Pengaturan
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Kelola data akun, verifikasi legal, dan preferensi notifikasi.
        </p>
      </div>

      {/* Toast Messages */}
      {profileSuccessMsg && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-medium">{profileSuccessMsg}</span>
        </div>
      )}
      {profileErrorMsg && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-medium">{profileErrorMsg}</span>
        </div>
      )}

      {/* Profile Hero Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Cover / Header */}
        <div className="h-24 bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900" />

        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-10 left-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-zinc-100 text-2xl font-bold text-zinc-700 shadow-sm dark:border-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
              {me?.fullName ? me.fullName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-14">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {me?.fullName ?? "Pengguna Sinaptex"}
                  </h2>
                  {me?.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Terverifikasi
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{me?.email}</p>
              </div>
              <button
                type="button"
                onClick={isEditing ? () => setIsEditing(false) : handleStartEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {isEditing ? "Batal" : "Edit Profil"}
              </button>
            </div>

            {/* Profile Completion Progress */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Kelengkapan Profil</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{progressPercent}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#0B2F6E] transition-all duration-500 dark:bg-zinc-50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PROFILE_STEPS.map((step) => {
                  const isDone = step.check(me);
                  return (
                    <span
                      key={step.key}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isDone
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {step.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Edit Profil</h3>
          <form onSubmit={handleSaveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullNameInput" className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nama Lengkap
              </label>
              <input
                id="fullNameInput"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-[#0B2F6E] dark:focus:ring-zinc-700"
              />
            </div>
            <div>
              <label htmlFor="phoneInput" className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nomor Telepon
              </label>
              <input
                id="phoneInput"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-[#0B2F6E] dark:focus:ring-zinc-700"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#082352] disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {updateProfile.isPending ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Details Grid */}
      {!isEditing && (
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailCard
            icon={User}
            label="Nama Lengkap"
            value={me?.fullName ?? "Belum diisi"}
            color="text-[#0B2F6E] dark:text-blue-400"
            bg="bg-blue-50 dark:bg-blue-950/20"
          />
          <DetailCard
            icon={Mail}
            label="Email"
            value={me?.email ?? "—"}
            color="text-violet-600 dark:text-violet-400"
            bg="bg-violet-50 dark:bg-violet-950/20"
          />
          <DetailCard
            icon={Phone}
            label="Nomor Telepon"
            value={me?.phone || "Belum ditambahkan"}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-50 dark:bg-emerald-950/20"
          />
          <DetailCard
            icon={ShieldCheck}
            label="Status Verifikasi"
            value={me?.isVerified ? "Terverifikasi Resmi" : "Belum diverifikasi"}
            color={me?.isVerified ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}
            bg={me?.isVerified ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-zinc-50 dark:bg-zinc-800/50"}
          />
        </div>
      )}

      {/* Legal Verification Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
            <FileCheck className="h-4 w-4 text-[#0B2F6E] dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Verifikasi Legal Bisnis</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Dokumen NIB, SIUP, atau Akta untuk badge terverifikasi.
            </p>
          </div>
        </div>

        {verifSuccessMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-medium">{verifSuccessMsg}</span>
          </div>
        )}
        {verifErrorMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{verifErrorMsg}</span>
          </div>
        )}

        {/* Submit Form */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ajukan Verifikasi Baru</h3>
          <form onSubmit={handleSubmitVerification} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="docType" className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Jenis Dokumen
                </label>
                <select
                  id="docType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-[#0B2F6E] dark:focus:ring-zinc-700"
                >
                  <option value="NIB / SIUP">NIB (Nomor Induk Berusaha) / SIUP</option>
                  <option value="NPWP Badan">NPWP Badan Usaha</option>
                  <option value="Akta Perusahaan">Akta Notaris / SK Kemenkumham</option>
                  <option value="KTP Pemilik">KTP Pemilik Bisnis</option>
                </select>
              </div>
              <div>
                <label htmlFor="docUrl" className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  URL Dokumen
                </label>
                <input
                  id="docUrl"
                  type="url"
                  required
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://storage.googleapis.com/..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-[#0B2F6E] dark:focus:ring-zinc-700"
                />
              </div>
            </div>
            <div>
              <label htmlFor="verifNotes" className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Catatan Tambahan (opsional)
              </label>
              <textarea
                id="verifNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Dokumen NIB diterbitkan tahun 2024..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-[#0B2F6E] dark:focus:ring-zinc-700"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitVerification.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#082352] disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Upload className="h-4 w-4" />
                {submitVerification.isPending ? "Mengajukan…" : "Ajukan Verifikasi"}
              </button>
            </div>
          </form>
        </div>

        {/* History Timeline */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Riwayat Verifikasi</h3>
          {isVerifLoading && (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
            </div>
          )}
          {!isVerifLoading && (!verifications || verifications.length === 0) && (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
              <FileCheck className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Belum ada riwayat pengajuan</p>
            </div>
          )}
          {verifications && verifications.length > 0 && (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
              {verifications.map((item) => (
                <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    item.status === "APPROVED"
                      ? "bg-emerald-100 dark:bg-emerald-900/40"
                      : item.status === "REJECTED"
                      ? "bg-red-100 dark:bg-red-900/40"
                      : "bg-amber-100 dark:bg-amber-900/40"
                  }`}>
                    {item.status === "APPROVED" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : item.status === "REJECTED" ? (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#FF6B00] dark:text-amber-400" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{item.documentType}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <a
                        href={item.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#0B2F6E] hover:text-[#082352] dark:text-blue-400"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Dokumen
                      </a>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {item.rejectionReason && (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                        {item.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PWA & Push Notification Settings */}
      <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <PushNotificationSettings />
      </div>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
      </div>
    </div>
  );
}

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