import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center shadow-sm backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00]">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-[#0B2F6E]">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0B2F6E] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0B2F6E]/20 transition-all duration-200 hover:bg-[#082352] hover:shadow-xl active:scale-[0.99]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
