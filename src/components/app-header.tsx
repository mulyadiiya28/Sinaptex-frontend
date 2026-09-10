"use client";

import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, LogOut, LogIn } from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";
import { useSessionStore } from "@/store/use-session-store";
import { useSignOut } from "@/features/auth/auth.hooks";
import { NotificationBell } from "@/components/notification-bell";
import { SinaptexLogo } from "@/components/sinaptex-logo";

export function AppHeader() {
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const me = useSessionStore((s) => s.me);
  const signOut = useSignOut();

  async function handleLogout() {
    await signOut.mutateAsync();
    router.replace("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
        <div className="md:hidden">
          <SinaptexLogo variant="compact" size="xs" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        {me && (
          <span className="hidden text-sm text-slate-600 sm:inline">
            {me.fullName}
            {me.isVerified && (
              <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                verified
              </span>
            )}
          </span>
        )}
        {me ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={signOut.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            {signOut.isPending ? "Keluar…" : "Keluar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#082352]"
          >
            <LogIn className="h-3.5 w-3.5" />
            Masuk
          </button>
        )}
      </div>
    </header>
  );
}
