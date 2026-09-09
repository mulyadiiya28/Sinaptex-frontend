"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Compass,
  Megaphone,
  Code2,
  Factory,
  Truck,
  LayoutGrid,
  ArrowRight,
  Sparkles,
  MapPin,
  Tag,
  Wallet,
  BadgeCheck,
  Clock,
  Flame,
  Eye as EyeIcon,
  UserPlus,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { DynamicNavbar } from "@/components/dynamic-navbar";

interface Opportunity {
  id: string;
  type: string;
  title: string;
  category?: string;
  location?: string | null;
  budget?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  description?: string;
  verified?: boolean;
  urgent?: boolean;
  priority?: string;
  timeAgo?: string;
  views?: number;
  publisher?: string;
  party?: { name?: string; verificationStatus?: string | null };
  createdAt?: string;
  status?: string;
}

interface Category {
  id: number | string;
  title: string;
  count: string;
  icon: string;
}

// Static contoh UI
const staticOpportunities: Opportunity[] = [
  {
    id: "need-001",
    type: "Need",
    title: "Mencari Supplier Kemasan Produk Food Grade",
    category: "Packaging",
    location: "Jakarta Selatan",
    budget: "Rp 15.000.000",
    description:
      "Membutuhkan supplier kemasan standing pouch offset printing minimal order 5000 pcs untuk snack renyah.",
    verified: true,
    urgent: true,
    timeAgo: "2 jam lalu",
    views: 142,
    publisher: "PT Boga Rasa Nusantara",
  },
  {
    id: "offer-001",
    type: "Offer",
    title: "Jasa Desain Logo, Packaging & Corporate Identity",
    category: "Design",
    location: "Bandung",
    budget: "Mulai Rp 2.500.000",
    description:
      "Layanan desain visual profesional oleh tim berpengalaman 7+ tahun. Bonus mock-up 3D dan pedoman warna.",
    verified: true,
    urgent: false,
    timeAgo: "5 jam lalu",
    views: 210,
    publisher: "Studio Karsa Digital",
  },
  {
    id: "need-002",
    type: "Need",
    title: "Agensi Meta Ads & TikTok Campaign Specialist",
    category: "Marketing",
    location: "Surabaya",
    budget: "Rp 10.000.000 / bln",
    description:
      "Mencari digital marketer berpengalaman untuk mengelola iklan e-commerce skincare dengan target ROI 4x.",
    verified: true,
    urgent: true,
    timeAgo: "1 hari lalu",
    views: 98,
    publisher: "GlowUp Cosmetic",
  },
  {
    id: "offer-002",
    type: "Offer",
    title: "Pengembangan Website e-Commerce & POS Kasir Integrated",
    category: "IT & Development",
    location: "Jakarta Pusat",
    budget: "Mulai Rp 8.000.000",
    description:
      "Pembuatan website cepat, aman, terintegrasi payment gateway (Midtrans/Xendit) & sistem inventori stok.",
    verified: true,
    urgent: false,
    timeAgo: "1 hari lalu",
    views: 175,
    publisher: "TechNova Solusindo",
  },
  {
    id: "need-003",
    type: "Need",
    title: "Sewa Armada Truk Engkel Box Pendingin (Cold Chain)",
    category: "Logistics",
    location: "Semarang",
    budget: "Rp 25.000.000 / bln",
    description:
      "Dibutuhkan 2 unit truk engkel refrigerator kontrak 6 bulan pengiriman produk beku rute Jawa Tengah - Jawa Timur.",
    verified: false,
    urgent: false,
    timeAgo: "2 hari lalu",
    views: 84,
    publisher: "FreshLogistics ID",
  },
  {
    id: "offer-003",
    type: "Offer",
    title: "Maklon Produksi Minuman Herbal Instan Berizin BPOM",
    category: "Packaging",
    location: "Yogyakarta",
    budget: "Nego / Sesuai Formulasi",
    description:
      "Fasilitas pabrik maklon standar GMP & BPOM. Siap bantu pembuatan izin edar dan pencampuran bahan baku.",
    verified: true,
    urgent: false,
    timeAgo: "3 hari lalu",
    views: 312,
    publisher: "CV Herbal Alami Sejahtera",
  },
];

