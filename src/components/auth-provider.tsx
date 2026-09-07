"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { useSessionStore } from "@/store/use-session-store";
import { authKeys } from "@/features/auth/auth.hooks";
import { authApi } from "@/features/auth/auth.api";
import { useNotificationSocket } from "@/features/notification/use-notification-socket";
import { disconnectSocket } from "@/lib/socket-client";

function isNotRegisteredError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("account not registered locally") ||
    m.includes("profile not found") ||
    m.includes("complete registration") ||
    m.includes("user not found") ||
    m.includes("not registered") ||
    m.includes("belum terdaftar")
  );
}

/**
 * Menyinkronkan sesi Supabase ↔ profil backend.
 * TIDAK me-redirect ke /register — itu tugas RequireAuth di area (app) saja,
 * supaya buka beranda (/) tidak dipaksa lengkapi profil.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const setMe = useSessionStore((s) => s.setMe);
  const [ready, setReady] = useState(false);

  useNotificationSocket();

  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
      if (mounted) setReady(true);
    }, 2000);

    async function handleSession(session: Session | null) {
      if (!session) {
        setMe(null);
        queryClient.removeQueries({ queryKey: authKeys.me });
        disconnectSocket();
        return;
      }

      try {
        const me = await authApi.me();
        if (!mounted) return;
        setMe(me);
        queryClient.setQueryData(authKeys.me, me);
      } catch (err: unknown) {
        if (!mounted) return;

        const msg = err instanceof Error ? err.message : String(err || "");
        const existingMe = useSessionStore.getState().me;

        // Profil sudah di-set (mis. baru register) — jangan dihapus
        if (existingMe) {
          console.warn(
            "[AuthProvider] /auth/me gagal tapi store.me ada — tetap pakai profil lokal:",
            msg
          );
          return;
        }

        // Belum register lokal: biarkan me = null.
        // Redirect hanya dilakukan RequireAuth saat user buka /dashboard dll.
        if (isNotRegisteredError(msg)) {
          console.info(
            "[AuthProvider] Sesi Supabase ada, profil Sinaptex belum. Tidak auto-redirect."
          );
          setMe(null);
          queryClient.removeQueries({ queryKey: authKeys.me });
          disconnectSocket();
          return;
        }

        console.warn("[AuthProvider] Failed fetching me profile:", err);
        setMe(null);
        queryClient.removeQueries({ queryKey: authKeys.me });
        disconnectSocket();
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        return handleSession(data?.session ?? null);
      })
      .catch((err) => {
        console.warn("[AuthProvider] Supabase session check error:", err);
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
          clearTimeout(safetyTimer);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "TOKEN_REFRESHED" && useSessionStore.getState().me) {
        return;
      }
      await handleSession(session);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [queryClient, setMe]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#0B2F6E]" />
      </div>
    );
  }

  return <>{children}</>;
}
