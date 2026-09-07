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
import { SinaptexLogo } from "@/components/sinaptex-logo";

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (
    m.includes("account not registered locally") ||
    m.includes("complete registration")
  ) {
    return "Akun belum terdaftar di Sinaptex. Isi nama lengkap lalu klik Selesaikan Pendaftaran.";
  }
  if (m.includes("email not confirmed") || m.includes("confirm")) {
    return "Email belum diverifikasi. Cek kotak masuk / spam, buka link konfirmasi, lalu login lagi.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
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
  const fromGoogle =
    searchParams.get("from") === "google" || searchParams.get("from") === "session";

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

  useEffect(() => {
    if (me?.id && !submittingRef.current) {
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
    // Opsional: keluar dari sesi setengah jadi agar tidak terus dianggap login
    // User bisa pilih tetap simpan sesi Supabase dan hanya ke beranda
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

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      if (phone.trim() && phone.trim().length < 8) {
        throw new Error("Nomor telepon minimal 8 digit (atau kosongkan).");
      }

      const body: { fullName: string; phone?: string } = {
        fullName: fullName.trim(),
      };
      if (phone.trim()) body.phone = phone.trim();

      const profile = await authApi.register(body);

      if (!profile || !profile.id) {
        const verified = await authApi.me();
        setMe(verified);
        queryClient.setQueryData(authKeys.me, verified);
      } else {
        setMe(profile);
        queryClient.setQueryData(authKeys.me, profile);
        try {
          const verified = await authApi.me();
          setMe(verified);
          queryClient.setQueryData(authKeys.me, verified);
        } catch {
          /* pakai hasil register */
        }
      }

      router.replace("/dashboard");
    } catch (err: unknown) {
      submittingRef.current = false;
      const msg = err instanceof Error ? err.message : "Gagal mendaftar";
      setError(friendlyAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0B2F6E] focus:bg-white focus:ring-2 focus:ring-[#0B2F6E]/20";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <SinaptexLogo
            variant="horizontal"
            size="md"
            showTagline
            responsiveCollapse={false}
            taglineText="Ekosistem Bisnis Dan Layanan Cerdas"
          />
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#0B2F6E]">
            {step === "signup"
              ? "Buat Akun Sinaptex"
              : step === "verify-email"
                ? "Verifikasi Email"
                : "Lengkapi Profil"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {step === "signup" ? (
              <>
                Sudah punya akun?{" "}
                <Link href="/login" className="font-medium text-[#FF6B00] hover:text-orange-600">
                  Masuk
                </Link>
              </>
            ) : step === "verify-email" ? (
              "Kami mengirim link konfirmasi ke email Anda."
            ) : (
              "Satu langkah lagi — buat profil di backend Sinaptex."
            )}
          </p>
          {reason === "complete_profile" && step === "profile" && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Login berhasil, profil Sinaptex belum ada. Isi nama lalu Selesaikan, atau lewati ke
              beranda dulu.
            </p>
          )}
        </div>

        {step === "verify-email" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <MailCheck className="h-7 w-7 text-[#0B2F6E]" />
            </div>
            <p className="text-sm text-slate-600">
              Link verifikasi dikirim ke{" "}
              <span className="font-semibold text-slate-900">{email}</span>.
            </p>
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#082352]"
            >
              Ke halaman Masuk
            </Link>
          </div>
        )}

        {step === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0B2F6E] focus:bg-white focus:ring-2 focus:ring-[#0B2F6E]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2F6E] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#082352] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Memuat..." : "Lanjutkan"}
            </button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={handleRegisterProfile} className="space-y-4">
            {email && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nomor Telepon <span className="text-slate-400">(opsional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Menyimpan profil..." : "Selesaikan Pendaftaran"}
            </button>

            {(reason === "complete_profile" || fromGoogle) && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleSkipToHome}
                  className="w-full text-center text-sm font-medium text-slate-600 hover:text-[#0B2F6E]"
                >
                  Lewati dulu — ke beranda
                </button>
                <button
                  type="button"
                  onClick={handleSignOutAndHome}
                  className="w-full text-center text-xs text-slate-400 hover:text-red-600"
                >
                  Keluar dari sesi ini & ke beranda
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
