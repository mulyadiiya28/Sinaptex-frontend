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
  Bookmark,
  Clock,
  Flame,
  Eye as EyeIcon,
  Loader2,
  AlertCircle,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { DynamicNavbar } from "@/components/dynamic-navbar";

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

interface Opportunity {
  id: string;
  type: string;
  title: string;
  category: string;
  location: string;
  budget: string;
  description: string;
  verified: boolean;
  urgent: boolean;
  timeAgo: string;
  views: number;
  publisher: string;
}

interface Category {
  id: number;
  title: string;
  count: string;
  icon: string;
}

/* ═══════════════════════════════════════════════
   API FETCHERS
   ═══════════════════════════════════════════════ */

async function fetchOpportunities(filters?: {
  type?: string;
  category?: string;
  location?: string;
  search?: string;
}): Promise<Opportunity[]> {
  const params = new URLSearchParams();
  if (filters?.type && filters.type !== "ALL") params.append("type", filters.type);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.location) params.append("location", filters.location);
  if (filters?.search) params.append("search", filters.search);

  const query = params.toString();
  const endpoint = query ? `/api/v1/opportunities?${query}` : "/api/v1/opportunities";

  try {
    return await apiClient.get<Opportunity[]>(endpoint);
  } catch {
    // Fallback ke static data jika API belum tersedia
    return staticOpportunities;
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    return await apiClient.get<Category[]>("/api/v1/categories");
  } catch {
    return staticCategories;
  }
}

/* ═══════════════════════════════════════════════
   STATIC FALLBACK DATA
   ═══════════════════════════════════════════════ */

