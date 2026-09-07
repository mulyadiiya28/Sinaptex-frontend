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
} from "lucide-react";
import Link from "next/link";
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

// Static contoh UI saja — ID need-* / offer-* JANGAN di-link ke /opportunities (butuh auth + bukan UUID API)
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
  // Static demo IDs must NOT open (app)/opportunities — that triggered RequireAuth + DEMO_USER mock
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
  try {
    const res = await apiClient.get<Category[]>("/api/v1/categories", { auth: false });
    if (Array.isArray(res) && res.length > 0) return res;
  } catch {
    /* fallback */
  }
  return staticCategories;
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const isNeed = opportunity.type.toUpperCase() === "NEED";
  const urgent =
    opportunity.urgent || opportunity.priority === "URGENT" || opportunity.priority === "HIGH";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl">
      <div
        className={`relative h-28 w-full p-4 ${
          isNeed
            ? "bg-gradient-to-br from-[#0B2F6E] via-[#092557] to-[#1E40AF]"
            : "bg-gradient-to-br from-slate-800 via-sky-900 to-[#0B2F6E]"
        }`}
      >
        <span
          className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-sm ${
            isNeed ? "bg-[#FF6B00]" : "bg-[#0B2F6E]"
          }`}
        >
          {opportunity.type}
        </span>
        {urgent && (
          <span className="ml-2 inline-flex animate-pulse items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-extrabold text-white">
            <Flame className="h-3 w-3" /> URGENT
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {opportunity.timeAgo}
          </span>
          {opportunity.views != null && opportunity.views > 0 && (
            <span className="flex items-center gap-1">
              <EyeIcon className="h-3.5 w-3.5" />
              {opportunity.views} dilihat
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-slate-900 group-hover:text-[#0B2F6E]">
          {opportunity.title}
        </h3>
        {opportunity.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {opportunity.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
          {opportunity.category && (
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1">
              <Tag className="h-3.5 w-3.5 text-slate-500" />
              <span>{opportunity.category}</span>
            </div>
          )}
          {opportunity.location && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{opportunity.location}</span>
            </div>
          )}
        </div>

        {opportunity.budget && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Estimasi Budget / Harga
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#0B2F6E]" />
              <span className="text-sm font-extrabold text-slate-900">{opportunity.budget}</span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0B2F6E] text-xs font-extrabold text-white">
                {(opportunity.publisher || "P").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-bold text-slate-800">
                    {opportunity.publisher}
                  </span>
                  {opportunity.verified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-blue-600" />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Mitra</span>
              </div>
            </div>
            <Link
              href={detailHref(opportunity.id)}
              className="flex h-9 items-center gap-1 rounded-xl bg-blue-50 px-3 text-xs font-bold text-[#0B2F6E] transition-colors group-hover:bg-[#0B2F6E] group-hover:text-white"
            >
              <span>Detail</span>
              <ArrowRight className="h-3.5 w-3.5" />
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
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <DynamicNavbar />

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-black tracking-tight text-[#0B2F6E] sm:text-4xl">
            Ekosistem bisnis dan layanan cerdas
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Temukan Need & Offer, matching mitra, chat, dan deal dalam satu platform Sinaptex.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari peluang bisnis..."
                className="w-full rounded-xl border-0 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0B2F6E]/20"
              />
            </div>
            <Link
              href="/marketplace"
              className="rounded-xl bg-[#0B2F6E] px-5 py-3 text-sm font-bold text-white hover:bg-[#082352]"
            >
              Jelajahi
            </Link>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0B2F6E]">Peluang terbaru</h2>
            <p className="text-sm text-slate-500">
              {isLoading ? "Memuat..." : `${filtered.length} peluang ditampilkan`}
            </p>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-[#FF6B00] hover:underline">
            Lihat semua →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-bold text-[#0B2F6E]">Kategori</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? staticCategories).map((cat) => {
            const Icon = iconMap[cat.icon] || Briefcase;
            return (
              <div
                key={String(cat.id)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0B2F6E]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{cat.title}</p>
                  <p className="text-xs text-slate-500">{cat.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
          {[
            {
              title: "Peluang Terverifikasi",
              desc: "Setiap peluang diverifikasi untuk menjaga kualitas.",
              icon: CheckCircle2,
            },
            {
              title: "Partner Terpercaya",
              desc: "Temukan partner sesuai kebutuhan dan lokasi.",
              icon: Users,
            },
            {
              title: "Aman & Terpercaya",
              desc: "Data terlindungi dan proses terjamin.",
              icon: ShieldCheck,
            },
            {
              title: "Proses Lebih Cepat",
              desc: "Matching digital yang efisien.",
              icon: Sparkles,
            },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-slate-100 p-5">
              <b.icon className="h-6 w-6 text-[#0B2F6E]" />
              <h3 className="mt-3 font-bold text-slate-900">{b.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-xl font-bold text-[#0B2F6E]">Cara kerja</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { num: "1", icon: UserPlus, title: "Daftar Gratis", desc: "Buat akun dalam hitungan detik." },
            { num: "2", icon: Search, title: "Temukan Peluang", desc: "Cari Need atau Offer." },
            { num: "3", icon: MessageSquare, title: "Hubungi & Match", desc: "Undang atau chat mitra." },
            { num: "4", icon: CheckCircle2, title: "Kerja Sama", desc: "Deal dan kembangkan bisnis." },
          ].map((s) => (
            <div key={s.num} className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B00] text-sm font-bold text-white">
                {s.num}
              </div>
              <s.icon className="mx-auto mt-3 h-5 w-5 text-[#0B2F6E]" />
              <h3 className="mt-2 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/register"
            className="inline-flex rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white hover:bg-[#082352]"
          >
            Mulai gratis
          </Link>
        </div>
      </section>
    </div>
  );
}
