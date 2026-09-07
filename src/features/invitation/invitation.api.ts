import { apiClient } from "@/lib/api-client";
import { CreateInvitationInput, Invitation } from "./invitation.schema";

// create, respond, list (OpenAPI)
export const invitationApi = {
  /** POST /invitations */
  create: (input: CreateInvitationInput) =>
    apiClient.post<Invitation>("/api/v1/invitations", input),

  /** PATCH /invitations/{id}/respond */
  respond: (id: string, action: "ACCEPTED" | "REJECTED") =>
    apiClient.patch<Invitation>(`/api/v1/invitations/${id}/respond`, { action }),

  /** GET /invitations/me */
  list: () => apiClient.get<Invitation[]>("/api/v1/invitations/me"),
};
