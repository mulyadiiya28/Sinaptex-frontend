// Serwist / PWA Service Worker for Sinaptex
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification event listener
self.addEventListener("push", (event) => {
  let payload = {};

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
  const options = {
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
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const item = clientList[i];
          if ("url" in item && item.url.includes(targetUrl) && "focus" in item) {
            return item.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
