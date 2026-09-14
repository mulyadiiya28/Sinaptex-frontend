'use client';

import Link from 'next/link';
import { SinaptexLogo } from '@/components/sinaptex-logo';
import {
  useNavigation,
  resolveHref,
  type ApiMenuItem,
} from '@/features/navigation/navigation.hooks';

type FooterGroup = {
  id: string;
  title: string;
  items: { id: string; label: string; href: string }[];
};

const FALLBACK_FOOTER: FooterGroup[] = [
  {
    id: 'produk',
    title: 'Produk',
    items: [
      { id: 'f-market', label: 'Marketplace', href: '/marketplace' },
      { id: 'f-opp', label: 'Peluang Bisnis', href: '/opportunities' },
      { id: 'f-member', label: 'Membership', href: '/membership' },
    ],
  },
  {
    id: 'tentang',
    title: 'Tentang',
    items: [
      { id: 'f-about', label: 'Tentang Kami', href: '/pages/tentang-kami' },
      { id: 'f-how', label: 'Cara Kerja', href: '/pages/cara-kerja' },
    ],
  },
  {
    id: 'kontak',
    title: 'Kontak & Legal',
    items: [
      { id: 'f-contact', label: 'Kontak', href: '/pages/kontak' },
      { id: 'f-terms', label: 'Syarat & Ketentuan', href: '/pages/syarat-ketentuan' },
      { id: 'f-privacy', label: 'Kebijakan Privasi', href: '/pages/kebijakan-privasi' },
    ],
  },
];

export function SiteFooter() {
  const { data: footerItems, isLoading } = useNavigation('FOOTER');

  const groups: FooterGroup[] =
    footerItems && footerItems.length > 0
      ? (() => {
          const hasGroups = footerItems.some(
            (i) => (i.children?.length ?? 0) > 0
          );
          if (!hasGroups) {
            return [
              {
                id: 'info',
                title: 'Informasi',
                items: footerItems.map((item) => ({
                  id: item.id,
                  label: item.label,
                  href: resolveHref(item),
                })),
              },
            ];
          }
          return footerItems
            .filter((parent) => (parent.children?.length ?? 0) > 0)
            .map((parent) => ({
              id: parent.id,
              title: parent.label,
              items: (parent.children || []).map((c) => ({
                id: c.id,
                label: c.label,
                href: resolveHref(c),
              })),
            }));
        })()
      : FALLBACK_FOOTER;

  return (
    <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Grid hanya tampil di tablet ke atas */}
        <div className="hidden gap-10 md:grid md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <SinaptexLogo variant="horizontal" size="sm" theme="light" />
            <p className="mt-4 max-w-sm text-sm text-zinc-600">
              Platform B2B matchmaking &amp; partnership intelligence untuk mempercepat
              kolaborasi bisnis yang transparan, terukur, dan aman.
            </p>
          </div>

          {/* Menu groups */}
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                  <ul className="mt-4 space-y-2.5">
                    {[1, 2, 3].map((j) => (
                      <li
                        key={j}
                        className="h-4 w-32 animate-pulse rounded bg-slate-100"
                      />
                    ))}
                  </ul>
                </div>
              ))
            : groups.map((group) => (
                <div key={group.id}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2F6E]">
                    {group.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {group.items.map((item) => (
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
                </div>
              ))}
        </div>

        {/* Bottom bar — mobile hanya copyright, desktop full */}
        <div className="mt-0 flex flex-col items-center justify-between gap-2 text-center md:mt-12 md:flex-row md:border-t md:border-slate-200/80 md:pt-8 md:text-left">
          {/* Mobile only */}
          <p className="text-xs text-zinc-400 md:hidden">
            © {new Date().getFullYear()} - Sinaptex
          </p>

          {/* Desktop only */}
          <p className="hidden text-xs text-zinc-400 md:block">
            © {new Date().getFullYear()} Sinaptex. Seluruh hak cipta dilindungi.
          </p>
          <p className="hidden text-xs text-zinc-400 md:block">
            Dibuat dengan ❤️ untuk pelaku bisnis Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
