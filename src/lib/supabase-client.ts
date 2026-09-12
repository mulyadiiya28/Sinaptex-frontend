import { createClient } from "@supabase/supabase-js";

/**
 * PR-6 fix: SEBELUMNYA fungsi ini:
 *  1. Fallback diam-diam ke `https://placeholder.supabase.co` +
 *     `placeholder-anon-key` kalau env kosong/invalid — app tetap boot,
 *     tapi SEMUA request auth pasti gagal, dan errornya baru kelihatan jauh
 *     di downstream (di tengah flow login/register), bukan saat startup.
 *  2. Ada regex untuk "menyelamatkan" kasus salah paste (mis. seluruh baris
 *     .env ikut ke-paste ke satu variabel) — ini memperbaiki GEJALA, bukan
 *     akar masalah (harusnya developer benerin .env-nya, bukan aplikasi
 *     menebak-nebak apa yang dimaksud).
 *
 * Sekarang: validasi sederhana (trim + strip quotes saja, TANPA regex
 * ekstraksi), throw kalau invalid — fail-fast, pesan error mengarahkan ke
 * .env.example.
 */
function resolveSupabaseConfig(): { url: string; anonKey: string } {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "");
  const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "");

  if (!rawUrl || !rawKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib di-set " +
        "(lihat .env.example, ambil dari Supabase Dashboard > Project Settings > API)."
    );
  }

  let origin: string;
  try {
    origin = new URL(rawUrl).origin;
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL tidak valid: "${rawUrl}". ` +
        'Harus URL lengkap, contoh: "https://xxxxx.supabase.co" (tanpa tanda kutip di .env).'
    );
  }

  return { url: origin, anonKey: rawKey };
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Ambil access token Supabase yang sedang aktif.
 * Dipakai api-client untuk header `Authorization: Bearer <token>`
 * sesuai cara auth backend engine (lihat README engine bagian "Autentikasi").
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
