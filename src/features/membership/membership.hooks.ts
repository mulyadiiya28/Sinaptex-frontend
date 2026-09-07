import { useMutation, useQuery } from "@tanstack/react-query";
import { membershipApi } from "./membership.api";

export function useMembershipPlans() {
  return useQuery({
    queryKey: ["membership", "plans"],
    queryFn: membershipApi.plans,
    staleTime: 60_000,
  });
}

export function useMembershipStatus() {
  return useQuery({
    queryKey: ["membership", "status"],
    queryFn: membershipApi.status,
    staleTime: 30_000,
    // Jangan retry keras — endpoint bisa 404
    retry: 1,
  });
}

export function useMembershipCheckout() {
  return useMutation({
    mutationFn: async (planId: string) => {
      const data = await membershipApi.checkout(planId);
      return {
        checkoutUrl: data?.checkoutUrl || data?.paymentUrl || "",
      };
    },
  });
}
