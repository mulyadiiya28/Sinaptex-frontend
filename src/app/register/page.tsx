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
  const [debugHint, setDebugHint] = useState("");

  // Hanya redirect dashboard jika me berasal dari backend (punya fullName atau email dari API)
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

      // HARUS sukses di backend — tidak ada profil palsu di localStorage
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
            {step === "profile"
              ? "Data ini disimpan ke User + Profile di server Sinaptex (bukan hanya di browser)."
              : step === "signup"
                ? (
                    <>
                      Sudah punya akun?{" "}
                      <Link href="/login" className="font-medium text-[#FF6B00] hover:text-orange-600">
                        Masuk
                      </Link>
                    </>
                  )
                : "Kami mengirim link konfirmasi ke email Anda."}
          </p>
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#0B2F6E] focus:bg-white focus:ring-2 focus:ring-[#0B2F6E]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2F6E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#082352] disabled:opacity-50"
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
            {debugHint && (
              <p className="text-[11px] text-slate-400">{debugHint}</p>
            )}

            <button
              type="submit"
              disabled={loading || fullName.trim().length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Menyimpan ke server…" : "Selesaikan Pendaftaran"}
            </button>

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
          </form>
        )}
      </div>
    </div>
  );
}
