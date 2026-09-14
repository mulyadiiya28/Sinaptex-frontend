'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Shield,
} from 'lucide-react';
import { useSessionStore } from '@/store/use-session-store';
import { supabase } from '@/lib/supabase-client';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const me = useSessionStore((s) => s.me);
  const setIsLoggingOut = useSessionStore((s) => s.setIsLoggingOut);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace('/');
      setTimeout(() => setIsLoggingOut(false), 1000);
    }
  };

  const initial = me?.fullName?.charAt(0)?.toUpperCase() || 'U';
  const fullName = me?.fullName || 'Pengguna';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 p-0.5 pr-2 transition hover:border-[#0B2F6E]/30 hover:shadow-sm"
        aria-label="Menu akun"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B2F6E] text-xs font-bold text-white">
          {initial}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <div className="text-xs text-zinc-400">Masuk sebagai</div>
            <div className="truncate text-sm font-semibold text-zinc-900">
              {fullName}
            </div>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-slate-50"
          >
            <LayoutDashboard className="h-4 w-4 text-zinc-400" /> Dashboard
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-slate-50"
          >
            <User className="h-4 w-4 text-zinc-400" /> Profil
          </Link>
          <Link
            href="/membership"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-slate-50"
          >
            <Shield className="h-4 w-4 text-zinc-400" /> Membership
          </Link>
          <Link
            href="/profile/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-slate-50"
          >
            <Settings className="h-4 w-4 text-zinc-400" /> Pengaturan
          </Link>

          <hr className="border-slate-100" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      )}
    </div>
  );
}
