# Ikatancinta.in - Dokumentasi Proyek

Landing page dan alur pemesanan undangan digital berbasis React + Vite, dengan galeri tema, preview desain, form order multi-step, serta konfirmasi order.

## Daftar Isi
1. [Gambaran Umum](#gambaran-umum)
2. [Fitur Utama](#fitur-utama)
3. [Teknologi](#teknologi)
4. [Arsitektur Aplikasi](#arsitektur-aplikasi)
5. [Struktur Folder](#struktur-folder)
6. [Persiapan Development](#persiapan-development)
7. [Menjalankan Proyek](#menjalankan-proyek)
8. [Environment Variables](#environment-variables)
9. [Routing Halaman](#routing-halaman)
10. [Alur Order](#alur-order)
11. [Kontrak Integrasi API Order](#kontrak-integrasi-api-order)
12. [Testing](#testing)
13. [Build dan Preview Production](#build-dan-preview-production)
14. [Troubleshooting](#troubleshooting)
15. [Panduan Pengembangan](#panduan-pengembangan)

## Gambaran Umum
Proyek ini adalah frontend single-page application (SPA) untuk:
- Menampilkan profil layanan undangan digital.
- Menjelajah katalog tema undangan.
- Melihat detail dan preview tema.
- Mengisi form pemesanan undangan (4 langkah).
- Mengirim order ke mode dummy atau API nyata.
- Menampilkan halaman konfirmasi order.

## Fitur Utama
- Landing page marketing (`Hero`, `Features`, `Pricing`, `FAQ`, testimonial).
- Highlight fitur di section `Features`:
  - Desain Kekinian
  - Buku Tamu (QR Card)
  - Love Stories
  - Live Streaming
  - Bagikan Dengan Nama Tamu
  - Native Share
  - Multi Bahasa (Indonesia/Inggris)
  - Custom Time Zone
- Galeri tema dengan filter kategori.
- Detail tema dan daftar contoh undangan per tema.
- Preview undangan:
  - `PREMIUM/EKSLUSIF`: `/preview-undangan`
  - `BASIC`: `/preview-undangan-basic`
- Form order multi-step:
  - Data mempelai & customer
  - Detail acara
  - Upload cover/gallery + musik
  - Review dan submit
- Validasi field wajib + fokus otomatis ke input invalid.
- Simulasi submit dummy (termasuk mode gagal untuk testing).
- Halaman konfirmasi order dengan status progres.

## Teknologi
- React 18
- Vite 5
- Tailwind CSS 3 (+ `@tailwindcss/forms`)
- ESLint 9
- Playwright (E2E)

## Arsitektur Aplikasi
- Tidak menggunakan `react-router`.
- Navigasi internal memakai helper di `src/utils/navigation.js`:
  - `navigateTo(href)`
  - custom event `app:navigate`
  - sinkronisasi route dilakukan di `src/App.jsx`.
- `src/App.jsx` memilih komponen halaman berdasarkan `window.location.pathname`.
- State order form dikelola di `src/components/CreateInvitationFormPage.jsx`.
- Data tema statis berada di `src/data/themes.js`.

## Struktur Folder
```text
.
├── public/                      # Aset statis (audio, video, payment icon, dll)
├── src/
│   ├── components/              # Komponen halaman/section utama
│   ├── data/
│   │   └── themes.js            # Data tema + helper lookup + contoh undangan
│   ├── services/
│   │   ├── orderApi.js          # Integrasi submit order (dummy/real)
│   │   └── dummyOrderApi.js     # Simulasi API order
│   ├── templates/basic/         # Preview khusus tema BASIC
│   ├── utils/
│   │   └── navigation.js        # Utility navigasi SPA
│   ├── App.jsx                  # Resolver route ke halaman
│   ├── main.jsx                 # Entry React
│   └── index.css                # Tailwind + utilitas global
├── tests/e2e/
│   └── order-flow.spec.js       # Skenario E2E Playwright
├── playwright.config.js
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Persiapan Development
Prasyarat:
- Node.js 18+ (disarankan Node.js 20 LTS)
- npm 9+

## Menjalankan Proyek
Install dependency:
```bash
npm install
```

Jalankan mode development:
```bash
npm run dev
```

Build production:
```bash
npm run build
```

Preview hasil build:
```bash
npm run preview
```

Lint:
```bash
npm run lint
```

E2E test:
```bash
npm run test:e2e
```

## Environment Variables
Variabel dibaca dari `import.meta.env`.

Mode default submit order adalah `dummy`.

Contoh `.env.local`:
```env
# dummy | real
VITE_ORDER_API_MODE=dummy

# wajib jika mode real
VITE_ORDER_API_SUBMIT_URL=https://your-api.example.com/orders

# opsional, trigger email/notifikasi customer setelah submit sukses
VITE_ORDER_API_EMAIL_URL=https://your-api.example.com/order-email
```

Aturan:
- Jika `VITE_ORDER_API_MODE=real`, `VITE_ORDER_API_SUBMIT_URL` wajib terisi.
- Jika `VITE_ORDER_API_EMAIL_URL` tidak diisi, proses email dilewati (best-effort).

## Routing Halaman
Route yang digunakan saat ini:

| Path | Halaman |
|---|---|
| `/` | Landing page |
| `/tema` | Galeri tema |
| `/tema/:slug` | Detail tema |
| `/buat-undangan` | Form order multi-step |
| `/konfirmasi-order` | Konfirmasi status order |
| `/preview-undangan?preset_id=...` | Preview tema non-BASIC |
| `/preview-undangan-basic?preset_id=...` | Preview tema BASIC |
| `/preset&design?preset_id=...` | Alias ke preview non-BASIC |

Query param penting:
- `theme`: slug tema awal untuk form order.
- `preset_id`: preset tema awal untuk form order/preview.
- `package`: memilih tema awal berdasarkan tier paket (`BASIC`, `PREMIUM`, `EKSLUSIF`).
- `mock_fail=1`: paksa submit dummy gagal.
- `mock_fail_once=1`: submit dummy gagal sekali lalu sukses pada percobaan berikutnya.

## Alur Order
Alur utama user:
1. User memilih tema dari galeri/detail/pricing.
2. User diarahkan ke `/buat-undangan`.
3. User isi form step 1-4.
4. Submit memanggil `submitOrder()` (`src/services/orderApi.js`).
5. Jika sukses:
   - data konfirmasi disimpan ke `localStorage` key `ikatancinta_last_order_confirmation_v1`
   - redirect ke `/konfirmasi-order`.
6. Halaman konfirmasi membaca data dari `localStorage` dan menampilkan status.

## Kontrak Integrasi API Order
File terkait:
- `src/services/orderApi.js`
- `src/services/dummyOrderApi.js`

### Mode Dummy
- Dipakai saat `VITE_ORDER_API_MODE` bukan `real`.
- Mengembalikan shape sukses:
  - `success`
  - `orderId`
  - `createdAt`
  - `status`
  - `message`

### Mode Real
`submitOrder(payload)` akan:
1. `POST` ke `VITE_ORDER_API_SUBMIT_URL`.
2. Bentuk response dinormalisasi oleh `buildOrderResultShape()`.
3. Opsional `POST` email trigger ke `VITE_ORDER_API_EMAIL_URL`.

Header default:
- `Accept: application/json`
- `Content-Type: application/json`

Error handling:
- HTTP non-2xx melempar error dengan code `ORDER_API_REQUEST_FAILED`.
- URL submit tidak dikonfigurasi melempar `ORDER_API_REAL_URL_NOT_CONFIGURED`.
- Email trigger gagal tidak membatalkan order (hanya `console.warn`).

### Ringkasan Payload Submit
Payload berisi:
- `customer`, `groom`, `bride`
- `akad`, `resepsi`, `sessions`
- `coverImage`, `galleryImages`, `stories`
- `music`
- `selectedTheme` (`name`, `slug`, `presetId`, `packageTier`)
- `selectedPackage` (`price`, `oldPrice`, `discount`)

Catatan:
- File media dikonversi menjadi Data URL (base64) pada frontend sebelum submit.

## Testing
E2E test ada di `tests/e2e/order-flow.spec.js`.

Skenario yang diuji:
- Validasi step 1 dan step 2 (termasuk fokus field error).
- Alur submit sukses sampai halaman konfirmasi.
- Submit gagal sekali lalu retry (`mock_fail_once=1`).
- Validasi mode musik `list`.
- Validasi mode upload musik (`format`, `ukuran > 5MB`, dan sukses upload).

Konfigurasi Playwright:
- Browser: Chromium
- Base URL: `http://127.0.0.1:5173`
- Playwright akan menjalankan web server lokal via `npm run dev -- --host 127.0.0.1 --port 5173`.

## Build dan Preview Production
Build:
```bash
npm run build
```

Output build berada di folder:
- `dist/`

Preview lokal hasil build:
```bash
npm run preview
```

## Troubleshooting
`npm run dev` gagal jalan:
- Pastikan dependency sudah terpasang (`npm install`).
- Pastikan versi Node.js kompatibel (18+).

E2E gagal karena browser belum terpasang:
```bash
npx playwright install
```

Submit mode real selalu gagal:
- Cek `VITE_ORDER_API_MODE=real`.
- Cek `VITE_ORDER_API_SUBMIT_URL` valid dan dapat diakses.
- Pastikan endpoint menerima `application/json`.

Gagal upload media:
- Maksimal ukuran file yang diterima frontend: `5MB` per file.
- Musik custom harus format `.mp3`.

## Panduan Pengembangan
Menambah tema baru:
1. Tambahkan object tema di `src/data/themes.js`.
2. Isi minimal: `slug`, `presetId`, `name`, `category`, `packageTier`, `thumbnail/image`.
3. Pastikan `slug` unik.
4. Pastikan `presetId` valid agar preview bisa dibuka.

Menambah route baru:
1. Tambahkan kondisional route di `src/App.jsx`.
2. Gunakan `navigateTo()` dari `src/utils/navigation.js` untuk internal nav.
3. Hindari `window.location.href` untuk route internal agar transisi SPA tetap konsisten.
