import { create } from "zustand";
import { Me } from "@/features/auth/auth.schema";

/**
 * Cache ringan profil user yang sedang login di client (bukan sumber kebenaran —
 * source of truth tetap Supabase session + `useMe()` dari React Query).
 */
interface SessionState {
  me: Me | null;
  setMe: (me: Me | null) => void;
  /**
   * true selama proses logout berlangsung (dari klik "Keluar" sampai redirect
   * selesai). Dipakai RequireAuth supaya tahu redirect "tidak ada sesi" ini
   * hasil aksi user yang disengaja → arahkan ke beranda ("/"), bukan ke
   * /login?redirect=... seperti kasus sesi habis/belum login.
   */
  isLoggingOut: boolean;
  setIsLoggingOut: (value: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  me: null,
  setMe: (me) => set({ me }),
  isLoggingOut: false,
  setIsLoggingOut: (isLoggingOut) => set({ isLoggingOut }),
}));
