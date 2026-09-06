// Utilities for PWA and Web Push Notifications with Serwist Service Worker

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isPushSupported()) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error("Failed to request notification permission:", error);
    return Notification.permission as NotificationPermissionState;
  }
}

/**
 * Subscribe browser ke Push Service menggunakan VAPID public key,
 * lalu kirim subscription object ke backend server.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.warn("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY belum di-set");
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
    });

    // Kirim ke backend
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });

    return subscription;
  } catch (err) {
    console.error("[Push] Subscription failed:", err);
    return null;
  }
}

/**
 * Unsubscribe dari Push Service.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      // Beritahu backend untuk menghapus subscription
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
    return true;
  } catch (err) {
    console.error("[Push] Unsubscribe failed:", err);
    return false;
  }
}

export async function sendLocalNotification(
  title: string,
  options: {
    body?: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
  } = {}
): Promise<boolean> {
  if (!isPushSupported()) return false;

  if (Notification.permission !== "granted") {
    const perm = await requestNotificationPermission();
    if (perm !== "granted") return false;
  }

  const payloadOptions: NotificationOptions = {
    body: options.body || "Pembaruan aktivitas bisnis di Sinaptex.",
    icon: options.icon || "/icons/icon-192x192.svg",
    badge: options.badge || "/icons/badge-72x72.svg",
    tag: options.tag || `sinaptex-${Date.now()}`,
    data: {
      url: options.url || "/",
    },
  };

  try {
    // Prefer service worker registration if active
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, payloadOptions);
        return true;
      }
    }

    // Fallback to Window Notification API
    new Notification(title, payloadOptions);
    return true;
  } catch (err) {
    console.error("Failed to show local notification:", err);
    try {
      new Notification(title, payloadOptions);
      return true;
    } catch {
      return false;
    }
  }
}

export async function registerSerwistServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  // Izinkan disable manual via env (berguna saat debugging)
  if (process.env.NEXT_PUBLIC_DISABLE_SW === "true") {
    console.log("[PushManager] SW registration skipped: NEXT_PUBLIC_DISABLE_SW=true");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    // Check for updates
    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("[Serwist] New content is available and will be used when all tabs are closed.");
          }
        });
      }
    });

    console.log("[Serwist] Service Worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.warn("[Serwist] Service worker registration failed:", error);
    return null;
  }
}

// Helper: Convert VAPID base64 key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/\_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
