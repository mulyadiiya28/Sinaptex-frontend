"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Login Card */}
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

          {/* Title & Link Register */}
          <div className="text-center pt-1">
            <h1 className="text-xl font-bold tracking-tight text-[#0B2F6E]">
              Masuk ke Sinaptex
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#FF6B00] transition-colors duration-200 hover:text-amber-600 hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#0B2F6E]" />
          ) : (
            <svg className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>{googleLoading ? "Menghubungkan..." : "Masuk dengan Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200/80" />
          <span className="absolute bg-white/90 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 backdrop-blur-sm">
            atau
          </span>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          {/* Email Input */}
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
                className="peer w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#0B2F6E] focus:bg-white focus:ring-4 focus:ring-[#0B2F6E]/10"
              />
            </div>
          </div>

          {/* Password Input */}
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
                className="peer w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-11 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#0B2F6E] focus:bg-white focus:ring-4 focus:ring-[#0B2F6E]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 rounded-lg p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-medium text-red-600 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2F6E] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0B2F6E]/20 transition-all duration-200 hover:bg-[#082352] hover:shadow-xl hover:shadow-[#0B2F6E]/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{loading ? "Memuat..." : "Masuk"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}