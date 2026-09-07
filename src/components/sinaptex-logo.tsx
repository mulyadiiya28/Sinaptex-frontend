"use client";

import Image from "next/image";

/** Path ke mark resmi di public/icons */
const LOGO_ICON_SRC = "/icons/icon-192x192.svg";
/** Full lockup (icon + text) bila dibutuhkan sebagai satu gambar */
const LOGO_FULL_SRC = "/icons/sinaptex-logo.svg";

const DEFAULT_TAGLINE = "Ekosistem Bisnis Dan Layanan Cerdas";

interface SinaptexIconProps {
  size?: number;
  className?: string;
  /** Gunakan full SVG lockup dari public (sudah berisi teks) */
  full?: boolean;
}

/** Icon mark dari public/icons */
export function SinaptexIcon({
  size = 32,
  className = "",
  full = false,
}: SinaptexIconProps) {
  if (full) {
    // Full lockup ~600x160 aspect
    const h = size;
    const w = Math.round(size * (600 / 160));
    return (
      <Image
        src={LOGO_FULL_SRC}
        alt="Sinaptex"
        width={w}
        height={h}
        className={`shrink-0 object-contain ${className}`}
        priority
      />
    );
  }

  return (
    <Image
      src={LOGO_ICON_SRC}
      alt="Sinaptex"
      width={size}
      height={size}
      className={`shrink-0 rounded-lg object-contain ${className}`}
      priority
    />
  );
}

interface SinaptexLogoProps {
  variant?: "horizontal" | "vertical" | "compact" | "icon-only" | "badge" | "full-image";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  iconClassName?: string;
  theme?: "auto" | "dark" | "light";
}

/**
 * Layout default (horizontal):
 *   [ICON]  Sinaptex
 *           Ekosistem Bisnis Dan Layanan Cerdas
 */
export function SinaptexLogo({
  variant = "horizontal",
  size = "md",
  showTagline,
  taglineText = DEFAULT_TAGLINE,
  className = "",
  iconClassName = "",
  theme = "auto",
}: SinaptexLogoProps) {
  const sizeConfig = {
    xs: {
      iconSize: 28,
      titleClass: "text-sm font-bold tracking-tight",
      taglineClass: "text-[9px] leading-tight",
      spacing: "gap-2",
    },
    sm: {
      iconSize: 36,
      titleClass: "text-base font-bold tracking-tight",
      taglineClass: "text-[10px] leading-tight",
      spacing: "gap-2.5",
    },
    md: {
      iconSize: 44,
      titleClass: "text-xl font-bold tracking-tight",
      taglineClass: "text-xs leading-tight",
      spacing: "gap-3",
    },
    lg: {
      iconSize: 56,
      titleClass: "text-2xl font-extrabold tracking-tight",
      taglineClass: "text-sm leading-tight",
      spacing: "gap-3.5",
    },
    xl: {
      iconSize: 72,
      titleClass: "text-3xl font-black tracking-tight",
      taglineClass: "text-base leading-tight",
      spacing: "gap-4",
    },
  }[size];

  const titleColor =
    theme === "light"
      ? "text-[#0B2F6E]"
      : theme === "dark"
        ? "text-white"
        : "text-[#0B2F6E] dark:text-white";

  const tagColor =
    theme === "light"
      ? "text-slate-500"
      : theme === "dark"
        ? "text-slate-400"
        : "text-slate-500 dark:text-slate-400";

  const isTaglineVisible =
    showTagline !== undefined
      ? showTagline
      : variant === "horizontal" || variant === "vertical" || variant === "badge";

  if (variant === "icon-only") {
    return (
      <SinaptexIcon
        size={sizeConfig.iconSize}
        className={iconClassName || className}
      />
    );
  }

  // Satu file SVG yang sudah berisi icon + brand + tagline
  if (variant === "full-image") {
    return (
      <SinaptexIcon
        full
        size={sizeConfig.iconSize}
        className={iconClassName || className}
      />
    );
  }

  const textBlock = (
    <div className="flex min-w-0 flex-col justify-center">
      <span className={`${sizeConfig.titleClass} ${titleColor} leading-none`}>
        Sinaptex
      </span>
      {isTaglineVisible && (
        <span
          className={`mt-0.5 ${sizeConfig.taglineClass} ${tagColor} font-medium`}
        >
          {taglineText}
        </span>
      )}
    </div>
  );

  // Icon kiri, brand + tagline kanan (di bawah brand)
  if (variant === "compact") {
    return (
      <div className={`flex items-center ${sizeConfig.spacing} ${className}`}>
        <SinaptexIcon size={sizeConfig.iconSize} className={iconClassName} />
        <span className={`${sizeConfig.titleClass} ${titleColor} leading-none`}>
          Sinaptex
        </span>
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div
        className={`flex items-center ${sizeConfig.spacing} rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur ${className}`}
      >
        <SinaptexIcon size={sizeConfig.iconSize} className={iconClassName} />
        {textBlock}
      </div>
    );
  }

  if (variant === "vertical") {
    // Icon di atas, teks di bawah (tetap brand lalu tagline)
    return (
      <div
        className={`flex flex-col items-center text-center ${sizeConfig.spacing} ${className}`}
      >
        <SinaptexIcon size={sizeConfig.iconSize} className={iconClassName} />
        <div className="flex flex-col items-center">
          <span className={`${sizeConfig.titleClass} ${titleColor} leading-none`}>
            Sinaptex
          </span>
          {isTaglineVisible && (
            <span
              className={`mt-1 max-w-[14rem] ${sizeConfig.taglineClass} ${tagColor} font-medium`}
            >
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // horizontal (default): [ICON] Brand / Tagline di kanan
  return (
    <div className={`flex items-center ${sizeConfig.spacing} ${className}`}>
      <SinaptexIcon size={sizeConfig.iconSize} className={iconClassName} />
      {textBlock}
    </div>
  );
}
