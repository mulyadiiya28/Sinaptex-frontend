import { createClient } from "@supabase/supabase-js";

function parseSupabaseConfig(): { url: string; anonKey: string } {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  let rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (rawUrl) {
    // Handle cases where quotes or multiple variables were pasted into NEXT_PUBLIC_SUPABASE_URL
    const urlMatch = rawUrl.match(/(https?:\/\/[^\s"'\\]+)/);
    if (urlMatch) {
      if (!rawKey || rawKey === "placeholder-anon-key") {
        const keyMatch = rawUrl.match(/(?:ANON_KEY|anon_key|KEY|key)\s*=\s*["'\\]?([A-Za-z0-9-_.]+)/i);
        if (keyMatch) {
          rawKey = keyMatch[1];
        }
      }
      rawUrl = urlMatch[1];
    }
  }

  // Strip wrapping quotes and backslashes
  rawUrl = rawUrl.replace(/^[\\"'"]+|[\\"'"]+$/g, "").trim();
  if (rawKey) {
    rawKey = rawKey.replace(/^[\\"'"]+|[\\"'"]+$/g, "").trim();
  }

  let finalUrl = "https://placeholder.supabase.co";
  try {
    if (rawUrl) {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        finalUrl = parsed.origin;
      }
    }
  } catch {
    if (typeof window !== "undefined") {
      console.warn("Invalid NEXT_PUBLIC_SUPABASE_URL provided, falling back to placeholder:", rawUrl);
    }
    finalUrl = "https://placeholder.supabase.co";
  }

  const finalKey = rawKey || "placeholder-anon-key";
  return { url: finalUrl, anonKey: finalKey };
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = parseSupabaseConfig();

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window !== "undefined") {
    console.warn(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set di environment variables"
    );
  }
}

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
