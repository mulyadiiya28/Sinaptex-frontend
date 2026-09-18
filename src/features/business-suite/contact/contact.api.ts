import { apiClient } from "@/lib/api-client";
import { Contact, ContactType, CreateContactInput } from "./contact.schema";

export const contactApi = {
  /** GET /parties/{partyId}/contacts?type=... */
  list: (partyId: string, type?: ContactType) =>
    apiClient.get<Contact[]>(`/api/v1/parties/${partyId}/contacts`, {
      params: type ? { type } : undefined,
    }),

  get: (partyId: string, contactId: string) =>
    apiClient.get<Contact>(`/api/v1/parties/${partyId}/contacts/${contactId}`),

  create: (partyId: string, input: CreateContactInput) =>
    apiClient.post<Contact>(`/api/v1/parties/${partyId}/contacts`, input),

  update: (partyId: string, contactId: string, input: Partial<CreateContactInput>) =>
    apiClient.patch<Contact>(`/api/v1/parties/${partyId}/contacts/${contactId}`, input),

  remove: (partyId: string, contactId: string) =>
    apiClient.delete<null>(`/api/v1/parties/${partyId}/contacts/${contactId}`),
};
