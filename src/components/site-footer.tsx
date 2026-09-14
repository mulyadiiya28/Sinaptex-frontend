'use client';

import Link from 'next/link';
import { SinaptexLogo } from '@/components/sinaptex-logo';
import {
  useNavigation,
  resolveHref,
  type ApiMenuItem,
} from '@/features/navigation/navigation.hooks';

/**
 * Fallback menu footer — dipakai kalau API /navigation/resolve gagal,
 * atau DB belum di-seed. Biar footer nggak kosong.
 */
const FALLBACK_FOOTER: { label: string; href: string }[] = [
  { label: 'Tentang Kami', href: '/pages/tentang-kami' },
  { label: 'Cara Kerja', href: '/pages/cara-kerja' },
  { label: 'Syarat & Ketentuan', href: '/pages/syarat-ketentuan' },
  { label: 'Kebijakan Privasi', href: '/pages/kebijakan-privasi' },
  { label: 'Kontak', href: '/pages/kontak' },
];

export function SiteFooter() {
  const { data: footerItems, isLoading, isError } = useNavigation('FOOTER');

  // Normalisasi: API data atau fallback
  const items: { id: string; label: string; href: string }[] =
    footerItems && footerItems.length > 0
      ? footerItems.map((item: ApiMenuItem) => ({
          id: item.id,
          label: item.label,
          href: resolveHref(item),
        }))
      : FALLBACK_FOOTER.map((item, idx) => ({
          id: `fallback-${idx}`,
          label: item.label,
          href: item.href,
        }));

  return (
    <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <SinaptexLogo variant="horizontal" size="sm" theme="light" />
            <p className="mt-4 max-w-sm text-sm text-zinc-600">
              Platform B2B matchmaking &amp; partnership intelligence untuk mempercepat
              kolaborasi bisnis yang transparan, terukur, dan aman.
            </p>
          </div>

          {/* Menu */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2F6E]">
              Informasi
            </h3>
            {isLoading ? (
              <ul className="mt-4 space-y-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li
                    key={i}
                    className="h-4 w-32 animate-pulse rounded bg-slate-100"
                  />
                ))}
              </ul>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-sm text-zinc-600 transition-colors hover:text-[#0B2F6E]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} Sinaptex. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-xs text-zinc-400">
            Dibuat dengan ❤️ untuk pelaku bisnis Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
