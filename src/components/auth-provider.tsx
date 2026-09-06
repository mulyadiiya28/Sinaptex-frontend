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
import { useRouter, usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const setMe = useSessionStore((s) => s.setMe);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useNotificationSocket();

  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
      if (mounted) setReady(true);
    }, 1500);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        handleSession(data?.session ?? null);
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      await handleSession(session);
    });

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

        // ✅ User ada di Supabase tapi belum register di backend Sinaptex
        if (
          msg.includes("Account not registered locally") ||
          msg.includes("Profile not found") ||
          msg.includes("Complete registration")
        ) {
          console.warn("[AuthProvider] User not registered in backend, redirecting to register");
          setMe(null);
          queryClient.removeQueries({ queryKey: authKeys.me });
          disconnectSocket();
          
          // Hindari redirect loop
          if (pathname !== "/register" && pathname !== "/login") {
            router.push("/register?reason=complete_profile");
          }
          return;
        }

        console.warn("[AuthProvider] Failed fetching me profile:", err);
        setMe(null);
        queryClient.removeQueries({ queryKey: authKeys.me });
        disconnectSocket();
      }
    }

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [queryClient, setMe, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return <>{children}</>;
}