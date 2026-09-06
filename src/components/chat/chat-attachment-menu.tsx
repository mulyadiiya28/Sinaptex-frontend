"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Camera, Image as ImageIcon } from "lucide-react";

export interface SelectedAttachment {
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

interface ChatAttachmentMenuProps {
  onSelectImage: (attachment: SelectedAttachment) => void;
  disabled?: boolean;
}

export function ChatAttachmentMenu({ onSelectImage, disabled }: ChatAttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again if cancelled
    e.target.value = "";

    const previewUrl = URL.createObjectURL(file);
    onSelectImage({
      file,
      previewUrl,
      name: file.name,
      size: file.size,
    });

    setIsOpen(false);
  };

  const handleTriggerCamera = () => {
    setIsOpen(false);
    cameraInputRef.current?.click();
  };

  const handleTriggerLibrary = () => {
    setIsOpen(false);
    libraryInputRef.current?.click();
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Hidden inputs for Camera and Library */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Attachment Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 ${
          isOpen ? "ring-2 ring-blue-500 border-transparent text-blue-600" : ""
        }`}
        title="Lampirkan gambar (Kamera atau Galeri)"
        aria-label="Lampirkan gambar dari kamera atau galeri"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      {/* Popup Menu */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 z-30 mb-2 w-56 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10"
          style={{ animation: "fadeIn 0.15s ease-out" }}
        >
          <div className="px-2 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            Pilih Sumber Foto
          </div>

          <button
            type="button"
            onClick={handleTriggerCamera}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
              <Camera className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Kamera</p>
              <p className="text-[10px] text-zinc-400">Ambil foto langsung</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleTriggerLibrary}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
              <ImageIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Galeri Foto</p>
              <p className="text-[10px] text-zinc-400">Pilih dari galeri / perangkat</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export function AttachmentPreview({
  previewUrl,
  fileName,
  fileSize,
  onRemove,
}: {
  previewUrl: string;
  fileName: string;
  fileSize?: number;
  onRemove: () => void;
}) {
  const formattedSize = fileSize
    ? fileSize > 1024 * 1024
      ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(fileSize / 1024)} KB`
    : null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center gap-2.5 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={fileName}
          className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {fileName}
          </p>
          {formattedSize && (
            <p className="text-[10px] text-zinc-400">{formattedSize}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        title="Batal lampirkan foto"
      >
        ✕
      </button>
    </div>
  );
}
