"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Star, ShieldCheck } from "lucide-react";
import { useProduct } from "@/features/marketplace/product/product.hooks";
import { ProductGallery } from "@/components/marketplace/product-gallery";
import { ProductActions } from "@/components/marketplace/product-actions";
import { ReviewSection } from "@/components/marketplace/review-section";

export default function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { data: product, isLoading, error } = useProduct(id);

    // Loading
    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-2">
                    <div className="aspect-square animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-4">
                        <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-6 w-1/2 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                </div>
            </div>
        );
    }

    // Error
    if (error || !product) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <Package className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700" />
                <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Produk Tidak Ditemukan
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                    Produk yang Anda cari tidak ada atau sudah dihapus
                </p>
                <Link
                    href="/marketplace"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white hover:bg-[#082352]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Marketplace
                </Link>
            </div>
        );
    }

    const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;
    const sectorLabel =
        product.sector === "GOODS"
            ? "Barang"
            : product.sector === "SERVICE"
                ? "Jasa"
                : "Properti";

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Breadcrumb */}
            <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-[#0B2F6E] dark:text-zinc-400"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Marketplace
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Gallery */}
                    <ProductGallery media={product.media ?? []} productName={product.name} />

                    {/* Info */}
                    <div className="space-y-6">
                        {/* Category + Sector + Featured */}
                        <div className="flex flex-wrap items-center gap-2">
                            {product.category && (
                                <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    {product.category.name}
                                </span>
                            )}
                            <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0B2F6E] dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400">
                                {sectorLabel}
                            </span>
                            {product.isFeatured && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-[#FF6B00] px-2.5 py-1 text-[11px] font-bold text-white">
                                    <Star className="h-3 w-3 fill-white" />
                                    Unggulan
                                </span>
                            )}
                        </div>

                        {/* Name */}
                        <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                            {product.name}
                        </h1>

                        {/* Price Box */}
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                Harga
                            </p>
                            <p className="mt-1 text-3xl font-black text-[#0B2F6E] dark:text-blue-400">
                                {formatPrice(product.price)}
                                <span className="ml-2 text-sm font-normal text-zinc-400">
                                    / {product.baseUnit}
                                </span>
                            </p>
                            {product.stock > 0 ? (
                                <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    Stok tersedia: {product.stock} {product.baseUnit}
                                </p>
                            ) : (
                                <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                                    Stok habis
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <ProductActions product={product} />

                        {/* Vendor */}
                        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B2F6E] text-lg font-black text-white">
                                {product.party?.name?.charAt(0).toUpperCase() ?? "V"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                                        {product.party?.name ?? "Vendor"}
                                    </p>
                                    {product.party?.verificationStatus === "APPROVED" && (
                                        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Vendor Terverifikasi
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                                    Deskripsi
                                </h2>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Review Section */}
            <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
                <ReviewSection productId={product.id} />
            </div>
        </div>
    );
}