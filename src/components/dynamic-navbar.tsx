"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  Home,
  Store,
  Briefcase,
  Info,
  HelpCircle,
  Phone,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

/* ═══════════════════════════════════════════════
   API CONTRACT / TYPE DEFINITIONS
   ═══════════════════════════════════════════════

   Backend harus menyediakan endpoint:

   GET /api/v1/navigation/public

   Response:
   {
     "success": true,
     "data": [
       {
         "id": "nav-001",
         "label": "Beranda",
         "labelEn": "Home",
         "href": "/",
         "icon": "Home",
         "position": "primary",
         "order": 1,
         "isExternal": false,
         "children": []
       },
       {
         "id": "nav-002",
         "label": "Marketplace",
         "labelEn": "Marketplace",
         "href": "/marketplace",
         "icon": "Store",
         "position": "primary",
         "order": 2,
         "isExternal": false,
         "children": [
           {
             "id": "nav-002-1",
             "label": "Kebutuhan (Need)",
             "href": "/marketplace?type=need",
             "icon": "Briefcase"
           },
           {
             "id": "nav-002-2",
             "label": "Penawaran (Offer)",
             "href": "/marketplace?type=offer",
             "icon": "Store"
           }
         ]
       }
     ]
   }

   ═══════════════════════════════════════════════ */

export interface NavItemChild {
  id: string;
  label: string;
  labelEn?: string;
  href: string;
  icon?: string;
  description?: string;
}

export interface NavItem {
  id: string;
  label: string;
  labelEn?: string;
  href: string;
  icon?: string;
  position: "primary" | "secondary" | "footer" | "mobile";
  order: number;
  isExternal?: boolean;
  children?: NavItemChild[];
  badge?: string;
  requiresAuth?: boolean;
}

export interface NavigationResponse {
  success: boolean;
  data: NavItem[];
}

/* ═══════════════════════════════════════════════
   ICON MAPPER
   ═══════════════════════════════════════════════ */

const iconMap: Record<string, React.ElementType> = {
  Home,
  Store,
  Briefcase,
  Info,
  HelpCircle,
  Phone,
  Globe,
  Menu,
};

function NavIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

/* ═══════════════════════════════════════════════
   STATIC FALLBACK DATA (Public Content)
   ═══════════════════════════════════════════════ */

const staticNavItems: NavItem[] = [
  {
    id: "nav-home",
    label: "Beranda",
    labelEn: "Home",
    href: "/",
    icon: "Home",
    position: "primary",
    order: 1,
  },
  {
    id: "nav-marketplace",
    label: "Marketplace",
    labelEn: "Marketplace",
    href: "/marketplace",
    icon: "Store",
    position: "primary",
    order: 2,
    children: [
      {
        id: "nav-marketplace-need",
        label: "Kebutuhan (Need)",
        labelEn: "Needs",
        href: "/marketplace?type=need",
        icon: "Briefcase",
        description: "Temukan kebutuhan bisnis dari mitra",
      },
      {
        id: "nav-marketplace-offer",
        label: "Penawaran (Offer)",
        labelEn: "Offers",
        href: "/marketplace?type=offer",
        icon: "Store",
        description: "Jelajahi layanan dan produk tersedia",
      },
    ],
  },
  {
    id: "nav-opportunities",
    label: "Peluang Bisnis",
    labelEn: "Opportunities",
    href: "/opportunities",
    icon: "Briefcase",
    position: "primary",
    order: 3,
  },
  {
    id: "nav-about",
    label: "Tentang Kami",
    labelEn: "About Us",
    href: "/about",
    icon: "Info",
    position: "primary",
    order: 4,
  },
  {
    id: "nav-help",
    label: "Bantuan",
    labelEn: "Help",
    href: "/help",
    icon: "HelpCircle",
    position: "secondary",
    order: 5,
  },
  {
    id: "nav-contact",
    label: "Kontak",
    labelEn: "Contact",
    href: "/contact",
    icon: "Phone",
    position: "secondary",
    order: 6,
  },
];

/* ═══════════════════════════════════════════════
   API FETCHER
   ═══════════════════════════════════════════════ */

async function fetchNavigation(): Promise<NavItem[]> {
  try {
    const response = await apiClient.get<NavigationResponse>("/api/v1/navigation/public");
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return staticNavItems;
  } catch {
    // Fallback ke static data jika API belum tersedia
    return staticNavItems;
  }
}

/* ═══════════════════════════════════════════════
   DYNAMIC NAVBAR COMPONENT
   ═══════════════════════════════════════════════ */

interface DynamicNavbarProps {
  /** Override nav items dari parent (opsional) */
  items?: NavItem[];
  /** Bahasa aktif: 'id' | 'en' */
  language?: "id" | "en";
  /** Callback saat language berubah */
  onLanguageChange?: (lang: "id" | "en") => void;
  /** Tampilkan tombol auth? */
  showAuth?: boolean;
}

