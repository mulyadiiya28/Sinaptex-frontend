"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, ArrowLeft, Send, Inbox } from "lucide-react";
import { useMyInquiries, useReceivedInquiries } from "@/features/marketplace/inquiry/inquiry.hooks";
import { InquiryCard } from "@/components/marketplace/inquiry-card";
import { useSessionStore } from "@/store/use-session-store";

type Tab = "mine" | "received";

export default function InquiriesPage() {
  const me = useSessionStore((s) => s.me);
  const [tab, setTab] = useState<Tab>("mine");

  const { data: mine, isLoading: loadingMine } = useMyInquiries(Boolean(me) && tab === "mine");
  const { data: received, isLoading: loadingReceived } = useReceivedInquiries(
    Boolean(me) && tab === "received"
  );

  const isLoading = tab === "mine" ? loadingMine : loadingReceived;
  const inquiries = tab === "mine" ? mine : received;

  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <MessageSquare className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Masuk untuk Lihat Inquiry
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Anda perlu login untuk mengakses inquiry
        </p>
        <Link
          href="/login?redirect=/marketplace/inquiries"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white hover:bg-[#082352]"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-[#0B2F6E] dark:text-zinc-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Marketplace
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
            Inquiry
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 inline-flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setTab("mine")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === "mine"
                ? "bg-[#0B2F6E] text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Inquiry Saya
          </button>
          <button
            onClick={() => setTab("received")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === "received"
                ? "bg-[#0B2F6E] text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            Inquiry Diterima
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!inquiries || inquiries.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 dark:border-zinc-700 dark:bg-zinc-900">
            {tab === "mine" ? (
              <Send className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            ) : (
              <Inbox className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            )}
            <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {tab === "mine" ? "Belum ada inquiry" : "Belum ada inquiry diterima"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {tab === "mine"
                ? "Ajukan inquiry di halaman detail produk"
                : "Inquiry dari pembeli akan muncul di sini"}
            </p>
            {tab === "mine" && (
              <Link
                href="/marketplace"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#082352]"
              >
                Jelajahi Marketplace
              </Link>
            )}
          </div>
        )}

        {/* List */}
        {!isLoading && inquiries && inquiries.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {inquiries.map((inquiry) => (
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                variant={tab === "mine" ? "buyer" : "seller"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}