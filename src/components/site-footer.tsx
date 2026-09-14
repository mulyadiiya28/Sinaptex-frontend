import Link from 'next/link';
import { SinaptexLogo } from '@/components/sinaptex-logo';

const footerLinks = {
  Produk: [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Peluang Bisnis', href: '/opportunities' },
    { label: 'Membership', href: '/membership' },
  ],
  Perusahaan: [
    { label: 'Tentang Kami', href: '/pages/tentang-kami' },
    { label: 'Cara Kerja', href: '/pages/cara-kerja' },
    { label: 'Kontak', href: '/pages/kontak' },
  ],
  Legal: [
    { label: 'Syarat & Ketentuan', href: '/pages/syarat-ketentuan' },
    { label: 'Kebijakan Privasi', href: '/pages/kebijakan-privasi' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <SinaptexLogo variant="horizontal" size="sm" theme="light" />
            <p className="mt-4 max-w-sm text-sm text-zinc-600">
              Platform B2B matchmaking & partnership intelligence untuk mempercepat kolaborasi
              bisnis yang transparan, terukur, dan aman.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2F6E]">
                {title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 transition-colors hover:text-[#0B2F6E]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