export function DynamicNavbar({
  items: propItems,
  language = "id",
  onLanguageChange,
  showAuth = true,
}: DynamicNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  /* ── Fetch dari API ── */
  const {
    data: fetchedItems,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["navigation", "public"],
    queryFn: fetchNavigation,
    staleTime: 5 * 60 * 1000, // 5 menit cache
    retry: 1,
    enabled: !propItems, // Jika prop items diberikan, skip fetch
  });

  const navItems = propItems ?? fetchedItems ?? staticNavItems;

  /* ── Filter public items only ── */
  const primaryItems = navItems
    .filter((item) => item.position === "primary" && !item.requiresAuth)
    .sort((a, b) => a.order - b.order);

  const secondaryItems = navItems
    .filter((item) => item.position === "secondary" && !item.requiresAuth)
    .sort((a, b) => a.order - b.order);

  /* ── Helper: active state ── */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  /* ── Helper: label berdasarkan bahasa ── */
  const getLabel = (item: NavItem | NavItemChild) => {
    return language === "en" && item.labelEn ? item.labelEn : item.label;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0B2F6E] via-[#092557] to-[#FF6B00] p-0.5 shadow-md">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
              <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 22C8 18.6863 10.6863 16 14 16H18C21.3137 16 24 13.3137 24 10C24 6.68629 21.3137 4 18 4H10" stroke="#0B2F6E" strokeWidth="4" strokeLinecap="round" />
                <path d="M24 10C24 13.3137 21.3137 16 18 16H14C10.6863 16 8 18.6863 8 22C8 25.3137 10.6863 28 14 28H22" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#0B2F6E] leading-none">Sinaptex</span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider hidden sm:block">
              {language === "en" ? "Smart Business Ecosystem" : "Ekosistem Bisnis Cerdas"}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            primaryItems.map((item) => (
              <div key={item.id} className="relative">
                {item.children && item.children.length > 0 ? (
                  /* Dropdown Menu */
                  <div
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        isActive(item.href)
                          ? "text-[#0B2F6E] bg-blue-50/50"
                          : "text-slate-600 hover:text-[#0B2F6E] hover:bg-slate-50"
                      }`}
                    >
                      <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                      {getLabel(item)}
                      <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === item.id ? "rotate-180" : ""}`} />
                      {item.badge && (
                        <span className="ml-1 rounded-full bg-[#FF6B00] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {openDropdown === item.id && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            className="flex items-start gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-blue-50"
                          >
                            <div className="mt-0.5 shrink-0">
                              <NavIcon name={child.icon} className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{getLabel(child)}</p>
                              {child.description && (
                                <p className="mt-0.5 text-[10px] text-slate-500">{child.description}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single Link */
                  <Link
                    href={item.href}
                    target={item.isExternal ? "_blank" : undefined}
                    rel={item.isExternal ? "noopener noreferrer" : undefined}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive(item.href)
                        ? "text-[#0B2F6E] bg-blue-50/50 font-bold"
                        : "text-slate-600 hover:text-[#0B2F6E] hover:bg-slate-50"
                    }`}
                  >
                    <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                    {getLabel(item)}
                    {item.badge && (
                      <span className="ml-1 rounded-full bg-[#FF6B00] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))
          )}

          {isError && (
            <span className="text-[10px] text-red-500" title="Gagal memuat navigasi">
              !
            </span>
          )}
        </nav>

        {/* Right Side: Language + Auth */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <span>{language.toUpperCase()}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-28 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    onLanguageChange?.("id");
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-semibold hover:bg-slate-100 ${
                    language === "id" ? "text-[#0B2F6E] bg-blue-50/50" : ""
                  }`}
                >
                  ID (Indonesia)
                </button>
                <button
                  onClick={() => {
                    onLanguageChange?.("en");
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-semibold hover:bg-slate-100 ${
                    language === "en" ? "text-[#0B2F6E] bg-blue-50/50" : ""
                  }`}
                >
                  EN (English)
                </button>
              </div>
            )}
          </div>

          {/* Auth Buttons */}
          {showAuth && (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-[#0B2F6E] transition-all hover:bg-slate-100"
              >
                {language === "en" ? "Sign In" : "Masuk"}
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#0B2F6E] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#082352] active:scale-95"
              >
                {language === "en" ? "Sign Up Free" : "Daftar Gratis"}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {primaryItems.map((item) => (
              <div key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (!item.children) setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? "text-[#0B2F6E] bg-blue-50"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <NavIcon name={item.icon} className="h-4 w-4" />
                  {getLabel(item)}
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-[#FF6B00] px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {item.children && item.children.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      >
                        <NavIcon name={child.icon} className="h-3.5 w-3.5" />
                        {getLabel(child)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Divider */}
            <div className="my-2 border-t border-slate-100" />

            {/* Secondary Items */}
            {secondaryItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
              >
                <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                {getLabel(item)}
              </Link>
            ))}

            {/* Mobile Auth */}
            {showAuth && (
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl border border-slate-300 py-2.5 text-center text-sm font-bold text-[#0B2F6E]"
                >
                  {language === "en" ? "Sign In" : "Masuk"}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-[#0B2F6E] py-2.5 text-center text-sm font-bold text-white"
                >
                  {language === "en" ? "Sign Up Free" : "Daftar Gratis"}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

/* ═══════════════════════════════════════════════
   EXPORT DEFAULT
   ═══════════════════════════════════════════════ */

export default DynamicNavbar;