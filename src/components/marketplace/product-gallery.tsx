"use client";

import { useState } from "react";
import Image from "next/image";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductMedia } from "@/features/marketplace/product/product.schema";

interface ProductGalleryProps {
  media: ProductMedia[];
  productName: string;
}

export function ProductGallery({ media, productName }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sortedMedia = [...media].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const active = sortedMedia[activeIdx];

  if (sortedMedia.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        <Package className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        <Image
          src={active.url}
          alt={productName}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {/* Navigation */}
        {sortedMedia.length > 1 && (
          <>
            <button
              onClick={() =>
                setActiveIdx((i) => (i === 0 ? sortedMedia.length - 1 : i - 1))
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white dark:bg-zinc-800/90"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </button>
            <button
              onClick={() =>
                setActiveIdx((i) => (i === sortedMedia.length - 1 ? 0 : i + 1))
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white dark:bg-zinc-800/90"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </button>
          </>
        )}

        {/* Counter */}
        {sortedMedia.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {activeIdx + 1} / {sortedMedia.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sortedMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sortedMedia.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setActiveIdx(idx)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                idx === activeIdx
                  ? "border-[#0B2F6E]"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
              }`}
            >
              <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}