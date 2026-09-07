"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "@/store/use-session-store";
import { useMe } from "@/features/auth/auth.hooks";
import { supabase } from "@/lib/supabase-client";

function isNotRegisteredError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err || "")).toLowerCase();
  return (
    msg.includes("account not registered locally") ||
    msg.includes("profile not found") ||
    msg.includes("complete registration") ||
    msg.includes("user not found") ||
    msg.includes("not registered") ||
    msg.includes("belum terdaftar")
  );
}

/**
 * Guard area (app).
 * Prioritas: store.me (setelah register) > query me > redirect.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const meFromStore = useSessionStore((s) => s.me);
  const { data: meFromQuery, isLoading, isError, error, isFetched } = useMe(
    // Hanya fetch jika store belum punya profil (hindari race mengosongkan UI)
    !meFromStore
  );
  const me = meFromStore ?? meFromQuery ?? null;
  const [hasSupabaseSession, setHasSupabaseSession] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setHasSupabaseSession(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive) setHasSupabaseSession(Boolean(session));
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Sudah punya profil di store/query → tidak redirect
    if (me) return;
    if (hasSupabaseSession === null) return;
    if (isLoading) return;

    if (hasSupabaseSession) {
      // Sesi Supabase ada, belum ada profil lokal yang valid
      if (isFetched && (isNotRegisteredError(error) || isError || !meFromQuery)) {
        router.replace(
          "/register?reason=complete_profile&step=profile&from=session"
        );
      }
      return;
    }

    // Tidak ada sesi sama sekali
    if (isFetched || hasSupabaseSession === false) {
      const redirect = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [
    me,
    meFromQuery,
    isLoading,
    isFetched,
    isError,
    error,
    hasSupabaseSession,
    pathname,
    router,
  ]);

  if (me) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#0B2F6E]" />
        <p className="text-xs text-slate-400">Memuat sesi...</p>
      </div>
    </div>
  );
}
