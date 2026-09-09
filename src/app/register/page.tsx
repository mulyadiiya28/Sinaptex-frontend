"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { authApi } from "@/features/auth/auth.api";
import { authKeys } from "@/features/auth/auth.hooks";
import { useSessionStore } from "@/store/use-session-store";
import { User, Mail, Lock, Phone, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("missing bearer") || m.includes("unauthorized") || m.includes("401")) {
    return "Token tidak terkirim. Logout → login Google lagi → Selesaikan Pendaftaran.";
  }
  if (m.includes("belum menyimpan") || m.includes("verifySupabaseToken")) {
    return msg;
  }
  if (m.includes("account not registered") || m.includes("complete registration")) {
    return "Profil belum ada di server. Isi nama → Selesaikan Pendaftaran. Jangan lewati langkah ini.";
  }
  if (m.includes("email not confirmed")) {
    return "Email belum diverifikasi. Cek inbox/spam.";
  }
  return msg;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setMe = useSessionStore((s) => s.setMe);
  const me = useSessionStore((s) => s.me);
  const submittingRef = useRef(false);

  const reason = searchParams.get("reason");
  const stepParam = searchParams.get("step");

  const [step, setStep] = useState<"signup" | "verify-email" | "profile">(
    stepParam === "profile" || reason === "complete_profile" ? "profile" : "signup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugHint, setDebugHint] = useState("");

  useEffect(() => {
    if (me?.id && me.fullName && !submittingRef.current) {
      router.replace("/dashboard");
    }
  }, [me, router]);

  useEffect(() => {
    if (step !== "profile") return;
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      if (user.email) setEmail(user.email);
      const metaName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined);
      if (metaName) setFullName((prev) => prev || metaName);
    });
  }, [step]);

  async function handleSkipToHome() {
    router.replace("/");
  }

  async function handleSignOutAndHome() {
    await supabase.auth.signOut();
    setMe(null);
    queryClient.removeQueries({ queryKey: authKeys.me });
    router.replace("/");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/register?reason=complete_profile&step=profile`,
      },
    });

    if (signUpError) {
      setError(friendlyAuthError(signUpError.message));
      setLoading(false);
      return;
    }

    if (!data.session) {
      setStep("verify-email");
      setLoading(false);
      return;
    }

    setStep("profile");
    setLoading(false);
  }

  async function handleRegisterProfile(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");
    setDebugHint("");

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const session = sessionData.session;
      if (!session?.access_token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      const name = fullName.trim();
      if (name.length < 2) throw new Error("Nama lengkap minimal 2 karakter.");
      if (phone.trim() && phone.trim().length < 8) {
        throw new Error("Nomor telepon minimal 8 digit (atau kosongkan).");
      }

      const body: { fullName: string; phone?: string } = { fullName: name };
      if (phone.trim()) body.phone = phone.trim();

      setDebugHint("Mengirim POST /api/v1/auth/register …");

      const profile = await authApi.register(body);

      if (!profile?.id || !profile.fullName) {
        throw new Error(
          "Backend tidak mengembalikan profil lengkap. Cek response POST /auth/register di Network."
        );
      }

      setMe(profile);
      queryClient.setQueryData(authKeys.me, profile);
      setDebugHint("Profil tersimpan di server. Mengarah ke dashboard…");
      router.replace("/dashboard");
    } catch (err: unknown) {
      submittingRef.current = false;
      const msg = err instanceof Error ? err.message : "Gagal mendaftar";
      setError(friendlyAuthError(msg));
      setDebugHint(
        "Buka DevTools → Network → filter 'register'. Status harus 200/201. Body harus berisi user/profile."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "peer w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#0B2F6E] focus:bg-white focus:ring-4 focus:ring-[#0B2F6E]/10";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Register Card */}
      <div className="relative w-full max-w-md space-y-5 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur-xl sm:p-8">
        
        {/* Header Section */}
        <div className="space-y-4">
          {/* Header Bar: Icon (Kiri), Brand & Motto (Tengah), B2B Badge (Kanan) */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            {/* Pojok Kiri: Icon Logo */}
            <div className="flex shrink-0 items-center">
              <Image
                src="/icons/icon-maskable.svg"
                alt="Sinaptex Logo"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-contain"
                priority
              />
            </div>

            {/* Tengah: Brand & Motto */}
            <div className="flex min-w-0 flex-col items-center text-center">
              <span className="text-base font-bold tracking-tight text-[#0B2F6E]">
                Sinaptex
              </span>
              <span className="text-[10px] font-medium leading-tight text-slate-500">
                Ekosistem Bisnis Dan Layanan Cerdas
              </span>
            </div>

            {/* Pojok Kanan: Badge B2B */}
            <div className="flex shrink-0 items-center justify-end">
              <span className="rounded-lg bg-[#0B2F6E]/10 px-2.5 py-0.5 text-xs font-bold tracking-wide text-[#0B2F6E]">
                B2B
              </span>
            </div>
          </div>

          {/* Title & Subtitle / Link */}
          <div className="text-center pt-1">
            <h1 className="text-xl font-bold tracking-tight text-[#0B2F6E]">
              {step === "signup"
                ? "Buat Akun Sinaptex"
                : step === "verify-email"
                  ? "Verifikasi Email"
                  : "Lengkapi Profil"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {step === "profile" ? (
                "Data ini disimpan ke User + Profile di server Sinaptex."
              ) : step === "signup" ? (
                <>
                  Sudah punya akun?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-[#FF6B00] transition-colors duration-200 hover:text-amber-600 hover:underline"
                  >
                    Masuk
                  </Link>
                </>
              ) : (
                "Kami mengirim link konfirmasi ke email Anda."
              )}
            </p>
          </div>
        </div>

        {/* Step 1: Verify Email */}
        {step === "verify-email" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <MailCheck className="h-7 w-7 text-[#0B2F6E]" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Link verifikasi dikirim ke{" "}
              <span className="font-semibold text-slate-900">{email}</span>.
            </p>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2F6E] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0B2F6E]/20 transition-all duration-200 hover:bg-[#082352]"
            >
              Ke halaman Masuk
            </Link>
          </div>
        )}

        {/* Step 2: Signup Form */}
        {step === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400 transition-colors duration-200 peer-focus:text-[#0B2F6E]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400 transition-colors duration-200 peer-focus:text-[#0B2F6E]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="peer w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-11 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#0B2F6E] focus:bg-white focus:ring-4 focus:ring-[#0B2F6E]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 rounded-lg p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Konfirmasi Password
              </label>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400 transition-colors duration-200 peer-focus:text-[#0B2F6E]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-medium text-red-600 backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2F6E] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0B2F6E]/20 transition-all duration-200 hover:bg-[#082352] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Memuat..." : "Lanjutkan"}</span>
            </button>
          </form>
        )}

        {/* Step 3: Complete Profile */}
        {step === "profile" && (
          <form onSubmit={handleRegisterProfile} className="space-y-3.5">
            {email && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-slate-100/70 py-2.5 pl-10 pr-4 text-sm text-slate-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400 transition-colors duration-200 peer-focus:text-[#0B2F6E]" />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  required
                  minLength={2}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Nomor Telepon <span className="text-slate-400 lowercase">(opsional)</span>
              </label>
              <div className="relative flex items-center">
                <Phone className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400 transition-colors duration-200 peer-focus:text-[#0B2F6E]" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-medium text-red-600 backdrop-blur-sm">
                {error}
              </div>
            )}
            {debugHint && (
              <p className="text-[11px] text-slate-400">{debugHint}</p>
            )}

            <button
              type="submit"
              disabled={loading || fullName.trim().length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B00]/20 transition-all duration-200 hover:bg-orange-600 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Menyimpan ke server…" : "Selesaikan Pendaftaran"}</span>
            </button>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleSkipToHome}
                className="w-full text-center text-xs font-medium text-slate-600 transition-colors hover:text-[#0B2F6E]"
              >
                Lewati dulu — ke beranda
              </button>
              <button
                type="button"
                onClick={handleSignOutAndHome}
                className="w-full text-center text-[11px] text-slate-400 transition-colors hover:text-red-600"
              >
                Keluar dari sesi ini & ke beranda
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}