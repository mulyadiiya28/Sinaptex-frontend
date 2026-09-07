"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "@/store/use-session-store";
import { useMe } from "@/features/auth/auth.hooks";

/**
 * Guard client-side untuk area (app).
 * Jika belum ada session Supabase / profil backend → redirect ke login.
 * Tidak lagi menyuntikkan DEMO_USER (itu yang membuat "dashboard mock").
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const meFromStore = useSessionStore((s) => s.me);
  const { data: meFromQuery, isLoading, isError, isFetched } = useMe(true);
  const me = meFromStore ?? meFromQuery ?? null;

  useEffect(() => {
    // Tunggu query selesai sebelum putuskan redirect
    if (isLoading) return;

    // Sesi tidak ada / API /auth/me gagal → wajib login
    if (!me || isError) {
      const redirect = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [isLoading, isFetched, me, isError, pathname, router]);

  if (isLoading && !me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#0B2F6E]" />
          <p className="text-xs text-slate-400">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  // Sedang redirect ke login
  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#0B2F6E]" />
          <p className="text-xs text-slate-400">Mengalihkan ke halaman masuk...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
