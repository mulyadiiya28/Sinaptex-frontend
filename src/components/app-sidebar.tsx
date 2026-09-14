"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react";
import {
  X,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";
import { usePWA } from "@/components/pwa-provider";
import { SinaptexLogo } from "@/components/sinaptex-logo";
import { useNavigation, resolveHref, type ApiMenuItem } from "@/features/navigation/navigation.hooks";

/**
 * Icon dinamis dari string nama Lucide — supaya menu bisa di-render dari
 * data DB (kolom `icon` menyimpan nama icon, mis. "LayoutDashboard").
 */
function DynamicIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;
  const Icon = (LucideIcons as unknown as Record<string, React.ElementType>)[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

/**
 * Skeleton loading — placeholder berbentuk bar untuk setiap item menu.
 * Lebih jelas dibanding spinner kecil, dan mencegah layout shift.
 */
function SidebarSkeleton() {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-lg bg-slate-100"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </nav>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { isInstalled, isInstallable, promptInstall } = usePWA();

  // Fetch menu SIDEBAR dari DB (endpoint sudah filter AUTH_ONLY via token)
  const { data: menuItems, isLoading } = useNavigation("SIDEBAR");

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Overlay di mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl md:static md:w-56 md:shadow-none">
        {/* Header — tinggi sama dengan AppHeader (h-16) agar sejajar */}
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

        {/* Menu — dinamis dari DB */}
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
            {(menuItems ?? []).map((item: ApiMenuItem) => {
              const href = resolveHref(item);
              const basePath = href.split("?")[0];
              const active =
                pathname === basePath || pathname.startsWith(`${basePath}/`);

              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={() => {
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-[#0B2F6E]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#0B2F6E]"
                  }`}
                >
                  <DynamicIcon name={item.icon} className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}

            {/* Kalau menu kosong (DB belum di-seed / belum login) */}
            {!isLoading && (menuItems ?? []).length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">
                Menu belum tersedia.
              </p>
            )}
          </nav>
        )}

        {/* Footer — PWA install / status */}
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
