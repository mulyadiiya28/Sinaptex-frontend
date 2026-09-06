"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { authApi } from "@/features/auth/auth.api";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Menyelesaikan autentikasi...");

  useEffect(() => {
    async function handleCallback() {
      const redirect = searchParams.get("redirect") || "/dashboard";

      // Tunggu Supabase selesai handle OAuth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setStatus("Gagal autentikasi, mengarahkan ke login...");
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      // ✅ Cek apakah user sudah terdaftar di backend Sinaptex
      try {
        setStatus("Memeriksa profil...");
        await authApi.me();
        // Kalau sukses → user sudah register, ke dashboard
        router.push(redirect);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err || "");

        // ❌ Belum register di backend → arahkan ke pengisian profil
        if (msg.includes("Account not registered locally") || msg.includes("Profile not found")) {
          setStatus("Profil belum lengkap, mengarahkan...");
          router.push("/register?reason=complete_profile&step=profile&from=google");
        } else {
          // Error lain (network, token invalid, dll)
          setStatus("Terjadi kesalahan, mengarahkan ke login...");
          setTimeout(() => router.push("/login"), 1500);
        }
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{status}</p>
      </div>
    </div>
  );
}