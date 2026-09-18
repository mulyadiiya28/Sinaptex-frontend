import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contactApi } from "./contact.api";
import { ContactType, CreateContactInput } from "./contact.schema";

export function useContacts(partyId: string, type?: ContactType) {
  return useQuery({
    queryKey: ["contacts", partyId, type],
    queryFn: () => contactApi.list(partyId, type),
    enabled: Boolean(partyId),
  });
}

export function useCreateContact(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContactInput) => contactApi.create(partyId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts", partyId] }),
  });
}

export function useUpdateContact(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, input }: { contactId: string; input: Partial<CreateContactInput> }) =>
      contactApi.update(partyId, contactId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts", partyId] }),
  });
}

export function useDeleteContact(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => contactApi.remove(partyId, contactId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts", partyId] }),
  });
}
