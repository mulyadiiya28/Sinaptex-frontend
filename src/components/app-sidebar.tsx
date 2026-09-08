"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  MessageSquare,
  Handshake,
  User,
  Crown,
  Bell,
  X,
  Download,
  CheckCircle2,
  GitCompareArrows,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";
import { usePWA } from "@/components/pwa-provider";
import { SinaptexLogo } from "@/components/sinaptex-logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/opportunities", label: "Opportunity saya", icon: Briefcase },
  { href: "/parties", label: "Party saya", icon: Building2 },
  { href: "/matching", label: "Matching", icon: GitCompareArrows },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/deals", label: "Deal", icon: Handshake },
  { href: "/escrow", label: "Escrow", icon: ShieldCheck },
  { href: "/membership", label: "Membership", icon: Crown },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
  { href: "/profile", label: "Profil", icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { isInstalled, isInstallable, promptInstall } = usePWA();

  if (!isSidebarOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl md:static md:w-56 md:shadow-none">
        {/* Tinggi sama dengan AppHeader (h-16) agar sejajar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-3.5">
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex min-w-0 items-center transition hover:opacity-90"
          >
            <SinaptexLogo variant="compact" size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-[#0B2F6E]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0B2F6E]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          {isInstalled ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Sinaptex PWA Aktif</span>
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={promptInstall}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B2F6E] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#082352]"
            >
              <Download className="h-3.5 w-3.5" />
              Install Aplikasi PWA
            </button>
          ) : (
            <div className="text-[11px] text-slate-400">Sinaptex v1.0</div>
          )}
        </div>
      </aside>
    </>
  );
}