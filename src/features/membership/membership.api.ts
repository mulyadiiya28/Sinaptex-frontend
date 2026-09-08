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
   * FIX: backend TIDAK punya endpoint /membership/status (makanya selalu 404
   * sebelumnya). Endpoint yang benar adalah GET /membership/me
   * (lihat membership.routes.js: router.get('/me', requireVerifiedSession(), getMyMembership))
   * — mengembalikan objek Membership Prisma langsung, dengan field
   * `status`: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' (bukan boolean isActive/active).
   */
  status: async (): Promise<MembershipStatus> => {
    try {
      const raw = await apiClient.get<unknown>("/api/v1/membership/me");
      if (raw && typeof raw === "object") {
        const s = raw as Record<string, unknown>;
        const statusText = String(s.status ?? "").toUpperCase();
        return {
          isActive: statusText === "ACTIVE",
          expiresAt: (s.expiresAt as string) ?? null,
          planId: (s.planId as string) ?? null,
        };
      }
    } catch {
      // Belum login / belum pernah punya membership (getOrCreateMembership
      // akan auto-create baris INACTIVE, jadi 404 di sini seharusnya cuma
      // terjadi kalau session tidak terverifikasi) — anggap free tier.
    }
    return { isActive: false, expiresAt: null, planId: null };
  },

  /** GET /membership/transactions/me — riwayat transaksi checkout membership milik sendiri. */
  transactions: async (): Promise<unknown[]> => {
    try {
      const raw = await apiClient.get<unknown>("/api/v1/membership/transactions/me");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },

  checkout: (planId: string) =>
    apiClient.post<{ checkoutUrl?: string; paymentUrl?: string }>(
      "/api/v1/membership/checkout",
      { planId }
    ),
};
