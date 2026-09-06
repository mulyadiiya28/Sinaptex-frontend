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
      {
        protocol: "https",
        hostname: "cahayaastera.com",
      },
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
