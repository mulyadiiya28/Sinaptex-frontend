"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { useSessionStore } from "@/store/use-session-store";
import { authKeys } from "@/features/auth/auth.hooks";
import { authApi } from "@/features/auth/auth.api";
import { useNotificationSocket } from "@/features/notification/use-notification-socket";
import { disconnectSocket } from "@/lib/socket-client";
import { useRouter, usePathname } from "next/navigation";

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

const AUTH_PUBLIC_PATHS = ["/login", "/register", "/auth/callback"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const setMe = useSessionStore((s) => s.setMe);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const redirectingRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

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
        redirectingRef.current = false;
        return;
      }

      try {
        const me = await authApi.me();
        if (!mounted) return;
        setMe(me);
        queryClient.setQueryData(authKeys.me, me);
        redirectingRef.current = false;
      } catch (err: unknown) {
        if (!mounted) return;

        const msg = err instanceof Error ? err.message : String(err || "");
        const existingMe = useSessionStore.getState().me;

        // Profil baru saja di-set lewat /auth/register — jangan dihapus & jangan bounce
        if (existingMe) {
          console.warn(
            "[AuthProvider] /auth/me gagal tapi store.me ada — tetap pakai profil lokal:",
            msg
          );
          return;
        }

        if (isNotRegisteredError(msg)) {
          setMe(null);
          queryClient.removeQueries({ queryKey: authKeys.me });
          disconnectSocket();

          const path = pathnameRef.current || "";
          const onPublicAuth = AUTH_PUBLIC_PATHS.some(
            (p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`)
          );

          if (onPublicAuth) return;

          if (!redirectingRef.current) {
            redirectingRef.current = true;
            console.warn(
              "[AuthProvider] User not registered in backend, redirecting to register"
            );
            router.replace(
              "/register?reason=complete_profile&step=profile&from=session"
            );
          }
          return;
        }

        console.warn("[AuthProvider] Failed fetching me profile:", err);
        // Jangan hapus me jika ada; hanya clear jika benar-benar kosong
        if (!existingMe) {
          setMe(null);
          queryClient.removeQueries({ queryKey: authKeys.me });
          disconnectSocket();
        }
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
      // Hindari race: INITIAL_SESSION / TOKEN_REFRESHED jangan override register yang baru
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
  }, [queryClient, setMe, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#0B2F6E]" />
      </div>
    );
  }

  return <>{children}</>;
}
