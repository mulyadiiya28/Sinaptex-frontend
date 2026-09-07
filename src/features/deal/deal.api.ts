import { apiClient } from "@/lib/api-client";
import { Deal, DealStatus } from "./deal.schema";

// list + update status (OpenAPI: /invitations/deals/me)
export const dealApi = {
  /** GET /invitations/deals/me */
  list: () => apiClient.get<Deal[]>("/api/v1/invitations/deals/me"),

  /** PATCH /invitations/deals/{id} */
  updateStatus: (id: string, status: DealStatus) =>
    apiClient.patch<Deal>(`/api/v1/invitations/deals/${id}`, { status }),
};
