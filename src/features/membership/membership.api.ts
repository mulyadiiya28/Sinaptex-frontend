import { apiClient } from "@/lib/api-client";
import { MembershipPlan, MembershipStatus } from "./membership.schema";

/** Katalog fallback jika API plans kosong / belum di-seed */
export const FALLBACK_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "plan_monthly",
    name: "Pro Membership",
    billingCycle: "MONTHLY",
    price: 299000,
  },
  {
    id: "plan_yearly",
    name: "Pro Annual",
    billingCycle: "YEARLY",
    price: 2890000,
  },
];

function normalizePlans(raw: unknown): MembershipPlan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const p = item as Record<string, unknown>;
      const id = String(p.id ?? p.planId ?? "");
      if (!id) return null;
      const cycle = String(p.billingCycle ?? p.interval ?? "MONTHLY").toUpperCase();
      return {
        id,
        name: String(p.name ?? p.title ?? id),
        billingCycle: (cycle === "YEARLY" || cycle === "YEAR" ? "YEARLY" : "MONTHLY") as
          | "MONTHLY"
          | "YEARLY",
        price: Number(p.price ?? p.amount ?? 0),
      } satisfies MembershipPlan;
    })
    .filter(Boolean) as MembershipPlan[];
}

export const membershipApi = {
  plans: async (): Promise<MembershipPlan[]> => {
    try {
      const raw = await apiClient.get<unknown>("/api/v1/membership/plans");
      const plans = normalizePlans(raw);
      return plans.length > 0 ? plans : FALLBACK_MEMBERSHIP_PLANS;
    } catch {
      // Endpoint boleh belum stabil — tampilkan katalog fallback
      return FALLBACK_MEMBERSHIP_PLANS;
    }
  },

  /**
   * Backend saat ini: /membership/status sering 404.
   * Default akun gratis agar halaman tidak error.
   */
  status: async (): Promise<MembershipStatus> => {
    try {
      const raw = await apiClient.get<unknown>("/api/v1/membership/status");
      if (raw && typeof raw === "object") {
        const s = raw as Record<string, unknown>;
        return {
          isActive: Boolean(s.isActive ?? s.active),
          expiresAt: (s.expiresAt as string) ?? (s.expires_at as string) ?? null,
          planId: (s.planId as string) ?? (s.plan_id as string) ?? null,
        };
      }
    } catch {
      // Route not found / unauthorized — anggap free tier
    }
    return { isActive: false, expiresAt: null, planId: null };
  },

  checkout: (planId: string) =>
    apiClient.post<{ checkoutUrl?: string; paymentUrl?: string }>(
      "/api/v1/membership/checkout",
      { planId }
    ),
};
