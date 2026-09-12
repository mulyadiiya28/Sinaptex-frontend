"use client";

import { useState } from "react";
import { Star, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { useProductReviews, useCreateReview } from "@/features/marketplace/review/review.hooks";
import { useSessionStore } from "@/store/use-session-store";
import { ReviewItem } from "./review-item";
import { StarRating } from "./star-rating";

interface ReviewSectionProps {
  productId: string;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const me = useSessionStore((s) => s.me);
  const { data, isLoading, error } = useProductReviews(productId);
  const createReview = useCreateReview(productId);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reviews = data?.data ?? [];
  const total = reviews.length;
  const avgRating =
    total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

  // Cek apakah user sudah pernah review
  const myReview = me ? reviews.find((r) => r.reviewerId === me.id) : null;
  const canReview = Boolean(me) && !myReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rating < 1 || rating > 5) {
      setErrorMsg("Pilih rating 1-5 bintang");
      return;
    }

    try {
      await createReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
      });
      setShowForm(false);
      setRating(5);
      setComment("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal mengirim ulasan");
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Ulasan Produk
          </h2>
          {total > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={avgRating} size="md" />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-400">({total} ulasan)</span>
            </div>
          )}
        </div>

        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2F6E] px-3 py-2 text-xs font-bold text-white hover:bg-[#082352]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Beri Ulasan
          </button>
        )}
      </div>

      {/* Form Review */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5">
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onChange={setRating}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Komentar (opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ceritakan pengalaman Anda dengan produk ini..."
              className="mt-1 w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <p className="mt-1 text-right text-[10px] text-zinc-400">
              {comment.length}/2000
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createReview.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0B2F6E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#082352] disabled:opacity-50"
            >
              {createReview.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Star className="h-3.5 w-3.5" />
              )}
              Kirim Ulasan
            </button>
          </div>
        </form>
      )}

      {/* Not logged in */}
      {!me && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Masuk untuk memberikan ulasan produk ini</span>
        </div>
      )}

      {/* Already reviewed */}
      {myReview && !showForm && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          ✓ Anda sudah memberikan ulasan untuk produk ini
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
          Gagal memuat ulasan: {(error as Error)?.message ?? "Coba lagi"}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && total === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-300 py-8 text-center dark:border-zinc-700">
          <Star className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Belum ada ulasan
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            Jadilah yang pertama memberikan ulasan
          </p>
        </div>
      )}

      {/* Review List */}
      {!isLoading && reviews.length > 0 && (
        <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}