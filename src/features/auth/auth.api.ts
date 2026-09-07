import { apiClient } from "@/lib/api-client";
import { Me, RegisterProfileInput } from "./auth.schema";

/** Gabungkan user + profile dari berbagai bentuk response engine */
function normalizeMe(raw: unknown): Me | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Envelope sudah di-unwrap apiClient → body bisa { user, profile } atau flat Me
  const user = (r.user as Record<string, unknown> | undefined) || undefined;
  const profile = (r.profile as Record<string, unknown> | undefined) || undefined;

  if (user || profile) {
    const id =
      (profile?.id as string) ||
      (user?.id as string) ||
      (r.profileId as string) ||
      (r.userId as string);
    if (!id) return null;
    return {
      id,
      email: String(user?.email ?? r.email ?? ""),
      fullName: String(
        profile?.fullName ?? profile?.name ?? user?.fullName ?? r.fullName ?? ""
      ),
      phone: (profile?.phone as string) ?? (r.phone as string) ?? null,
      bio: (profile?.bio as string) ?? null,
      location: (profile?.location as string) ?? null,
      isVerified: Boolean(profile?.isVerified ?? r.isVerified),
      avatarUrl: (profile?.avatarUrl as string) ?? null,
      accountStatus: (user?.accountStatus as string) ?? undefined,
      parties: (r.parties as Me["parties"]) ?? null,
      businessRoles: (r.businessRoles as Me["businessRoles"]) ?? null,
    };
  }

  // Flat Me
  if (typeof r.id === "string") {
    return {
      id: r.id,
      email: String(r.email ?? ""),
      fullName: String(r.fullName ?? r.name ?? ""),
      phone: (r.phone as string) ?? null,
      bio: (r.bio as string) ?? null,
      location: (r.location as string) ?? null,
      isVerified: Boolean(r.isVerified),
      avatarUrl: (r.avatarUrl as string) ?? null,
      accountStatus: r.accountStatus as string | undefined,
      parties: (r.parties as Me["parties"]) ?? null,
      businessRoles: (r.businessRoles as Me["businessRoles"]) ?? null,
    };
  }

  return null;
}

export const authApi = {
  /**
   * POST /auth/register — WAJIB sukses di backend agar User+Profile tercipta.
   * Jangan anggap sukses hanya dari token Supabase.
   */
  register: async (input: RegisterProfileInput): Promise<Me> => {
    const raw = await apiClient.post<unknown>("/api/v1/auth/register", input);
    const fromRegister = normalizeMe(raw);

    // Verifikasi sumber kebenaran: GET /auth/me harus sukses setelah register
    try {
      await new Promise((r) => setTimeout(r, 300));
      const meRaw = await apiClient.get<unknown>("/api/v1/auth/me");
      const me = normalizeMe(meRaw);
      if (me?.id) return me;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Jika register HTTP ok tapi me masih not registered → backend tidak menyimpan
      if (fromRegister?.id) return fromRegister;
      throw new Error(
        msg.includes("not registered") || msg.includes("Complete registration")
          ? "Server belum menyimpan User/Profile. Cek token JWT Supabase di backend (verifySupabaseToken) dan response POST /auth/register."
          : msg
      );
    }

    if (fromRegister?.id) return fromRegister;

    throw new Error(
      "Register tidak mengembalikan profil. Periksa Network → POST /api/v1/auth/register (status & body)."
    );
  },

  me: async (): Promise<Me> => {
    const raw = await apiClient.get<unknown>("/api/v1/auth/me");
    const me = normalizeMe(raw);
    if (!me?.id) {
      throw new Error("Account not registered locally. Complete registration first.");
    }
    return me;
  },
};
