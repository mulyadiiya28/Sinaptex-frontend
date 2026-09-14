import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';

type StaticPage = {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
};

async function fetchPage(slug: string): Promise<StaticPage | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cahayaastera.com';
    const res = await fetch(`${baseUrl}/api/v1/content/pages/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (e) {
    console.error('fetchPage error:', e);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  return {
    title: page ? `${page.title} — Sinaptex` : 'Halaman — Sinaptex',
  };
}

export default async function StaticPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();

  const formattedDate = new Date(page.updatedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="group mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-semibold text-[#0B2F6E] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0B2F6E]/30 hover:shadow-md"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Kembali ke Beranda
      </Link>

      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-xl sm:p-12">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0B2F6E]/15 bg-white/80 px-4 py-1.5 text-xs font-bold text-[#0B2F6E] shadow-sm backdrop-blur-md">
          <FileText className="h-3.5 w-3.5" />
          <span>Halaman Informasi</span>
        </div>

        <h1 className="text-3xl font-black text-[#0B2F6E] sm:text-4xl">{page.title}</h1>

        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>Terakhir diperbarui: {formattedDate}</span>
        </div>

        <div className="my-8 h-px w-full bg-gradient-to-r from-slate-200/80 via-slate-200/40 to-transparent" />

        <div className="space-y-4 text-zinc-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mt-8 mb-4 text-2xl font-black text-[#0B2F6E] sm:text-3xl">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-8 mb-4 text-xl font-black text-[#0B2F6E] sm:text-2xl">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-6 mb-3 text-lg font-black text-[#0B2F6E] sm:text-xl">
                  {children}
                </h3>
              ),
              p: ({ children }) => <p className="leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-6">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal space-y-1.5 pl-6">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              a: ({ children, href }) => (
                <a href={href} className="font-semibold text-[#0B2F6E] hover:underline">
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-zinc-900">{children}</strong>
              ),
              hr: () => <hr className="my-8 border-slate-200" />,
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-[#FF6B00]/40 bg-orange-50/40 px-4 py-2 text-zinc-700">
                  {children}
                </blockquote>
              ),
            }}
          >
            {page.content}
          </ReactMarkdown>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Ada pertanyaan?{' '}
        <Link href="/pages/kontak" className="font-semibold text-[#0B2F6E] hover:underline">
          Hubungi kami
        </Link>
      </p>
    </div>
  );
}
