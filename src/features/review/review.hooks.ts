import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "./review.api";
import { CreateReviewInput } from "./review.schema";

export function useProfileReviews(profileId: string) {
  return useQuery({
    queryKey: ["reviews", "profile", profileId],
    queryFn: () => reviewApi.listForProfile(profileId),
    enabled: Boolean(profileId),
  });
}

/** Alias lama agar pemanggilan usePartyReviews tidak break */
export function usePartyReviews(partyId: string) {
  return useProfileReviews(partyId);
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}
