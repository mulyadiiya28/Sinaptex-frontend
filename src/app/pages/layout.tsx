import { DynamicNavbar } from '@/components/dynamic-navbar';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <DynamicNavbar />
      <main>{children}</main>
      <footer className="mt-16 border-t border-slate-200/80 bg-white/80 py-8 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs text-zinc-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Sinaptex. Seluruh hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}
