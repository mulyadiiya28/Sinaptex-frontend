"use client";

import { useState } from "react";
import {
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notification/notification.hooks";
import { notificationText } from "@/features/notification/notification.schema";
import { PushNotificationSettings } from "@/components/push-notification-settings";
import { Bell, Settings } from "lucide-react";

const typeLabel: Record<string, string> = {
  CHAT_MESSAGE: "Chat",
  REVIEW_RECEIVED: "Review",
  VERIFICATION_STATUS: "Verifikasi",
  DEAL_UPDATE: "Deal",
  INVITATION_NEW: "Invitation",
  MEMBERSHIP_REMINDER: "Membership",
  VERIFICATION_RESULT: "Verifikasi",
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"list" | "settings">("list");
  const { data, isLoading, error, refetch, isFetching } = useNotifications();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();

  const items = data ?? [];

  async function handleMarkRead(id: string, isRead: boolean) {
    if (isRead) return;
    try {
      await markRead.mutateAsync(id);
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    const unreadItems = items.filter((n) => !n.isRead);
    await Promise.allSettled(unreadItems.map((n) => markRead.mutateAsync(n.id)));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
            Notifikasi & PWA
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {unread > 0
              ? `${unread} belum dibaca · update real-time via Socket.IO & Web Push`
              : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "list" && (
            <>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {isFetching ? "Memuat…" : "Refresh"}
              </button>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={markRead.isPending}
                  className="rounded-lg bg-[#0B2F6E] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#082352] disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Tandai semua dibaca
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
            activeTab === "list"
              ? "bg-[#0B2F6E] text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <Bell className="h-4 w-4" />
          Daftar Notifikasi {unread > 0 && `(${unread})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
            activeTab === "settings"
              ? "bg-[#0B2F6E] text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <Settings className="h-4 w-4" />
          Setelan Push & PWA Serwist
        </button>
      </div>

      {activeTab === "settings" ? (
        <PushNotificationSettings />
      ) : (
        <>
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
              {error instanceof Error ? error.message : "Gagal memuat notifikasi"}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
              <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Belum ada notifikasi.
              </p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id, n.isRead)}
                    className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3.5 text-left transition ${
                      n.isRead
                        ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                        : "border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {typeLabel[n.type] ?? n.type}
                      </span>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                      <time className="ml-auto text-[11px] text-zinc-400">
                        {new Date(n.createdAt).toLocaleString("id-ID")}
                      </time>
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {n.title}
                    </span>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {notificationText(n)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
