import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partyApi } from "./party.api";
import { CreatePartyInput, UpdatePartyInput } from "./party.schema";

export const partyKeys = {
  all: ["parties"] as const,
  mine: () => ["parties", "mine"] as const,
  detail: (id: string) => ["parties", "detail", id] as const,
};

/** List Party milik Profile yang login (mis. dropdown "posting sebagai") */
export function useMyParties() {
  return useQuery({
    queryKey: partyKeys.mine(),
    queryFn: () => partyApi.list(),
  });
}

/** Detail Party (publik) — dipakai di halaman profil Party / Opportunity detail */
export function useParty(id: string) {
  return useQuery({
    queryKey: partyKeys.detail(id),
    queryFn: () => partyApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePartyInput) => partyApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partyKeys.mine() });
    },
  });
}

export function useUpdateParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePartyInput }) =>
      partyApi.update(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: partyKeys.mine() });
      queryClient.invalidateQueries({ queryKey: partyKeys.detail(id) });
    },
  });
}

export function useAddCapability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partyId, name }: { partyId: string; name: string }) =>
      partyApi.addCapability(partyId, name),
    onSuccess: (_data, { partyId }) => {
      queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyId) });
      queryClient.invalidateQueries({ queryKey: partyKeys.mine() });
    },
  });
}

export function useRemoveCapability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partyId, capabilityId }: { partyId: string; capabilityId: string }) =>
      partyApi.removeCapability(partyId, capabilityId),
    onSuccess: (_data, { partyId }) => {
      queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyId) });
      queryClient.invalidateQueries({ queryKey: partyKeys.mine() });
    },
  });
}
