import { DynamicNavbar } from '@/components/dynamic-navbar';
import { SiteFooter } from '@/components/site-footer';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <DynamicNavbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
