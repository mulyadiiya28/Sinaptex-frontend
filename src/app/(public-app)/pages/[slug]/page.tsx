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
    description: page ? page.content.slice(0, 160).replace(/[#*`]/g, '') : undefined,
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
    <div className="min-h-screen bg-slate-50/50">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back button — pill style */}
        <Link
          href="/"
          className="group mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-semibold text-[#0B2F6E] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0B2F6E]/30 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke Beranda
        </Link>

        {/* Main card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-xl sm:p-12">
          {/* Icon badge + label */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0B2F6E]/15 bg-white/80 px-4 py-1.5 text-xs font-bold text-[#0B2F6E] shadow-sm backdrop-blur-md">
            <FileText className="h-3.5 w-3.5" />
            <span>Halaman Informasi</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-black text-[#0B2F6E] sm:text-4xl">{page.title}</h1>

          {/* Date */}
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>Terakhir diperbarui: {formattedDate}</span>
          </div>

          {/* Divider */}
          <div className="my-8 h-px w-full bg-gradient-to-r from-slate-200/80 via-slate-200/40 to-transparent" />

          {/* Markdown content — prose styling selaras brand */}
          <div
            className="prose prose-slate max-w-none
              prose-headings:text-[#0B2F6E] prose-headings:font-black
              prose-h1:mt-8 prose-h1:text-2xl sm:prose-h1:text-3xl
              prose-h2:mt-8 prose-h2:text-xl sm:prose-h2:text-2xl
              prose-h3:mt-6 prose-h3:text-lg sm:prose-h3:text-xl
              prose-p:text-zinc-700 prose-p:leading-relaxed
              prose-a:font-semibold prose-a:text-[#0B2F6E] prose-a:no-underline hover:prose-a:underline
              prose-strong:font-bold prose-strong:text-zinc-900
              prose-li:text-zinc-700
              prose-blockquote:border-l-4 prose-blockquote:border-[#FF6B00]/40 prose-blockquote:bg-orange-50/40 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:text-zinc-700 prose-blockquote:not-italic
              prose-hr:border-slate-200"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content}</ReactMarkdown>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-zinc-400">
          Ada pertanyaan?{' '}
          <Link href="/pages/kontak" className="font-semibold text-[#0B2F6E] hover:underline">
            Hubungi kami
          </Link>
        </p>
      </article>
    </div>
  );
}