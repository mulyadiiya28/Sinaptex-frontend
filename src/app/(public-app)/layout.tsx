import { DynamicNavbar } from "@/components/dynamic-navbar";
import { SiteFooter } from "@/components/site-footer";

/**
 * Layout grup (public-app) — halaman publik / bisa diakses tanpa login:
 *   - /marketplace/** (browsing katalog)
 *   - /pages/** (halaman legal — tentang-kami, syarat, dll)
 *
 * Menggunakan DynamicNavbar (top nav) + SiteFooter.
 * Bukan AppSidebar — karena ini bukan halaman dashboard/kerja.
 *
 * Catatan: Opportunity SENGAJA tetap di grup `(app)` (wajib login).
 */
export default function PublicAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <DynamicNavbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
