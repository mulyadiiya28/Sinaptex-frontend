'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type ApiMenuItem = {
  id: string;
  label: string;
  icon?: string;
  url?: string;
  linkType: 'ROUTE' | 'EXTERNAL' | 'CATEGORY' | 'PAGE';
  categoryId?: string;
  pageSlug?: string;
  openInNewTab: boolean;
  order: number;
  children?: ApiMenuItem[];
};

export function resolveHref(item: ApiMenuItem): string {
  if (item.linkType === 'EXTERNAL') return item.url || '#';
  if (item.linkType === 'CATEGORY') return `/marketplace?category=${item.categoryId}`;
  if (item.linkType === 'PAGE') return `/pages/${item.pageSlug}`;
  return item.url || '#';
}

export function useNavigation(placement: 'HEADER' | 'SIDEBAR' | 'FOOTER') {
  return useQuery({
    queryKey: ['navigation', placement],
    queryFn: () => apiClient.get<ApiMenuItem[]>('/navigation/resolve', { params: { placement } }),
    staleTime: 5 * 60 * 1000,
  });
}
