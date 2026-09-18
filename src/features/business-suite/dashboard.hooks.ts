import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { BsDashboard } from "./dashboard.schema";

export const bsDashboardApi = {
  /** GET /parties/{partyId}/dashboard */
  get: (partyId: string, dateRange = "30d") =>
    apiClient.get<BsDashboard>(`/api/v1/parties/${partyId}/dashboard`, {
      params: { dateRange },
    }),
};

export function useBsDashboard(partyId: string, dateRange = "30d") {
  return useQuery({
    queryKey: ["business-suite", "dashboard", partyId, dateRange],
    queryFn: () => bsDashboardApi.get(partyId, dateRange),
    enabled: Boolean(partyId),
    staleTime: 30_000,
  });
}
