import { apiClient } from "@/lib/api-client";
import { Me, RegisterProfileInput } from "./auth.schema";

/** Normalisasi berbagai bentuk response backend menjadi Me */
function normalizeMe(raw: unknown): Me | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Langsung Me
  if (typeof r.id === "string" && (typeof r.fullName === "string" || typeof r.email === "string")) {
    return r as unknown as Me;
  }

  // { user, profile } atau { data: { user, profile } }
  const nested =
    (r.user as Record<string, unknown> | undefined) ||
    (r.profile as Record<string, unknown> | undefined) ||
    (r.data as Record<string, unknown> | undefined);

  if (nested && typeof nested === "object") {
    const id = (nested.id as string) || (r.userId as string) || (r.profileId as string);
    const fullName =
      (nested.fullName as string) ||
      (nested.name as string) ||
      (r.fullName as string);
    const email = (nested.email as string) || (r.email as string);
    if (id) {
      return {
        id,
        email: email || "",
        fullName: fullName || "",
        phone: (nested.phone as string) || undefined,
        isVerified: Boolean(nested.isVerified),
      };
    }
  }

  return null;
}

export const authApi = {
  register: async (input: RegisterProfileInput): Promise<Me | null> => {
    const raw = await apiClient.post<unknown>("/api/v1/auth/register", input);
    return normalizeMe(raw);
  },

  me: async (): Promise<Me> => {
    const raw = await apiClient.get<unknown>("/api/v1/auth/me");
    const me = normalizeMe(raw);
    if (!me) {
      // Fallback: anggap body sudah Me
      if (raw && typeof raw === "object" && "id" in (raw as object)) {
        return raw as Me;
      }
      throw new Error("Account not registered locally. Complete registration first.");
    }
    return me;
  },
};
