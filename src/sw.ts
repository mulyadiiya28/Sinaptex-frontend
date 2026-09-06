/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Push notification event listener
self.addEventListener("push", (event: PushEvent) => {
  let payload: { title?: string; body?: string; url?: string; icon?: string; tag?: string } = {};

  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    payload = {
      title: "Notifikasi Sinaptex",
      body: event.data ? event.data.text() : "Ada pembaruan aktivitas bisnis di akun Anda.",
    };
  }

  const title = payload.title || "Sinaptex — Notifikasi Baru";
  const options: NotificationOptions = {
    body: payload.body || "Cek penawaran, kecocokan mitra, atau pesan baru sekarang.",
    icon: payload.icon || "/icons/icon-192x192.svg",
    badge: "/icons/badge-72x72.svg",
    tag: payload.tag || "sinaptex-notification",
    data: {
      url: payload.url || "/opportunities",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Push notification click event listener
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList: readonly Client[]) => {
        for (let i = 0; i < clientList.length; i++) {
          let item = clientList[i];

          if ("url" in item && item.url.includes(targetUrl) && "focus" in item) {
            return (item as WindowClient).focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

serwist.addEventListeners();
