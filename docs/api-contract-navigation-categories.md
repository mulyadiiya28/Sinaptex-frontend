# API Contract Proposal — `navigation/public` & `categories`

Status: **DRAFT — belum diimplementasikan di backend.**
Disusun oleh: Tim Frontend (Sinaptex-frontend), berdasarkan kebutuhan aktual di
`src/components/dynamic-navbar.tsx` dan `src/app/page.tsx`, plus field
`categoryId` yang sudah dipakai di modul `Opportunity` dan `Party`.

Base URL: `https://cahayaastera.com/api/v1` (mengikuti konvensi endpoint lain).

---

## 1. `GET /navigation/public`

### Tujuan
Menyediakan struktur menu navbar secara dinamis dari backend (bukan hardcode di
frontend), supaya perubahan menu tidak perlu deploy ulang frontend. Item menu
bisa berbeda tergantung status login & role user (mis. item "Admin Panel" cuma
muncul untuk ADMIN, item "Membership" menampilkan badge beda untuk member aktif).

### Autentikasi
**Opsional, bukan wajib** — endpoint tetap bisa diakses tanpa token (guest),
tapi kalau header `Authorization: Bearer <token>` dikirim dan valid, backend
boleh mempersonalisasi hasil.

> ⚠️ **Catatan keamanan**: role sebaiknya **tidak** diambil dari query param
> yang dikirim client (bisa dipalsukan), tapi dari sesi yang sudah diverifikasi
> backend (mirip pola `req.profile` di modul lain). Query param `role` di bawah
> hanya untuk kebutuhan testing/preview, bukan sumber kebenaran filtering saat
> ada token yang valid.

### Request

```
GET /api/v1/navigation/public?role=GUEST
Authorization: Bearer <token>   (opsional)
```

| Query param | Wajib? | Nilai | Keterangan |
|---|---|---|---|
| `role` | Tidak | `GUEST` \| `MEMBER` \| `VERIFIED_MEMBER` \| `ADMIN` | Hanya dipakai kalau **tidak ada token** (preview mode). Kalau ada token valid, backend abaikan param ini dan tentukan role dari sesi. |

### Resolusi role di backend (saat ada token valid)

| Kondisi | Role efektif |
|---|---|
| Tidak ada token / token invalid | `GUEST` |
| Token valid, `profile.isVerified === false` | `MEMBER` |
| Token valid, `profile.isVerified === true` | `VERIFIED_MEMBER` |
| Token valid, `profile.roles` mengandung `ADMIN` | `ADMIN` (superset — dapat semua item non-admin juga) |

### Response `200`

```jsonc
{
  "success": true,
  "message": "Navigation retrieved",
  "data": [
    {
      "id": "nav-home",
      "label": "Beranda",
      "labelEn": "Home",
      "href": "/",
      "icon": "Home",
      "position": "primary",     // "primary" | "secondary" | "footer" | "mobile"
      "order": 1,
      "isExternal": false,
      "requiresAuth": false,
      "visibleToRoles": ["GUEST", "MEMBER", "VERIFIED_MEMBER", "ADMIN"], // opsional; kalau field ini di-omit, dianggap visible untuk semua role
      "badge": null,              // opsional, mis. "Baru", "PRO"
      "children": []              // opsional, untuk dropdown/submenu
    },
    {
      "id": "nav-membership",
      "label": "Membership",
      "href": "/membership",
      "icon": "Crown",
      "position": "primary",
      "order": 6,
      "requiresAuth": true,
      "visibleToRoles": ["MEMBER", "VERIFIED_MEMBER"],
      "badge": "PRO"
    },
    {
      "id": "nav-admin",
      "label": "Admin Panel",
      "href": "/admin",
      "icon": "ShieldCheck",
      "position": "secondary",
      "order": 99,
      "requiresAuth": true,
      "visibleToRoles": ["ADMIN"]
    }
  ]
}
```

### Field `NavItem` (sudah didefinisikan di frontend, `dynamic-navbar.tsx`)

