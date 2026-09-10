import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

/**
 * Grup route untuk halaman yang TIDAK wajib login: Marketplace (browsing
 * katalog publik) dan Chat (halaman tetap bisa dibuka, tapi isi percakapan
 * baru bisa diakses setelah login — lihat guard di dalam masing-masing
 * page.tsx). Beda dengan `(app)/layout.tsx` yang membungkus semuanya dengan
 * `<RequireAuth>` dan langsung redirect ke /login.
 *
 * Opportunity SENGAJA tetap di grup `(app)` (wajib login) sesuai kebutuhan.
 */
export default function PublicAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
