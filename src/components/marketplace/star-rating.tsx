"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  /** Nilai rating 0-5 */
  rating: number;
  /** Total bintang yang ditampilkan (default: 5) */
  max?: number;
  /** Ukuran bintang */
  size?: "sm" | "md" | "lg";
  /** Interaktif — bisa diklik */
  interactive?: boolean;
  /** Callback saat rating berubah (kalau interaktif) */
  onChange?: (rating: number) => void;
}

const SIZE_CLASSES = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

export function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined}>
      {stars.map((star) => {
        const isFilled = star <= Math.round(rating);
        const Comp = interactive ? "button" : "span";

        return (
          <Comp
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onChange?.(star) : undefined}
            className={
              interactive
                ? "transition-transform hover:scale-110 focus:outline-none"
                : ""
            }
            aria-label={interactive ? `Beri rating ${star} bintang` : undefined}
          >
            <Star
              className={`${sizeClass} ${
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
              }`}
            />
          </Comp>
        );
      })}
    </div>
  );
}