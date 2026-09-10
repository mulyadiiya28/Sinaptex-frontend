import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Aktifkan SW juga di development agar PWA bisa diuji tanpa production build.
  // Set NEXT_PUBLIC_DISABLE_SW=true jika ingin mematikan SW di dev.
  disable: process.env.NEXT_PUBLIC_DISABLE_SW === "true",
  reloadOnOnline: false,
});

/**
 * PR-1 fix: SEBELUMNYA hostname API engine (`cahayaastera.com`) di-hardcode
 * di sini, ikut berubah tiap kali domain backend berganti (staging/production
 * beda domain). Sekarang diturunkan dari `NEXT_PUBLIC_API_URL` (env yang sama
 * dipakai `api-client.ts`) — kalau env belum di-set, pattern ini cuma
 * di-skip (bukan error keras di sini; `api-client.ts` yang bertanggung
 * jawab fail-fast untuk env wajib itu saat runtime app jalan).
 */
function apiHostRemotePattern() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!raw) return null;
  try {
    const { hostname, protocol } = new URL(
      /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    );
    return {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
    };
  } catch {
    return null;
  }
}

const apiHostPattern = apiHostRemotePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      ...(apiHostPattern ? [apiHostPattern] : []),
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  output: "standalone",
  turbopack: {},
};

export default withSerwist(nextConfig);
