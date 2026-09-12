"use client";

import Image from "next/image";
import { BadgeCheck, User } from "lucide-react";
import { ProductReview } from "@/features/marketplace/review/review.schema";
import { StarRating } from "./star-rating";

interface ReviewItemProps {
  review: ProductReview;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReviewItem({ review }: ReviewItemProps) {
  const initial = review.reviewer?.fullName?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex gap-3 py-4">
      {/* Avatar */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {review.reviewer?.avatarUrl ? (
          <Image
            src={review.reviewer.avatarUrl}
            alt={review.reviewer.fullName ?? ""}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
            {initial !== "?" ? initial : <User className="h-4 w-4" />}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {review.reviewer?.fullName ?? "Pengguna"}
          </p>
          {review.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              <BadgeCheck className="h-3 w-3" />
              Terverifikasi
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          <span className="text-[11px] text-zinc-400">
            {formatDate(review.createdAt)}
          </span>
        </div>

        {review.comment && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {review.comment}
          </p>
        )}
      </div>
    </div>
  );
}