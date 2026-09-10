import { apiClient } from "@/lib/api-client";
import { Me, RegisterProfileInput } from "./auth.schema";

/**
 * Gabungkan user + profile dari berbagai bentuk response engine.
 *
 * Backend `auth.controller.js` benar-benar mengembalikan 2 bentuk berbeda
 * tergantung jalur mana yang kena:
 *
 *   (A) "Already registered" — `success(res, existing, ...)` di mana `existing`
 *       adalah baris User (top-level) dengan `existing.profile` ternested:
 *       { id: <User.id>, email, phone, profile: { id: <Profile.id>, fullName, ... } }
 *
 *   (B) Register baru sukses / GET /auth/me — mengembalikan baris Profile
 *       (top-level) dengan `user` ternested (hanya di jalur register; GET /me
 *       TIDAK include user sama sekali):
 *       { id: <Profile.id>, fullName, ..., user?: { id: <User.id>, email, ... } }
 *
 * BUG LAMA: kode sebelumnya cek `r.user || r.profile` lalu ambil
 * `profile?.id || user?.id` — pada bentuk (B), `profile` (var lokal dari
 * `r.profile`) selalu undefined (bentuk (B) tidak punya field `profile`
 * bersarang, DIA SENDIRI adalah profile-nya), sehingga jatuh ke `user?.id`
 * yaitu **User.id**, bukan Profile.id. Akibatnya `me.id` salah untuk semua
 * user yang BARU SAJA register (sebelum reload/refetch `/auth/me` pertama
 * kali) — bisa merembet ke fitur lain yang membandingkan `ownerId` terhadap
 * `me.id` (mis. cek kepemilikan Party/Escrow).
 *
 * Fix: deteksi bentuknya secara eksplisit lewat keberadaan `r.profile`
 * (bentuk A) vs tidak (bentuk B, `r` sendiri adalah profile), supaya `id`
 * SELALU Profile.id — konsisten dengan yang dipakai di seluruh app lain
 * (ownerId Party, dsb membandingkan ke Profile.id).
 */
function normalizeMe(raw: unknown): Me | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Bentuk (A): User row dengan `profile` ternested — dari "Already registered".
  const nestedProfile = r.profile as Record<string, unknown> | undefined;
  if (nestedProfile && typeof nestedProfile === "object") {
    const profileId = nestedProfile.id as string | undefined;
    if (!profileId) return null;
    return {
      id: profileId,
      email: String(r.email ?? nestedProfile.email ?? ""),
      fullName: String(nestedProfile.fullName ?? nestedProfile.name ?? ""),
      phone: (nestedProfile.phone as string) ?? (r.phone as string) ?? null,
      bio: (nestedProfile.bio as string) ?? null,
      location: (nestedProfile.location as string) ?? null,
      isVerified: Boolean(nestedProfile.isVerified),
      avatarUrl: (nestedProfile.avatarUrl as string) ?? null,
      accountStatus: (nestedProfile.accountStatus as string) ?? (r.accountStatus as string) ?? undefined,
      parties: (nestedProfile.parties as Me["parties"]) ?? (r.parties as Me["parties"]) ?? null,
      businessRoles:
        (nestedProfile.businessRoles as Me["businessRoles"]) ??
        (r.businessRoles as Me["businessRoles"]) ??
        null,
    };
  }

  // Bentuk (B): `r` SENDIRI adalah baris Profile — dari register sukses atau GET /auth/me.
  // Dikenali dari adanya `fullName` (field Profile) di top-level, atau minimal `id` bertipe string.
  if (typeof r.id === "string") {
    const nestedUser = r.user as Record<string, unknown> | undefined;
    return {
      id: r.id, // <- ini Profile.id, BUKAN User.id, karena `r` sendiri adalah baris Profile
      email: String(nestedUser?.email ?? r.email ?? ""),
      fullName: String(r.fullName ?? r.name ?? ""),
      phone: (r.phone as string) ?? (nestedUser?.phone as string) ?? null,
      bio: (r.bio as string) ?? null,
      location: (r.location as string) ?? null,
      isVerified: Boolean(r.isVerified),
      avatarUrl: (r.avatarUrl as string) ?? null,
      accountStatus: (r.accountStatus as string) ?? (nestedUser?.accountStatus as string) ?? undefined,
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
