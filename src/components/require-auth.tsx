"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/use-session-store";
import { useMe } from "@/features/auth/auth.hooks";
import { Me } from "@/features/auth/auth.schema";

export const DEMO_USER: Me = {
  id: "usr_demo_sinaptex",
  email: "demo@sinaptex.id",
  fullName: "Budi Santoso",
  isVerified: true,
  businessRoles: [{ role: "ENTREPRENEUR" }],
};

/**
 * Guard client-side: jika belum ada session, sediakan demo session agar
 * pengguna di preview dapat langsung menjelajahi seluruh fitur (chat, dashboard, deal, dll).
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const meFromStore = useSessionStore((s) => s.me);
  const setMe = useSessionStore((s) => s.setMe);
  const { data: meFromQuery, isLoading, isError } = useMe(true);
  const me = meFromStore ?? meFromQuery ?? null;

  useEffect(() => {
    if (!isLoading && (!me || isError)) {
      setMe(DEMO_USER);
    }
  }, [isLoading, me, isError, setMe]);

  if (isLoading && !me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          <p className="text-xs text-zinc-400">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
