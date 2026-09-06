# Sinaptex Frontend

Frontend modern dan responsif untuk platform *business matching* **Sinaptex**, dipasangkan dengan engine backend [mulyadiiya28/Sinaptex](https://github.com/mulyadiiya28/Sinaptex.git) (Node.js/Express + Prisma + Supabase + Socket.IO).

Dilengkapi dengan **PWA (Progressive Web App) bertenaga Serwist**, **Web Push Notification & Local OS Notification**, dan **Socket.IO Real-time Sync**.

---

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Tech Stack](#tech-stack)
3. [Arsitektur PWA & Push Notification](#arsitektur-pwa--push-notification)
4. [Struktur Folder & Domain](#struktur-folder--domain)
5. [Setup & Instalasi](#setup--instalasi)
6. [Environment Variables](#environment-variables)
7. [Alur & State Machine Domain](#alur--state-machine-domain)
8. [Konvensi Pengembangan](#konvensi-pengembangan)

---

## Fitur Utama

- **Business Matching Engine**: Pencocokan otomatis Need & Offer berdasarkan kapabilitas bisnis, reputasi, verifikasi, lokasi, dan ranking score.
- **PWA (Progressive Web App)**: Dukungan instalasi aplikasi (desktop/mobile), caching offline dengan Serwist, update service worker otomatis, dan status konektivitas.
- **Web Push & Socket Notifications**: Notifikasi instan di tingkat OS / browser saat ada matching baru, pesan chat, deal baru, dan undangan kemitraan via VAPID Web Push dan Socket.IO bridge.
- **Peluang Bisnis (Opportunity)**: Posting dan penelusuran Need & Offer dengan kuota berbasis status membership (Gratis vs Pro).
- **Boost Opportunity**: Peningkatan bobot ranking pencocokan (Basic 3 Hari, Premium 7 Hari, VIP 14 Hari) untuk visibilitas maksimal.
- **Undangan Matching & Deal Pipeline**: Siklus lengkap dari `AUTH` → `IDENTITY` → `VERIFICATION` → `INTENT` → `BUSINESS SUIT/MARKETPLACE` → `OPPORTUNITY` → `MATCHING` → `RANKING` → `CHAT/INVITATION` → `ACCEPTED` / `REJECTED` → `NEGOTIATION` / `DEAL` → `PAYMENT` / `ESCROW` → `COMPLETED` → `REVIEW`.
- **Chat Real-Time**: Komunikasi interaktif antar mitra bisnis menggunakan Socket.IO client dengan riwayat percakapan.
- **Membership & Monetisasi**: Pilihan paket Pro Bulanan dan Tahunan dengan checkout URL gateway.
- **Ulasan & Reputasi Mitra**: Penilaian bintang (1–5) dan ulasan pasca-deal yang memengaruhi skor reputasi profil bisnis.
- **Multi-Role Auth & Sinkronisasi**: Integrasi otentikasi Supabase dengan sinkronisasi profil otomatis ke database engine backend.

---

## Tech Stack

| Kategori | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server & Client components modern |
| **Language** | TypeScript | Type safety end-to-end |
| **Styling** | Tailwind CSS 4 | Utility-first styling |
| **PWA & SW** | `@serwist/next` & `@serwist/sw` | Service Worker management & caching |
| **Push Notification** | Web Notification API + VAPID | Standar Web Push dan browser notification |
| **Real-time** | `socket.io-client` | Real-time chat dan push trigger listener |
| **Data Fetching** | `@tanstack/react-query` | Server state caching, deduplication, & invalidation |
| **Client State** | Zustand | State UI lokal (Sidebar, Session, Modals) |
| **Validasi** | Zod | Skema validasi request, response, dan form |
| **Icons** | Lucide React | Ikon modern dan konsisten |
| **Auth** | `@supabase/supabase-js` | Email & password auth client |
| **Runtime** | Node.js / Bun | Didukung (ada `bun.lock`) |

---

## Arsitektur PWA & Push Notification

### 1. Service Worker (`@serwist/next`)
Service Worker dikonfigurasi di `src/sw.ts` dan di-bundle via `@serwist/next` di `next.config.ts`:
- **Precaching**: File aset statis dan rute aplikasi di-cache otomatis saat instalasi.
- **Runtime Caching Strategy**:
  - `StaleWhileRevalidate` untuk CSS, JS, font, dan image asset.
  - `NetworkFirst` untuk rute data dan navigasi dokumen.
- **Push Event Handler**: Menerima payload push dari backend dan menampilkan `self.registration.showNotification()`.
- **Notification Click Handler**: Mengarahkan window browser ke target URL saat notifikasi diklik.

### 2. PWA Context Provider (`PwaProvider`)
Komponen `src/components/pwa-provider.tsx` menyediakan state global:
- `isInstallable`: Menangkap event `beforeinstallprompt` untuk menampilkan tombol instalasi kustom di sidebar dan banner.
- `installPwa()`: Memicu prompt instalasi resmi browser.
- `isOnline`: Melacak status jaringan `online`/`offline` pengguna secara real-time.
- `notificationPermission`: Status izin notifikasi browser (`default`, `granted`, `denied`).

### 3. Push Manager & Web Push Bridge
Dikelola di `src/lib/push-manager.ts`:
- **`subscribeToPush()`**: Mendaftarkan Service Worker ke Push Service menggunakan VAPID Public Key (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) dan mengirim subscription object ke `/api/push/subscribe`.
- **`sendLocalNotification()`**: Mengirimkan notifikasi lokal langsung lewat Service Worker ketika aplikasi sedang terbuka di foreground.
- **Socket.IO Bridge**: Mendengarkan event real-time `notification:new` dari backend socket dan secara otomatis memunculkan OS-level push notification jika tab tidak fokus atau di latar belakang.

---

## Struktur Folder & Domain

Folder `src/features/` disusun 1:1 mencerminkan arsitektur domain di backend engine:

```
src/
├── app/                              # Next.js App Router
│   ├── (app)/                        # Authenticated App Layout & Pages
│   │   ├── chat/                     # Halaman chat real-time (Socket.IO)
│   │   ├── dashboard/                # Dashboard ringkasan & manajemen undangan
│   │   ├── deals/                    # Manajemen deal & ulasan mitra
│   │   ├── marketplace/              # Marketplace Need & Offer publik
│   │   ├── matching/                 # Hasil business matching per opportunity
│   │   ├── membership/               # Langganan membership & paket boost
│   │   ├── notifications/            # Notifikasi & pengaturan push notification
│   │   ├── opportunities/            # Kelola postingan opportunity & aktivasi boost
│   │   └── profile/                  # Profil bisnis, KYC verifikasi, & preferensi
│   ├── api/                          # Server-side API Routes
│   │   └── push/
│   │       ├── subscribe/route.ts    # Simpan push subscription
│   │       └── test/route.ts         # Endpoint pengujian kirim web push
│   ├── auth/callback/                # Callback auth Supabase
│   ├── login/                        # Halaman masuk Supabase
│   ├── register/                     # Halaman registrasi + sinkronisasi profil
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page
├── components/                       # Komponen UI Reusable
│   ├── app-header.tsx                # Header dengan toggle status koneksi & notifikasi
│   ├── app-sidebar.tsx               # Navigasi utama + tombol install PWA
│   ├── auth-provider.tsx             # Sinkronisasi auth Supabase ↔ Zustand
│   ├── dynamic-navbar.tsx            # Navbar dinamis
│   ├── notification-bell.tsx         # Bell notifikasi
│   ├── pwa-provider.tsx              # Provider PWA & permission manager
│   ├── push-notification-settings.tsx# Widget pengaturan notifikasi pengguna
│   ├── require-auth.tsx              # Guard autentikasi
│   ├── sinaptex-logo.tsx             # Logo komponen
│   └── ...
├── features/                         # Modul Fitur (1 Folder = 1 Domain Engine)
│   ├── auth/                         # Autentikasi, login, register, me
│   ├── boost/                        # Paket & aktivasi boost opportunity
│   ├── chat/                         # REST + Socket.IO real-time chat
│   ├── deal/                         # Manajemen deal & progress kemitraan
│   ├── invitation/                   # Undangan kolaborasi matching
│   ├── matching/                     # Algoritma & hasil matching engine
│   ├── membership/                   # Status membership & checkout
│   ├── notification/                 # In-app notification & socket listener
│   ├── opportunity/                  # CRUD Need/Offer & kuota pengguna
│   ├── profile/                      # Profil bisnis & entitas party
│   ├── review/                       # Ulasan & penilaian bintang deal
│   └── verification/                 # Upload & status dokumen verifikasi
├── lib/
│   ├── api-client.ts                 # Fetch wrapper dengan auto Bearer Supabase Token
│   ├── push-manager.ts               # Utilitas Web Push & Service Worker notification
│   ├── query-provider.tsx            # TanStack React Query Client Provider
│   ├── socket-client.ts              # Singleton instance Socket.IO
│   └── supabase-client.ts            # Singleton instance Supabase Client
├── store/
│   ├── use-session-store.ts          # Cache profil pengguna login
│   └── use-ui-store.ts               # State UI (sidebar toggle, modal dialog)
└── sw.ts                             # Service Worker entry point (Serwist)
```

---

## Setup & Instalasi

### 1. Prasyarat
- **Node.js**: v18.17.0 atau lebih baru (atau **Bun**)
- **NPM** / **PNPM** / **Yarn** / **Bun**
- **Engine Backend Sinaptex**: Berjalan pada `http://localhost:4000` (atau sesuaikan)

### 2. Langkah Instalasi

```bash
# Clone repository
git clone https://github.com/mulyadiiya28/Sinaptex-frontend.git
cd Sinaptex-frontend

# Install dependensi (pilih salah satu)
npm install
# atau
bun install

# Konfigurasi environment variables
cp .env.example .env.local
```

### 3. Generate VAPID Keys (Opsional untuk Push Notification)
Jika Anda ingin menguji Web Push kustom di lokal, buat pasangan kunci VAPID:

```bash
npx web-push generate-vapid-keys
```

Salin *Public Key* ke `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (dan Private Key ke backend jika diperlukan).

### 4. Menjalankan Server Pengembangan

```bash
npm run dev
# atau
bun run dev
```

Aplikasi dapat diakses di browser pada `http://localhost:3000`.

### 5. Build Produksi

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Wajib | Keterangan | Contoh Nilai |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Ya | URL backend engine Sinaptex | `http://localhost:4000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase Auth | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Anon / Public Key Supabase | `eyJhbGciOi...` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Opsional | Public VAPID key untuk Web Push PWA | `BEl62iUYg...` |

> File `.env.example` berisi template minimal. Tambahkan variabel VAPID jika ingin mengaktifkan Web Push sepenuhnya.

---

## Alur & State Machine Domain

### 1. Opportunity & Kuota
- **Batas Kuota**:
  - Akun Standar (Gratis): Maksimal 1 Need aktif + 1 Offer aktif.
  - Pro Member: Maksimal 20 Need aktif + 20 Offer aktif.
- Error `OPPORTUNITY_QUOTA_EXCEEDED` dari backend ditangani dengan modal/notifikasi upgrade membership.

### 2. Boost Opportunity
- User dapat mengaktifkan paket Boost pada Opportunity yang berstatus `ACTIVE`:
  - **Basic (3 Hari)**: +15% ranking score.
  - **Premium (7 Hari)**: +30% ranking score + highlight badge.
  - **VIP (14 Hari)**: Prioritas tertinggi pada hasil pencocokan.

### 3. Undangan Matching & Deal Lifecycle
```
[Matching Result] ──(Kirim Undangan)──► [Invitation: PENDING]
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
            [Invitation: REJECTED]                             [Invitation: ACCEPTED]
                                                                        │
                                                                        ▼
                                                                [Deal: NEGOTIATION]
                                                                        │
                                                                [Deal: DEAL]
                                                                        │
                                                                [Deal: IN_PROGRESS]
                                                                        │
                                                                [Deal: COMPLETED]
                                                                        │
                                                                [Review & Rating]
```

### 4. Chat & Real-Time Sync
- Komunikasi dapat diinisiasi langsung dari halaman Opportunity atau melalui Deal.
- Event Socket.IO `chat:message` dan `notification:new` tersinkronisasi dua arah dengan UI dan Service Worker push notifications.

---

## Konvensi Pengembangan

1. **Komunikasi API Terpusat**: Seluruh pemanggilan endpoint harus melalui `apiClient` (`src/lib/api-client.ts`) yang otomatis menginjeksikan token Supabase.
2. **Validasi Skema**: Setiap payload request dan response wajib divalidasi menggunakan skema Zod di `features/<domain>/*.schema.ts`.
3. **React Query Hooks**: Setiap endpoint dibungkus dalam hook di `features/<domain>/*.hooks.ts` dengan manajemen cache dan key query terstandarisasi.
4. **PWA Compliance**: Manifest dan ikon harus tetap sinkron dengan metadata rute Next.js.

---

**Backend companion**: [mulyadiiya28/Sinaptex](https://github.com/mulyadiiya28/Sinaptex.git)