const staticCategories: Category[] = [
  { id: 1, title: "Desain & Kreatif", count: "321 peluang", icon: "Compass" },
  { id: 2, title: "Pemasaran & Digital", count: "287 peluang", icon: "Megaphone" },
  { id: 3, title: "IT & Pengembangan", count: "195 peluang", icon: "Code2" },
  { id: 4, title: "Produksi & Manufaktur", count: "176 peluang", icon: "Factory" },
  { id: 5, title: "Logistik & Pengiriman", count: "143 peluang", icon: "Truck" },
  { id: 6, title: "Lainnya", count: "250+ peluang", icon: "LayoutGrid" },
];

const iconMap: Record<string, React.ElementType> = {
  Compass,
  Megaphone,
  Code2,
  Factory,
  Truck,
  LayoutGrid,
};

function isStaticDemoId(id: string) {
  return /^(need|offer)-\d+/i.test(id);
}

function detailHref(id: string) {
  if (isStaticDemoId(id)) {
    return `/login?redirect=${encodeURIComponent("/marketplace")}`;
  }
  return `/marketplace/${id}`;
}

async function fetchOpportunities(): Promise<Opportunity[]> {
  try {
    const res = await apiClient.get<Opportunity[] | { data?: Opportunity[] }>(
      "/api/v1/opportunities?limit=12",
      { auth: false }
    );
    const list = Array.isArray(res)
      ? res
      : Array.isArray((res as { data?: Opportunity[] })?.data)
        ? (res as { data: Opportunity[] }).data
        : [];
    if (list.length > 0) {
      return list.map((o) => ({
        ...o,
        type: o.type || "Need",
        publisher: o.publisher || o.party?.name || "Mitra Sinaptex",
        verified: o.verified ?? o.party?.verificationStatus === "APPROVED",
        category: o.category || "Business",
        budget:
          o.budget ||
          (o.budgetMin != null || o.budgetMax != null
            ? [o.budgetMin, o.budgetMax]
                .filter((n) => n != null)
                .map((n) => `Rp ${Number(n).toLocaleString("id-ID")}`)
                .join(" – ")
            : "Nego"),
        timeAgo: o.timeAgo || (o.createdAt ? new Date(o.createdAt).toLocaleDateString("id-ID") : ""),
        views: o.views ?? 0,
      }));
    }
  } catch {
    /* fallback static */
  }
  return staticOpportunities;
}

