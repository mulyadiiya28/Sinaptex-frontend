"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendLocalNotification,
  registerSerwistServiceWorker,
  subscribeToPush,
  NotificationPermissionState,
} from "@/lib/push-manager";
import { WifiOff, Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  promptInstall: () => Promise<void>;
  permission: NotificationPermissionState;
  requestPermission: () => Promise<NotificationPermissionState>;
  sendTestNotification: (title?: string, body?: string, url?: string) => Promise<boolean>;
  isOnline: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  isInstallable: false,
  promptInstall: async () => {},
  permission: "default",
  requestPermission: async () => "default",
  sendTestNotification: async () => false,
  isOnline: true,
});

export function usePWA() {
  return useContext(PWAContext);
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setPermission(getNotificationPermission());
    setIsOnline(navigator.onLine);

    registerSerwistServiceWorker();

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("sinaptex_install_dismissed");
      if (!dismissed && !isStandaloneMode()) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Sticky banner: tampilkan meski beforeinstallprompt belum fire (Chrome sering delay)
    const timer = window.setTimeout(() => {
      const dismissed = localStorage.getItem("sinaptex_install_dismissed");
      if (!dismissed && !isStandaloneMode()) {
        setShowInstallBanner(true);
        if (isIos()) setIosHint(true);
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
          setShowInstallBanner(false);
        }
      } catch (err) {
        console.warn("PWA install prompt error:", err);
      }
      return;
    }
    // Fallback: iOS / browser tanpa beforeinstallprompt
    setIosHint(true);
  }

  async function handleRequestPermission(): Promise<NotificationPermissionState> {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === "granted") {
      await sendLocalNotification("Notifikasi Sinaptex Aktif! 🚀", {
        body: "Anda akan menerima update match, deal, dan pesan baru.",
        url: "/notifications",
      });
      try {
        await subscribeToPush();
      } catch {
        /* non-blocking */
      }
    }
    return perm;
  }

  async function handleSendTestNotification(
    title = "Notifikasi Uji Coba Sinaptex",
    body = "Push notification berfungsi.",
    url = "/opportunities"
  ): Promise<boolean> {
    return sendLocalNotification(title, { body, url });
  }

  function handleDismissInstall() {
    setShowInstallBanner(false);
    localStorage.setItem("sinaptex_install_dismissed", "true");
  }

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isInstallable: Boolean(deferredPrompt) || !isInstalled,
        promptInstall,
        permission,
        requestPermission: handleRequestPermission,
        sendTestNotification: handleSendTestNotification,
        isOnline,
      }}
    >
      {children}

      {showOfflineBanner && (
        <div className="fixed bottom-20 left-0 right-0 z-[60] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg sm:bottom-24">
          <div className="flex items-center gap-2.5">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Mode Offline — konten dari cache.</span>
          </div>
          <button type="button" onClick={() => setShowOfflineBanner(false)} className="p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sticky install banner — full width bottom */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-0 left-0 right-0 z-[55] border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2F6E] text-white">
                <Download className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#0B2F6E]">Pasang Aplikasi Sinaptex</h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  {iosHint || isIos()
                    ? "Di iPhone/iPad: ketuk Share → Add to Home Screen."
                    : "Akses lebih cepat di layar utama & notifikasi real-time."}
                </p>
                {(iosHint || isIos()) && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                    <Share className="h-3 w-3" /> Safari → Bagikan → Ke Layar Utama
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDismissInstall}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Nanti
              </button>
              <button
                type="button"
                onClick={promptInstall}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B00] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-600"
              >
                <Download className="h-3.5 w-3.5" />
                {deferredPrompt ? "Pasang Sekarang" : isIos() ? "Cara Pasang" : "Pasang / Panduan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}