| Field | Tipe | Wajib? | Keterangan |
|---|---|---|---|
| `id` | string | ✔ | Unik |
| `label` | string | ✔ | Label bahasa Indonesia (default) |
| `labelEn` | string | Tidak | Label bahasa Inggris |
| `href` | string | ✔ | |
| `icon` | string | Tidak | Nama icon, harus salah satu dari set yang didukung frontend: `Home, Store, Briefcase, Info, HelpCircle, Phone, Globe, Menu, MessageSquare` (lihat `iconMap` di `dynamic-navbar.tsx` — kalau backend mau nambah icon baru, koordinasi dulu ke frontend) |
| `position` | enum | ✔ | `primary` \| `secondary` \| `footer` \| `mobile` |
| `order` | number | ✔ | Urutan tampil (ascending) |
| `isExternal` | boolean | Tidak | Default `false` |
| `requiresAuth` | boolean | Tidak | Kalau `true` dan user belum login, frontend akan sembunyikan/redirect ke login |
| `visibleToRoles` | string[] | Tidak | Kalau di-omit, tampil untuk semua role |
| `badge` | string \| null | Tidak | |
| `children` | `NavItemChild[]` | Tidak | Submenu, struktur: `{id, label, labelEn?, href, icon?, description?}` |

### Error
- `200` selalu dikembalikan meski kosong (`data: []`) — endpoint publik, jangan pernah 401/403 untuk request tanpa token.
- `500` kalau ada error server → frontend sudah punya fallback ke `staticNavItems` lokal.

---

## 2. `GET /categories`

### Tujuan
Taxonomy kategori yang dipakai bersama oleh `Opportunity.categoryId` dan
`Party.categoryId` (keduanya sudah ada field ini, tapi belum ada sumber
data resminya). Dipakai juga di homepage untuk filter/highlight kategori
populer.

### Autentikasi
**Publik**, tidak perlu token (dipanggil dari homepage sebelum login).

### Request

```
GET /api/v1/categories?parentId=&includeCounts=true
```

| Query param | Wajib? | Keterangan |
|---|---|---|
| `parentId` | Tidak | Filter subkategori dari kategori tertentu. Kalau di-omit, kembalikan kategori top-level (`parentId: null`) — **atau** kembalikan flat semua kategori kalau taxonomy tidak berjenjang (lihat catatan di bawah). |
| `includeCounts` | Tidak, default `false` | Kalau `true`, sertakan `activeOpportunityCount` per kategori (dipakai di homepage untuk badge "128 Opportunity aktif"). |

> **Catatan desain untuk backend**: kalau taxonomy kategori sekarang di
> database **flat** (tidak ada relasi parent-child), field `parentId` di
> response boleh selalu `null` dan query param `parentId` di request bisa
> diabaikan/dihapus dari kontrak ini — sesuaikan dengan skema Prisma yang
> sudah ada untuk `Category` model.

### Response `200`

```jsonc
{
  "success": true,
  "message": "Categories retrieved",
  "data": [
    {
      "id": "cat_manufaktur",
      "name": "Manufaktur",
      "slug": "manufaktur",
      "icon": "Factory",
      "parentId": null,
      "order": 1,
      "activeOpportunityCount": 128   // hanya muncul kalau includeCounts=true
    },
    {
      "id": "cat_logistik",
      "name": "Logistik",
      "slug": "logistik",
      "icon": "Truck",
      "parentId": null,
      "order": 2,
      "activeOpportunityCount": 76
    }
  ]
}
```

### Field `Category`

| Field | Tipe | Wajib? | Keterangan |
|---|---|---|---|
| `id` | string | ✔ | Dipakai sebagai `categoryId` di `Opportunity`/`Party` |
| `name` | string | ✔ | |
| `slug` | string | Tidak | Untuk URL filter, mis. `/marketplace?category=manufaktur` |
| `icon` | string | Tidak | Nama icon (koordinasi dengan frontend soal set icon yang didukung, sama seperti navigation) |
| `parentId` | string \| null | Tidak | `null` kalau top-level atau taxonomy flat |
| `order` | number | Tidak | Urutan tampil |
| `activeOpportunityCount` | number | Tidak | Hanya kalau `includeCounts=true` diminta |

### Error
- `200` dengan `data: []` kalau belum ada kategori di-seed — jangan 404. Frontend sudah ada fallback ke `staticCategories` kalau response kosong/gagal.

---

## Ringkasan untuk backend

| Endpoint | Method | Auth | Prioritas |
|---|---|---|---|
| `/navigation/public` | GET | Opsional (personalisasi kalau ada token) | Menengah — frontend sudah punya fallback statis, jadi tidak blocking |
| `/categories` | GET | Publik | Tinggi — dipakai di homepage & jadi filter opportunity/marketplace, dan `categoryId` sudah dipakai di 2 modul (Opportunity, Party) tanpa sumber data resmi |

Begitu kedua endpoint ini live, frontend tinggal aktifkan kembali kode yang
sudah di-nonaktifkan sementara (lihat komentar `NOTE:` di
`src/app/page.tsx` dan `src/components/dynamic-navbar.tsx`) — tidak perlu
perubahan besar di sisi frontend.
