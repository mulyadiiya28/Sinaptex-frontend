"use client";

import React from "react";

interface SinaptexIconProps {
  size?: number | string;
  className?: string;
  idPrefix?: string;
}

/**
 * Brand mark: interlocking S (teal + orange) — Sinaptex
 */
export function SinaptexIcon({
  size = 32,
  className = "",
  idPrefix = "sx",
}: SinaptexIconProps) {
  const gradId = `${idPrefix}-grad`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Logo Sinaptex"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B2F6E" />
          <stop offset="45%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#FF6B00" />
        </linearGradient>
      </defs>
      {/* Upper loop — teal/blue */}
      <path
        d="M48 14C48 8 42 4 32 4C20 4 14 10 14 18C14 26 22 30 32 32C44 34 50 40 50 48C50 56 42 60 30 60"
        stroke="#0EA5E9"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lower loop — orange */}
      <path
        d="M16 42C16 48 22 52 32 52C44 52 50 46 50 38C50 30 42 26 32 24C20 22 14 16 14 8C14 0 22 -4 34 -4"
        stroke="#FF6B00"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      {/* Simplified continuous S mark */}
      <path
        d="M44 12C44 7 38 4 30 4C20 4 14 9 14 16C14 24 22 28 32 30C42 32 50 37 50 46C50 53 43 56 34 56C24 56 18 51 18 44"
        stroke={`url(#${gradId})`}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

interface SinaptexLogoProps {
  variant?: "horizontal" | "vertical" | "compact" | "icon-only" | "badge";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  iconClassName?: string;
  theme?: "auto" | "dark" | "light";
}

export function SinaptexLogo({
  variant = "horizontal",
  size = "md",
  showTagline,
  taglineText = "Ekosistem bisnis dan layanan cerdas",
  className = "",
  iconClassName = "",
  theme = "auto",
}: SinaptexLogoProps) {
  const sizeConfig = {
    xs: {
      iconSize: 22,
      titleClass: "text-sm font-bold tracking-tight",
      taglineClass: "text-[9px] tracking-normal",
      spacing: "gap-1.5",
    },
    sm: {
      iconSize: 28,
      titleClass: "text-base font-bold tracking-tight",
      taglineClass: "text-[10px] tracking-normal",
      spacing: "gap-2",
    },
    md: {
      iconSize: 36,
      titleClass: "text-xl font-bold tracking-tight",
      taglineClass: "text-xs tracking-normal",
      spacing: "gap-2.5",
    },
    lg: {
      iconSize: 48,
      titleClass: "text-2xl sm:text-3xl font-extrabold tracking-tight",
      taglineClass: "text-xs sm:text-sm tracking-normal",
      spacing: "gap-3.5",
    },
    xl: {
      iconSize: 64,
      titleClass: "text-3xl sm:text-4xl font-black tracking-tight",
      taglineClass: "text-sm sm:text-base tracking-normal",
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
      : variant === "horizontal" || variant === "vertical";

  if (variant === "icon-only") {
    return (
      <SinaptexIcon
        size={sizeConfig.iconSize}
        className={iconClassName || className}
      />
    );
  }

  if (variant === "badge") {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur ${className}`}
      >
        <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0B2F6E] to-[#FF6B00] p-2 shadow-inner">
          <SinaptexIcon size={sizeConfig.iconSize} className={iconClassName} />
        </div>
        <div className="flex flex-col">
          <span className={`${sizeConfig.titleClass} ${titleColor} leading-none`}>
            Sinaptex
          </span>
          {isTaglineVisible && (
            <span className={`mt-1 ${sizeConfig.taglineClass} ${tagColor} font-medium leading-tight`}>
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div
        className={`flex flex-col items-center text-center ${sizeConfig.spacing} ${className}`}
      >
        <SinaptexIcon
          size={sizeConfig.iconSize}
          className={`relative ${iconClassName}`}
        />
        <div className="flex flex-col items-center">
          <span className={`${sizeConfig.titleClass} ${titleColor} leading-tight`}>
            Sinaptex
          </span>
          {isTaglineVisible && (
            <span
              className={`mt-1 max-w-xs font-medium ${sizeConfig.taglineClass} ${tagColor} leading-snug`}
            >
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

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

  return (
    <div className={`flex items-center ${sizeConfig.spacing} ${className}`}>
      <div className="relative shrink-0">
        <SinaptexIcon size={sizeConfig.iconSize} className={iconClassName} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className={`${sizeConfig.titleClass} ${titleColor} leading-tight truncate`}>
          Sinaptex
        </span>
        {isTaglineVisible && (
          <span
            className={`${sizeConfig.taglineClass} ${tagColor} font-medium leading-tight truncate`}
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
}
