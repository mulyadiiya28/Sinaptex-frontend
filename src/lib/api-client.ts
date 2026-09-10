import { getAccessToken } from "@/lib/supabase-client";

/**
 * PR-1 fix: SEBELUMNYA fungsi ini diam-diam fallback ke
 * `https://cahayaastera.com` (server PRODUKSI) kalau env kosong/salah —
 * artinya developer yang lupa/salah set `.env.local` bisa tanpa sadar
 * membaca ATAU MENULIS data ke production. Sekarang: fail-fast dengan
 * pesan error yang jelas saat module di-load, bukan fallback diam-diam.
 */
export function resolveApiBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  url = url.replace(/^[\\"'"]+|[\\"'"]+$/g, "").trim();

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL wajib di-set (lihat .env.example). " +
        "Aplikasi sengaja TIDAK fallback ke server production untuk mencegah " +
        "dev environment tanpa sadar membaca/menulis data ke production."
    );
  }

  // Ensure protocol
  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith("localhost") || url.startsWith("127.0.0.1")) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }

  return url.replace(/\/+$/, "");
}

/**
 * Base URL API engine — WAJIB di-set lewat NEXT_PUBLIC_API_URL, lihat .env.example.
 */
export const BASE_URL = resolveApiBaseUrl();


export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
};

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
};

function buildUrl(path: string, params?: FetchOptions["params"]) {
  let cleanPath = path;
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }

  // Jika BASE_URL sudah berakhiran /api/v1 dan path juga diawali /api/v1, hindari duplikasi
  if (BASE_URL.endsWith("/api/v1") && cleanPath.startsWith("/api/v1/")) {
    cleanPath = cleanPath.substring("/api/v1".length);
  }

  const url = new URL(`${BASE_URL}${cleanPath}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function requestRaw<T>(path: string, options: FetchOptions = {}): Promise<ApiEnvelope<T> | T> {
  const { params, auth = true, headers, signal, ...init } = options;

  const authHeaders: Record<string, string> = {};

  if (auth) {
    try {
      const token = await getAccessToken();
      if (token) authHeaders.Authorization = `Bearer ${token}`;
    } catch {
      // ignore token fetch error if offline
    }
  }

  // Gunakan AbortSignal timeout jika tidak disediakan secara custom
  let fetchSignal = signal;
  if (!fetchSignal && typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    fetchSignal = AbortSignal.timeout(10_000);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      ...init,
      signal: fetchSignal,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error / Server unreachable";
    throw new Error(`Koneksi ke backend engine gagal: ${errorMsg}`);
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error ?? message;
    } catch {
      // response bukan JSON
    }
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<ApiEnvelope<T> | T>;
}

/** Ambil `data` dari envelope engine; fallback ke body mentah jika bukan envelope. */
async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const body = await requestRaw<T>(path, options);
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}

/** Sama seperti request, tapi ikut mengembalikan `meta` pagination jika ada. */
async function requestWithMeta<T>(
  path: string,
  options: FetchOptions = {}
): Promise<{ data: T; meta?: PaginationMeta }> {
  const body = await requestRaw<T>(path, options);
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    const env = body as ApiEnvelope<T>;
    return { data: env.data, meta: env.meta };
  }
  return { data: body as T };
}

export const apiClient = {
  get: <T,>(path: string, options?: FetchOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  getWithMeta: <T,>(path: string, options?: FetchOptions) =>
    requestWithMeta<T>(path, { ...options, method: "GET" }),
  post: <T,>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: <T,>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: <T,>(path: string, body?: unknown, options?: FetchOptions) =>
    request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: <T,>(path: string, options?: FetchOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