const staticOpportunities: Opportunity[] = [
  {
    id: "need-001",
    type: "Need",
    title: "Mencari Supplier Kemasan Produk Food Grade",
    category: "Packaging",
    location: "Jakarta Selatan",
    budget: "Rp 15.000.000",
    description: "Membutuhkan supplier kemasan standing pouch offset printing minimal order 5000 pcs untuk snack renyah.",
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
    description: "Layanan desain visual profesional oleh tim berpengalaman 7+ tahun. Bonus mock-up 3D dan pedoman warna.",
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
    description: "Mencari digital marketer berpengalaman untuk mengelola iklan e-commerce skincare dengan target ROI 4x.",
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
    description: "Pembuatan website cepat, aman, terintegrasi payment gateway (Midtrans/Xendit) & sistem inventori stok.",
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
    description: "Dibutuhkan 2 unit truk engkel refrigerator kontrak 6 bulan pengiriman produk beku rute Jawa Tengah - Jawa Timur.",
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
    description: "Fasilitas pabrik maklon standar GMP & BPOM. Siap bantu pembuatan izin edar dan pencampuran bahan baku.",
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
  Compass, Megaphone, Code2, Factory, Truck, LayoutGrid,
};

const trustBadges = [
  { title: "Peluang Terverifikasi", desc: "Setiap peluang diverifikasi untuk menjaga kualitas dan keamanan.", icon: CheckCircle2 },
  { title: "Partner Terpercaya", desc: "Temukan partner bisnis yang sesuai kebutuhan dan lokasi Anda.", icon: Users },
  { title: "Aman & Terpercaya", desc: "Transaksi aman, data terlindungi, dan sistem terjamin.", icon: ShieldCheck },
  { title: "Proses Lebih Cepat", desc: "Hemat waktu dengan proses digital yang efisien dan praktis.", icon: Sparkles },
];

const steps = [
  { num: "1", icon: "UserPlus", title: "Daftar Gratis", desc: "Buat akun gratis dalam hitungan detik." },
  { num: "2", icon: "Search", title: "Temukan Peluang", desc: "Cari peluang atau layanan yang sesuai kebutuhan Anda." },
  { num: "3", icon: "MessageSquare", title: "Hubungi & Match", desc: "Kirim undangan atau mulai percakapan langsung." },
  { num: "4", icon: "CheckCircle2", title: "Kerja Sama", desc: "Bangun kerja sama dan kembangkan bisnis Anda." },
];

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function CardCategoryBanner({ category, type }: { category: string; type: string }) {
  const isNeed = type?.toUpperCase() === "NEED";
  const catLower = (category || "").toLowerCase();

  if (catLower.includes("design") || catLower.includes("desain")) {
    return (
      <div className="relative h-32 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
        <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/10" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <Sparkles className="h-3 w-3" /> Creative & Design
          </span>
          <div className="text-xs font-semibold text-white/90">Visual Identity & Assets</div>
        </div>
      </div>
    );
  }

  if (catLower.includes("pack")) {
    return (
      <div className="relative h-32 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-4">
        <Factory className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <Factory className="h-3 w-3" /> Packaging & Material
          </span>
          <div className="text-xs font-semibold text-white/90">Custom Box & Printing</div>
        </div>
      </div>
    );
  }

  if (catLower.includes("market") || catLower.includes("digital")) {
    return (
      <div className="relative h-32 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-600 via-teal-600 to-emerald-500 p-4">
        <Megaphone className="absolute right-0 top-0 h-24 w-24 text-white/10" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <Megaphone className="h-3 w-3" /> Digital Marketing
          </span>
          <div className="text-xs font-semibold text-white/90">Growth & Advertising</div>
        </div>
      </div>
    );
  }

  if (catLower.includes("it") || catLower.includes("software") || catLower.includes("tech")) {
    return (
      <div className="relative h-32 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
        <Code2 className="absolute -right-2 -top-2 h-24 w-24 text-cyan-400/15" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-[10px] font-bold text-cyan-300 backdrop-blur-md">
            <Code2 className="h-3 w-3" /> Tech & Development
          </span>
          <div className="text-xs font-semibold text-white/90">Software & Web Solutions</div>
        </div>
      </div>
    );
  }

  if (catLower.includes("logis")) {
    return (
      <div className="relative h-32 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 p-4">
        <Truck className="absolute right-2 bottom-1 h-20 w-20 text-white/10" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <Truck className="h-3 w-3" /> Logistics & Cargo
          </span>
          <div className="text-xs font-semibold text-white/90">Distribution & Transit</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-32 w-full overflow-hidden rounded-t-2xl p-4 ${isNeed ? "bg-gradient-to-br from-[#0B2F6E] via-[#092557] to-[#1E40af]" : "bg-gradient-to-br from-slate-800 via-sky-900 to-[#0B2F6E]"}`}>
      <Briefcase className="absolute -right-4 -top-4 h-24 w-24 text-white/10" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          <Briefcase className="h-3 w-3" /> Business Opportunity
        </span>
        <div className="text-xs font-semibold text-white/90">{category || "Sinaptex Partner"}</div>
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const isNeed = opportunity.type.toUpperCase() === "NEED";
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl">
      <div className="relative">
        <CardCategoryBanner category={opportunity.category} type={opportunity.type} />
        <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm ${isNeed ? "bg-[#FF6B00] text-white" : "bg-[#0B2F6E] text-white"}`}>
              {opportunity.type}
            </span>
            {opportunity.urgent && (
              <span className="flex animate-pulse items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-sm">
                <Flame className="h-3 w-3" /> URGENT
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-md transition-all ${isBookmarked ? "bg-amber-500 text-white shadow-md" : "bg-black/30 text-white hover:bg-black/50"}`}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{opportunity.timeAgo}</span>
          <span className="flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5" />{opportunity.views} dilihat</span>
        </div>

        <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#0B2F6E]">
          {opportunity.title}
        </h3>

        {opportunity.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{opportunity.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1">
            <Tag className="h-3.5 w-3.5 text-slate-500" />
            <span>{opportunity.category}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{opportunity.location}</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimasi Budget / Harga</p>
          <div className="mt-1 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#0B2F6E]" />
            <span className="text-sm font-extrabold text-slate-900">{opportunity.budget}</span>
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0B2F6E] text-xs font-extrabold text-white shadow-xs">
                {opportunity.publisher ? opportunity.publisher.charAt(0).toUpperCase() : "P"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-bold text-slate-800">{opportunity.publisher}</span>
                  {opportunity.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-blue-600" />}
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Mitra Terverifikasi</span>
              </div>
            </div>
            <Link
              href={`/opportunities/${opportunity.id}`}
              className="flex h-9 items-center gap-1 rounded-xl bg-blue-50 px-3 text-xs font-bold text-[#0B2F6E] transition-colors group-hover:bg-[#0B2F6E] group-hover:text-white"
            >
              <span>Detail</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function OpportunitySkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="h-32 w-full animate-pulse bg-slate-200" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 h-3 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-16 w-full animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-200" />
              <div className="space-y-1">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-2 w-16 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PopularTags() {
  const tags = ["Desain Logo", "Kemasan Produk", "Digital Marketing", "Pengiriman Cargo", "Bahan Baku", "IT Software"];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#0B2F6E] hover:bg-blue-50 hover:text-[#0B2F6E]">
          {tag}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [language, setLanguage] = useState<"id" | "en">("id");

  const {
    data: opportunities,
    isLoading: isLoadingOpportunities,
    isError: isErrorOpportunities,
    error: errorOpportunities,
  } = useQuery({
    queryKey: ["opportunities", activeFilter, selectedCategory, selectedLocation, searchQuery],
    queryFn: () =>
      fetchOpportunities({
        type: activeFilter,
        category: selectedCategory,
        location: selectedLocation,
        search: searchQuery,
      }),
    staleTime: 60 * 1000,
    retry: 2,
  });

  const {
    data: categories,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const displayOpportunities = opportunities ?? staticOpportunities;
  const displayCategories = categories ?? staticCategories;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-[#0B2F6E] selection:text-white">
      {/* DYNAMIC NAVBAR */}
      <DynamicNavbar
        language={language}
        onLanguageChange={setLanguage}
        showAuth={true}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 pb-12 pt-6 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-[11px] font-extrabold text-[#0B2F6E]">
                <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>{language === "en" ? "#1 B2B & Smart Business Service Platform" : "Platform B2B & Layanan Bisnis Cerdas #1"}</span>
              </div>

              <h1 className="text-2xl font-black leading-[1.18] tracking-tight text-[#0B2F6E] sm:text-4xl lg:text-5xl">
                {language === "en" ? (
                  <>Find the best opportunities, <br className="hidden sm:inline" />build <span className="text-[#FF6B00]">business without limits</span></>
                ) : (
                  <>Temukan peluang terbaik, <br className="hidden sm:inline" />bangun <span className="text-[#FF6B00]">bisnis tanpa batas</span></>
                )}
              </h1>

              <p className="mt-3 max-w-xl text-xs leading-relaxed text-slate-600 sm:mt-4 sm:text-sm">
                {language === "en"
                  ? "Sinaptex connects your business needs with trusted solution providers. Find partners, services, and secure transactions in one ecosystem."
                  : "Sinaptex menghubungkan kebutuhan bisnis Anda dengan penyedia solusi terpercaya. Temukan partner, layanan, dan transaksi aman dalam satu ekosistem."}
              </p>

              {/* SEARCH */}
              <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xl shadow-slate-200/50 sm:mt-8">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
                  <div className="relative flex items-center sm:col-span-5">
                    <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === "en" ? "Search needs or offers..." : "Cari kebutuhan atau penawaran..."}
                      className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
                    />
                  </div>
                  <div className="border-t border-slate-200 pt-2 sm:col-span-3 sm:border-l sm:border-t-0 sm:pl-2 sm:pt-0">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full cursor-pointer bg-transparent px-2 py-2.5 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="">{language === "en" ? "All Categories" : "Semua Kategori"}</option>
                      <option value="desain">{language === "en" ? "Design & Creative" : "Desain & Kreatif"}</option>
                      <option value="pemasaran">{language === "en" ? "Marketing & Digital" : "Pemasaran & Digital"}</option>
                      <option value="it">{language === "en" ? "IT & Development" : "IT & Pengembangan"}</option>
                      <option value="produksi">{language === "en" ? "Production & Manufacturing" : "Produksi & Manufaktur"}</option>
                      <option value="logistik">{language === "en" ? "Logistics & Shipping" : "Logistik & Pengiriman"}</option>
                    </select>
                  </div>
                  <div className="border-t border-slate-200 pt-2 sm:col-span-2 sm:border-l sm:border-t-0 sm:pl-2 sm:pt-0">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full cursor-pointer bg-transparent px-2 py-2.5 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="">{language === "en" ? "All Locations" : "Semua Lokasi"}</option>
                      <option value="jakarta">Jakarta</option>
                      <option value="surabaya">Surabaya</option>
                      <option value="bandung">Bandung</option>
                      <option value="medan">Medan</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button className="w-full rounded-xl bg-[#0B2F6E] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#082352] active:scale-95">
                      {language === "en" ? "Search" : "Cari Peluang"}
                    </button>
                  </div>
                </div>
              </div>

              <PopularTags />
            </div>

            {/* RIGHT — Business Ecosystem Illustration */}
            <div className="hidden md:flex items-center justify-center lg:col-span-5">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
                <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                  <defs>
                    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0B2F6E" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#0B2F6E" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
                      <stop offset="50%" stopColor="#0B2F6E" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.25" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Background glow */}
                  <circle cx="160" cy="160" r="130" fill="url(#bgGlow)" />

                  {/* Outer Hexagon */}
                  <polygon points="160,25 275,90 275,230 160,295 45,230 45,90"
                    fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.35" />

                  {/* Inner Hexagon */}
                  <polygon points="160,60 240,105 240,215 160,260 80,215 80,105"
                    fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 5" opacity="0.2" />

                  {/* Hexagon edges */}
                  <line x1="160" y1="25" x2="275" y2="90" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
                  <line x1="275" y1="90" x2="275" y2="230" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
                  <line x1="275" y1="230" x2="160" y2="295" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
                  <line x1="160" y1="295" x2="45" y2="230" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
                  <line x1="45" y1="230" x2="45" y2="90" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
                  <line x1="45" y1="90" x2="160" y2="25" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />

                  {/* Spokes */}
                  <line x1="160" y1="160" x2="160" y2="25" stroke="#0B2F6E" strokeWidth="1.5" opacity="0.35" />
                  <line x1="160" y1="160" x2="275" y2="90" stroke="#0B2F6E" strokeWidth="1.5" opacity="0.35" />
                  <line x1="160" y1="160" x2="275" y2="230" stroke="#0B2F6E" strokeWidth="1.5" opacity="0.35" />
                  <line x1="160" y1="160" x2="160" y2="295" stroke="#0B2F6E" strokeWidth="1.5" opacity="0.35" />
                  <line x1="160" y1="160" x2="45" y2="230" stroke="#0B2F6E" strokeWidth="1.5" opacity="0.35" />
                  <line x1="160" y1="160" x2="45" y2="90" stroke="#0B2F6E" strokeWidth="1.5" opacity="0.35" />

                  {/* Pulse rings */}
                  <circle cx="160" cy="160" r="35" stroke="#0B2F6E" strokeWidth="1.5" fill="none" opacity="0.5">
                    <animate attributeName="r" values="35;75;35" dur="4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" repeatCount="indefinite" />
                  </circle>

                  {/* CENTER — SINAPTEX */}
                  <g>
                    <circle cx="160" cy="160" r="32" fill="#0B2F6E" filter="url(#glow)" />
                    <circle cx="160" cy="160" r="26" fill="#1E40AF" />
                    <circle cx="160" cy="160" r="22" fill="#0B2F6E" />
                    <text x="160" y="157" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="sans-serif" letterSpacing="0.5">SINAPTEX</text>
                    <text x="160" y="168" textAnchor="middle" fill="#93C5FD" fontSize="6" fontFamily="sans-serif" letterSpacing="1.5">ECOSYSTEM</text>
                    <circle cx="160" cy="160" r="29" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.4">
                      <animateTransform attributeName="transform" type="rotate" from="0 160 160" to="360 160 160" dur="20s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* NODE 1 — TOP (NEED) */}
                  <g>
                    <circle cx="160" cy="25" r="22" fill="white" stroke="#FF6B00" strokeWidth="2.5" filter="url(#glow)" />
                    <circle cx="160" cy="20" r="9" fill="#FED7AA" />
                    <text x="160" y="23" textAnchor="middle" fill="#C2410C" fontSize="9" fontWeight="800">N</text>
                    <text x="160" y="36" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="700" fontFamily="sans-serif">NEED</text>
                  </g>

                  {/* NODE 2 — TOP RIGHT (OFFER) */}
                  <g>
                    <circle cx="275" cy="90" r="22" fill="white" stroke="#0B2F6E" strokeWidth="2.5" filter="url(#glow)" />
                    <circle cx="275" cy="85" r="9" fill="#BFDBFE" />
                    <text x="275" y="88" textAnchor="middle" fill="#1D4ED8" fontSize="9" fontWeight="800">O</text>
                    <text x="275" y="101" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="700" fontFamily="sans-serif">OFFER</text>
                  </g>

                  {/* NODE 3 — BOTTOM RIGHT (MATCH) */}
                  <g>
                    <circle cx="275" cy="230" r="22" fill="white" stroke="#10B981" strokeWidth="2.5" filter="url(#glow)" />
                    <circle cx="275" cy="225" r="9" fill="#A7F3D0" />
                    <text x="275" y="228" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="800">M</text>
                    <text x="275" y="241" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="700" fontFamily="sans-serif">MATCH</text>
                  </g>

                  {/* NODE 4 — BOTTOM (DEAL) */}
                  <g>
                    <circle cx="160" cy="295" r="22" fill="white" stroke="#8B5CF6" strokeWidth="2.5" filter="url(#glow)" />
                    <circle cx="160" cy="290" r="9" fill="#DDD6FE" />
                    <text x="160" y="293" textAnchor="middle" fill="#6D28D9" fontSize="9" fontWeight="800">D</text>
                    <text x="160" y="306" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="700" fontFamily="sans-serif">DEAL</text>
                  </g>

                  {/* NODE 5 — BOTTOM LEFT (PARTNER) */}
                  <g>
                    <circle cx="45" cy="230" r="20" fill="white" stroke="#F59E0B" strokeWidth="2" filter="url(#glow)" />
                    <circle cx="45" cy="226" r="8" fill="#FDE68A" />
                    <text x="45" y="229" textAnchor="middle" fill="#B45309" fontSize="8" fontWeight="800">P</text>
                    <text x="45" y="240" textAnchor="middle" fill="#475569" fontSize="5" fontWeight="700" fontFamily="sans-serif">PARTNER</text>
                  </g>

                  {/* NODE 6 — TOP LEFT (GROW) */}
                  <g>
                    <circle cx="45" cy="90" r="20" fill="white" stroke="#EC4899" strokeWidth="2" filter="url(#glow)" />
                    <circle cx="45" cy="86" r="8" fill="#FBCFE8" />
                    <text x="45" y="89" textAnchor="middle" fill="#BE185D" fontSize="8" fontWeight="800">G</text>
                    <text x="45" y="100" textAnchor="middle" fill="#475569" fontSize="5" fontWeight="700" fontFamily="sans-serif">GROW</text>
                  </g>

                  {/* Data flow particles */}
                  <circle r="2" fill="#FF6B00" opacity="0.8">
                    <animateMotion path="M160,160 L160,25" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="2" fill="#0B2F6E" opacity="0.8">
                    <animateMotion path="M160,160 L275,90" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="2" fill="#10B981" opacity="0.8">
                    <animateMotion path="M160,160 L275,230" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle r="2" fill="#8B5CF6" opacity="0.8">
                    <animateMotion path="M160,160 L160,295" dur="2.1s" repeatCount="indefinite" />
                  </circle>
                  <circle r="2" fill="#F59E0B" opacity="0.8">
                    <animateMotion path="M160,160 L45,230" dur="2.3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="2" fill="#EC4899" opacity="0.8">
                    <animateMotion path="M160,160 L45,90" dur="1.9s" repeatCount="indefinite" />
                  </circle>
                </svg>

                {/* Label below */}
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-[#0B2F6E]">Ekosistem Bisnis</p>
                  <p className="text-[10px] text-slate-500">Terhubung • Cocok • Kolaborasi • Berkembang</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="border-y border-slate-200/80 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0B2F6E]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{language === "en" ? badge.title.replace("Peluang", "Opportunities").replace("Partner", "Partners") : badge.title}</h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OPPORTUNITIES */}
      <section id="peluang" className="border-b border-slate-200/70 bg-slate-50/70 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF6B00]"></span>
                <p className="text-xs font-black uppercase tracking-wider text-[#FF6B00]">{language === "en" ? "Explore Ecosystem" : "Eksplorasi Ekosistem"}</p>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#0B2F6E] sm:text-3xl">{language === "en" ? "Active Needs & Offers" : "Kebutuhan & Penawaran Aktif"}</h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                {language === "en" ? "Discover verified business opportunities with budget estimates and partner information." : "Temukan peluang bisnis terverifikasi lengkap dengan estimasi budget dan informasi mitra."}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-[#0B2F6E] sm:text-sm">
              {displayOpportunities.length} {language === "en" ? "Opportunities Available" : "Peluang Tersedia"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-7 flex items-center gap-2 overflow-x-auto pb-2">
            {["ALL", "NEED", "OFFER"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-bold transition ${activeFilter === f
                  ? "bg-[#0B2F6E] text-white shadow-md"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-[#0B2F6E] hover:text-[#0B2F6E]"
                  }`}
              >
                {f === "ALL" ? (language === "en" ? "All" : "Semua") : f === "NEED" ? (language === "en" ? "Needs" : "Kebutuhan (Need)") : (language === "en" ? "Offers" : "Penawaran (Offer)")}
              </button>
            ))}
          </div>

          {isErrorOpportunities && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{language === "en" ? "Failed to load opportunities" : "Gagal memuat data peluang"}</p>
                <p className="text-xs text-red-600">{errorOpportunities instanceof Error ? errorOpportunities.message : "Terjadi kesalahan"}</p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingOpportunities
              ? Array.from({ length: 6 }).map((_, i) => <OpportunitySkeleton key={i} />)
              : displayOpportunities.map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
          </div>

          {displayOpportunities.length === 0 && !isLoadingOpportunities && (
            <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <p className="font-bold text-slate-700">{language === "en" ? "No opportunities available in this category" : "Belum ada peluang tersedia pada kategori ini"}</p>
              <p className="mt-1 text-xs text-slate-500">{language === "en" ? "Try changing filters or search keywords." : "Coba ubah filter atau kata kunci pencarian Anda."}</p>
            </div>
          )}

          <div className="mt-10 text-center">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs font-bold text-[#0B2F6E] shadow-2xs transition hover:border-[#0B2F6E] hover:bg-blue-50">
              {language === "en" ? "Load More Business Opportunities" : "Muat Lebih Banyak Peluang Bisnis"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="kategori" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0B2F6E] sm:text-3xl">
              {language === "en" ? "Explore Opportunities by Category" : "Jelajahi Peluang Berdasarkan Kategori"}
            </h2>
          </div>

          {isLoadingCategories ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayCategories.map((cat) => {
                const Icon = iconMap[cat.icon] || LayoutGrid;
                const colorMap: Record<string, string> = {
                  "Desain & Kreatif": "bg-indigo-500/10 text-indigo-600",
                  "Pemasaran & Digital": "bg-orange-500/10 text-orange-600",
                  "IT & Pengembangan": "bg-blue-500/10 text-blue-600",
                  "Produksi & Manufaktur": "bg-emerald-500/10 text-emerald-600",
                  "Logistik & Pengiriman": "bg-cyan-500/10 text-cyan-600",
                  "Lainnya": "bg-slate-500/10 text-slate-600",
                };
                return (
                  <div
                    key={cat.id}
                    className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colorMap[cat.title] || "bg-slate-500/10 text-slate-600"}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-[#0B2F6E]">{cat.title}</h3>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">{cat.count}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara-kerja" className="border-t border-slate-100 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0B2F6E] sm:text-3xl">{language === "en" ? "How Sinaptex Works" : "Cara Kerja Sinaptex"}</h2>
          </div>
          <div className="relative">
            <div className="absolute left-[12%] right-[12%] top-10 hidden h-0.5 border-t-2 border-dashed border-slate-200 lg:block"></div>
            <div className="relative z-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => {
                const stepIcons: Record<string, React.ElementType> = {
                  UserPlus, Search, MessageSquare, CheckCircle2,
                };
                const Icon = stepIcons[step.icon] || CheckCircle2;
                return (
                  <div key={step.num} className="group flex flex-col items-center text-center">
                    <div className="relative mb-4 flex items-center justify-center">
                      <span className="absolute -left-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B00] text-xs font-bold text-white shadow-md">{step.num}</span>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0B2F6E] shadow-xs transition-all group-hover:scale-105 group-hover:bg-[#0B2F6E] group-hover:text-white">
                        <Icon className="h-7 w-7" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{language === "en" ? step.title : step.title}</h3>
                    <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">{language === "en" ? step.desc : step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#082250] p-8 text-white shadow-xl sm:p-12">
            <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
              <div className="max-w-2xl text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{language === "en" ? "Ready to grow your business?" : "Siap mengembangkan bisnis Anda?"}</h2>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/90">
                  {language === "en" ? "Join thousands of businesses & service providers on Sinaptex." : "Bergabung dengan ribuan pelaku bisnis & penyedia layanan di Sinaptex."}
                </p>
              </div>
              <Link
                href="/register"
                className="w-full rounded-xl bg-[#FF6B00] px-6 py-3.5 text-center text-xs font-extrabold text-white shadow-lg transition-all hover:bg-[#e05e00] active:scale-95 sm:w-auto"
              >
                {language === "en" ? "Sign Up Free Now" : "Daftar Gratis Sekarang"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div>© 2026 Sinaptex - {language === "en" ? "Smart Business & Service Ecosystem" : "Ekosistem Bisnis dan Layanan Cerdas"}. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-600">
            <a href="#" className="hover:text-[#0B2F6E]">{language === "en" ? "About Us" : "Tentang Kami"}</a>
            <a href="#" className="hover:text-[#0B2F6E]">{language === "en" ? "Terms" : "Syarat & Ketentuan"}</a>
            <a href="#" className="hover:text-[#0B2F6E]">{language === "en" ? "Privacy" : "Kebijakan Privasi"}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}