"use client";

import { useEffect } from "react";
import { X, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  imageUrl: string | null;
  caption?: string;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, caption, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!imageUrl) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-4xl flex-col items-center overflow-hidden rounded-2xl bg-zinc-950 p-2 shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/90 active:scale-95"
          aria-label="Tutup pratinjau"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex max-h-[80vh] items-center justify-center overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={caption || "Pratinjau gambar"}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>

        {caption && (
          <div className="mt-2 w-full px-3 py-1.5 text-center">
            <p className="text-xs font-medium text-zinc-300">{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatImageThumb({
  src,
  alt,
  onOpen,
}: {
  src: string;
  alt?: string;
  onOpen: (url: string) => void;
}) {
  return (
    <div
      onClick={() => onOpen(src)}
      className="group/img relative mt-1 cursor-pointer overflow-hidden rounded-xl border border-black/10 transition-transform active:scale-[0.99] dark:border-white/10"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || "Lampiran gambar"}
        className="max-h-64 w-full rounded-xl object-cover transition-transform duration-200 group-hover/img:scale-[1.02]"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/img:bg-black/25 group-hover/img:opacity-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md">
          <ZoomIn className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