async function fetchCategories(): Promise<Category[]> {
  return staticCategories;
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const isNeed = opportunity.type?.toUpperCase() === "NEED";
  const urgent =
    opportunity.urgent || opportunity.priority === "URGENT" || opportunity.priority === "HIGH";

  const renderCategory = (category: any): string => {
    if (!category) return "Business";
    if (typeof category === "string") return category;
    if (typeof category === "object") {
      return category.name || category.title || category.id || "Business";
    }
    return "Business";
  };

  const renderPublisher = (publisher: any): string => {
    if (!publisher) return "Mitra Sinaptex";
    if (typeof publisher === "string") return publisher;
    if (typeof publisher === "object") {
      return publisher.name || publisher.companyName || "Mitra Sinaptex";
    }
    return "Mitra Sinaptex";
  };

  const publisherName = renderPublisher(opportunity.publisher);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 backdrop-blur-xl">
      {/* Card Header Tag Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <div className="flex items-center gap-2">
          {/* Badge Need / Offer */}
          <span
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${
              isNeed
                ? "bg-amber-500/10 text-[#FF6B00] border border-amber-500/20"
                : "bg-[#0B2F6E]/10 text-[#0B2F6E] border border-[#0B2F6E]/20"
            }`}
          >
            {isNeed ? "Need" : "Offer"}
          </span>

          {/* Badge Urgent jika urgent */}
          {urgent && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-600 border border-red-500/20">
              <Flame className="h-3 w-3 fill-red-500 text-red-500" />
              Mendesak
            </span>
          )}
        </div>

        {/* Time & Views */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
          {opportunity.timeAgo && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {opportunity.timeAgo}
            </span>
          )}
          {opportunity.views !== undefined && (
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="h-3 w-3" />
              {opportunity.views}
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-slate-900 transition-colors duration-200 group-hover:text-[#0B2F6E] line-clamp-2">
          {opportunity.title}
        </h3>

        {opportunity.description && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
            {opportunity.description}
          </p>
        )}

        {/* Budget Section */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-3 border border-slate-100">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-[#FF6B00]">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {isNeed ? "Alokasi Anggaran" : "Perkiraan Harga"}
            </p>
            <p className="truncate text-xs sm:text-sm font-extrabold text-[#0B2F6E]">
              {opportunity.budget}
            </p>
          </div>
        </div>

        {/* Category & Location */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <span>{renderCategory(opportunity.category)}</span>
          </div>

          {opportunity.location && (
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{opportunity.location}</span>
            </div>
          )}
        </div>

        {/* Footer Publisher & Detail Button */}
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B2F6E] text-xs font-extrabold text-white shadow-sm shadow-[#0B2F6E]/20">
                {publisherName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-bold text-slate-800">
                    {publisherName}
                  </span>
                  {opportunity.verified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-blue-600" />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  Mitra Terverifikasi
                </span>
              </div>
            </div>

            <Link
              href={detailHref(opportunity.id)}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 text-xs font-bold text-[#0B2F6E] transition-all duration-200 group-hover:bg-[#0B2F6E] group-hover:text-white group-hover:shadow-md"
            >
              <span>Detail</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function LandingPage() {
  const [search, setSearch] = useState("");
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["home", "opportunities"],
    queryFn: fetchOpportunities,
  });
  const { data: categories } = useQuery({
    queryKey: ["home", "categories"],
    queryFn: fetchCategories,
  });

  const list = opportunities ?? staticOpportunities;
  const filtered = search.trim()
    ? list.filter(
        (o) =>
          o.title.toLowerCase().includes(search.toLowerCase()) ||
          (o.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : list;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-blue-500/10 blur-3xl" />

      {/* Navigation Navbar */}
      <DynamicNavbar />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge Tagline */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0B2F6E]/15 bg-white/80 px-4 py-1.5 text-xs font-bold text-[#0B2F6E] shadow-sm backdrop-blur-md">
            <Image
              src="/icons/icon-maskable.svg"
              alt="Sinaptex Logo"
              width={18}
              height={18}
              className="h-4 w-4 rounded-md object-contain"
            />
            <span>Ekosistem Bisnis & Layanan Cerdas</span>
            <span className="rounded-md bg-[#0B2F6E]/10 px-1.5 py-0.5 text-[10px] font-extrabold text-[#0B2F6E]">
              B2B
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#0B2F6E] sm:text-5xl sm:leading-tight">
            Hubungkan Kebutuhan & Penawaran Bisnis Anda
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Temukan <span className="font-semibold text-[#FF6B00]">Need & Offer</span>, matching mitra cerdas, komunikasi langsung, dan transaksi aman dalam satu platform terpadu.
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 flex flex-col gap-2 rounded-3xl border border-slate-200/80 bg-white/90 p-2.5 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari peluang bisnis, kemasan, maklon, agensi..."
                className="w-full rounded-2xl border-0 bg-slate-50/80 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0B2F6E]/20"
              />
            </div>
            <Link
              href="/marketplace"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B2F6E] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0B2F6E]/20 transition-all duration-200 hover:bg-[#082352] hover:shadow-xl active:scale-[0.99]"
            >
              <span>Jelajahi Peluang</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </form>

          {/* Quick Metrics */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" /> 1,200+ Mitra Terverifikasi
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Matching Cepat & Akurat
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Transaksi Terjamin
            </span>
          </div>
        </div>
      </section>

      {/* Peluang Terbaru Section */}
      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#FF6B00]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">
                Update Real-time
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-black text-[#0B2F6E]">Peluang Terbaru</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isLoading ? "Memuat peluang bisnis..." : `${filtered.length} peluang bisnis siap ditindaklanjuti`}
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6B00] transition-colors hover:text-amber-600 hover:underline"
          >
            <span>Lihat Semua Peluang</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Opportunities Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* Kategori Section */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl font-black text-[#0B2F6E]">Kategori Bisnis Populer</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Jelajahi berbagai bidang spesialisasi sektor bisnis B2B
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? staticCategories).map((cat) => {
            const Icon = iconMap[cat.icon] || Briefcase;
            return (
              <div
                key={String(cat.id)}
                className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#0B2F6E]/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B2F6E]/10 text-[#0B2F6E] transition-colors group-hover:bg-[#0B2F6E] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-[#0B2F6E]">
                    {cat.title}
                  </p>
                  <p className="text-xs font-medium text-slate-500">{cat.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Keunggulan Platform Section */}
      <section className="relative border-y border-slate-200/80 bg-white/80 py-16 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-black text-[#0B2F6E] sm:text-3xl">
              Mengapa Memilih Sinaptex?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Dirancang khusus untuk efisiensi dan keamanan kolaborasi antar perusahaan
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Peluang Terverifikasi",
                desc: "Setiap permintaan dan penawaran divalidasi untuk menjamin keseriusan mitra.",
                icon: CheckCircle2,
              },
              {
                title: "Partner Terpercaya",
                desc: "Filter profil perusahaan, reputasi, dan rekam jejak secara rinci.",
                icon: Users,
              },
              {
                title: "Aman & Terlindungi",
                desc: "Keamanan data, privasi dokumen, dan proses transaksi terjamin.",
                icon: ShieldCheck,
              },
              {
                title: "Matching Cerdas",
                desc: "Sistem mencocokkan kriteria kebutuhan bisnis Anda dengan presisi tinggi.",
                icon: Sparkles,
              },
            ].map((b) => (
              <div
                key={b.title}
                className="group rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B2F6E] text-white shadow-md shadow-[#0B2F6E]/20">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-[#0B2F6E]">
                  {b.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-black text-[#0B2F6E] sm:text-3xl">Cara Kerja Platform</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            4 Langkah mudah memulai kolaborasi bisnis di Sinaptex
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              num: "01",
              icon: UserPlus,
              title: "Buat Akun",
              desc: "Daftar gratis dalam hitungan detik dan lengkapi profil bisnis Anda.",
            },
            {
              num: "02",
              icon: Search,
              title: "Jelajahi / Buat Peluang",
              desc: "Pasang Need/Offer Anda atau cari listing peluang yang tersedia.",
            },
            {
              num: "03",
              icon: MessageSquare,
              title: "Komunikasi & Match",
              desc: "Diskusikan detail kerjasama secara langsung via fitur pesan.",
            },
            {
              num: "04",
              icon: CheckCircle2,
              title: "Kesepakatan Deal",
              desc: "Sepakati penawaran dan kembangkan jangkauan bisnis Anda.",
            },
          ].map((s) => (
            <div
              key={s.num}
              className="relative rounded-3xl border border-slate-200/80 bg-white/90 p-6 text-center shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF6B00]/10 text-xs font-black text-[#FF6B00]">
                {s.num}
              </div>
              <s.icon className="mx-auto mt-4 h-6 w-6 text-[#0B2F6E]" />
              <h3 className="mt-3 text-base font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Button Bottom */}
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B00] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B00]/25 transition-all duration-200 hover:bg-orange-600 hover:shadow-xl active:scale-[0.98]"
          >
            <span>Mulai Sekarang — Gratis</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}