'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/features/notification/notification.api';
import { AppNotification } from '@/features/notification/notification.schema';

export function NotificationBellLink() {
  const { data } = useQuery<AppNotification[]>({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationApi.list(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: false,
  });

  const unreadCount = (data ?? []).filter((n) => !n.isRead).length;

  return (
    <Link
      href="/notifications"
      className="relative rounded-full p-2 text-zinc-600 transition hover:bg-slate-100 hover:text-[#0B2F6E]"
      aria-label="Notifikasi"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF6B00] px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
