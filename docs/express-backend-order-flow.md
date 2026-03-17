# Order Flow dan Kontrak Backend Express

Dokumen ini merangkum alur frontend saat ini dan kontrak minimum yang perlu disiapkan di backend Express agar paket `BASIC`, `PREMIUM`, dan `EKSKLUSIF` konsisten dari pricing, order form, sampai render template.

## 0. Status implementasi saat ini

Frontend sekarang sudah memakai layer API adapter, walau backend Express belum dibuat penuh.

Adapter yang sudah aktif:

- `src/services/catalogApi.js`
- `src/services/invitationApi.js`
- `src/services/wishesApi.js`
- `src/services/uploadApi.js`
- `src/services/orderApi.js`
- `server/mock/app.js`
- `server/mock/server.js`

Starter backend terpisah yang sudah disiapkan:

- `backend-express-starter/`
- targetnya untuk dijadikan proyek Express baru di repo terpisah, dengan struktur modul yang sudah mengikuti kontrak frontend saat ini
- starter ini sudah berisi `package.json`, `.env.example`, `README.md`, route/controller/service/repository, provider `apps_script`, `google_sheets`, `google_drive`, serta fallback `memory`
- starter ini sudah diverifikasi lokal dengan `npm install`, `npm run check`, dan `npm run start`

Starter Apps Script yang sudah disiapkan:

- `google-apps-script-starter/`
- targetnya untuk dijadikan project Google Apps Script Web App yang menangani penyimpanan ke Google Sheets dan Google Drive
- starter ini sudah berisi `Code.gs`, `appsscript.json`, dan `README.md`

File bantu operasional yang sudah disiapkan:

- `backend-express-starter/http/express-api.http`
- `backend-express-starter/http/apps-script.http`
- `backend-express-starter/http/openapi-docs.http`
- `backend-express-starter/.env.apps-script.ready.example`
- `.env.local.example`
- `docs/apps-script-express-deployment-checklist.md`
- `docs/apps-script-script-properties-template.md`

Starter dashboard admin terpisah yang sudah disiapkan:

- `admin-dashboard-next-refine/`
- targetnya untuk proyek admin UI terpisah berbasis `Next.js + Refine + Tremor`
- dashboard ini memakai login JWT ke backend Express, bukan akses langsung ke Apps Script
- resource utama yang dipakai: `admin/auth/login`, `admin/auth/me`, `admin/summary`, `orders`, `orders/:orderId`, `orders/:orderId/publish`
- resource yang sudah tersedia: `dashboard`, `orders`, `uploads`
- halaman yang sudah tersedia: `/login`, `/dashboard`, `/orders`, `/orders/[orderId]`, `/uploads`
- starter ini sudah diverifikasi lokal dengan `npm run check` dan `npm run build`
- halaman detail order di dashboard admin sekarang sudah bisa mengedit customer, akad, resepsi, sesi resepsi, cover, dan galeri, serta upload asset langsung ke `POST /api/uploads`
- dashboard admin sekarang juga punya preview media dan quick action `Set as Cover` / `Add to Gallery` yang memanfaatkan `PUT /api/orders/:orderId` di atas kontrak backend yang sudah ada
- dashboard admin sekarang juga mendukung pencarian order berbasis customer / `orderId` / `invitationSlug`
- dashboard admin sekarang juga mendukung quick action `Remove from Order` untuk melepas cover atau galeri dari order tanpa menghapus file storage
- dashboard admin sekarang juga mendukung bulk action order list untuk `processing`, `published`, `done`, dan `cancelled`, dengan guard konfirmasi untuk status terminal
- dashboard admin sekarang juga memiliki route detail asset `/uploads/[assetId]` dan indikator apakah asset sedang dipakai sebagai `cover`, `gallery`, atau `music`
- dashboard admin sekarang juga memiliki filter usage asset: `unused`, `cover`, `gallery`, `music`
- panduan split repo dashboard admin ada di `admin-dashboard-next-refine/REPO_SPLIT_GUIDE.md`

UI test API yang sudah disiapkan di backend Express:

- `GET /api/openapi.json`
- `GET /api/docs`
- `/api/docs` menampilkan playground visual yang lebih mudah dipakai untuk test `health`, master data, wishes, upload, dan order
- `GET /api/swagger`
- `/api/swagger` menampilkan Swagger UI untuk kebutuhan dokumentasi teknis

Mode kerja:

- `dummy`: komponen fetch lewat service, tapi datanya diambil dari seed lokal yang sudah ada
- `real`: komponen fetch ke endpoint HTTP yang nanti akan disediakan Express

Artinya, komponen frontend sudah mengikuti pola API final. Saat Express siap, yang diganti cukup env dan endpoint backend, bukan logika UI.

### Environment variable yang dipakai

- `VITE_CATALOG_API_MODE=dummy|real`
- `VITE_CATALOG_API_URL=http://localhost:3001/api`
- `VITE_INVITATION_API_MODE=dummy|real`
- `VITE_INVITATION_API_URL=http://localhost:3001/api`
- `VITE_ORDER_API_MODE=dummy|real`
- `VITE_ORDER_API_SUBMIT_URL=http://localhost:3001/api/orders`
- `VITE_ORDER_API_EMAIL_URL=http://localhost:3001/api/orders/email`
- `VITE_UPLOAD_API_MODE=dummy|real`
- `VITE_UPLOAD_API_URL=http://localhost:3001/api/uploads`

### Environment variable backend starter

- `DATA_STORE_PROVIDER=apps_script|google_sheets|memory`
- `MEDIA_STORAGE_PROVIDER=apps_script|google_drive|memory`
- `APPS_SCRIPT_BASE_URL=https://script.google.com/macros/s/.../exec`
- `APPS_SCRIPT_SHARED_SECRET=...`
- `ADMIN_AUTH_EMAIL=...`
- `ADMIN_AUTH_PASSWORD=...`
- `ADMIN_JWT_SECRET=...`
- `ADMIN_JWT_EXPIRES_IN_SECONDS=28800`
- `ADMIN_DISPLAY_NAME=Admin`
- `APPS_SCRIPT_TIMEOUT_MS=30000`
- `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`
- `GOOGLE_PROJECT_ID=...`
- `GOOGLE_CLIENT_EMAIL=...`
- `GOOGLE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----...\"`
- `GOOGLE_SHEETS_SPREADSHEET_ID=...`
- `GOOGLE_SHEETS_ORDERS_SHEET=orders`
- `GOOGLE_SHEETS_UPLOADS_SHEET=uploads`
- `GOOGLE_SHEETS_WISHES_SHEET=wishes`
- `GOOGLE_SHEETS_ORDER_EMAILS_SHEET=order_emails`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID=...`
- `GOOGLE_DRIVE_PUBLIC_READ=true|false`

### Script lokal yang sudah tersedia

- `npm run mock-api`
- `npm run dev:mock-api`

Flow lokal yang disarankan:

1. jalankan `npm run mock-api`
2. jalankan `npm run dev:mock-api`
3. frontend akan memakai endpoint mock Express di `http://127.0.0.1:3001/api`

Flow untuk proyek backend terpisah:

1. copy folder `backend-express-starter/` ke repo backend baru
2. jalankan `cp .env.example .env`
3. deploy `google-apps-script-starter/` sebagai Web App
4. isi `APPS_SCRIPT_BASE_URL` dan `APPS_SCRIPT_SHARED_SECRET`
5. jika tidak memakai Apps Script, baru isi credential Google direct
6. jalankan `npm install`
7. jalankan `npm run dev`
8. arahkan frontend ke base URL backend baru melalui env `VITE_*_API_URL`

Arsitektur storage yang sekarang direkomendasikan:

- `Frontend -> Express -> Apps Script -> Google Sheets + Google Drive`
- `Google Sheets` untuk `orders`, `uploads`, `wishes`, `order_emails`
- `Google Drive` untuk file media `cover`, `gallery`, `music`
- `packages` dan `themes` tetap bisa disimpan sebagai seed/konfigurasi kode karena datanya relatif stabil
- backend starter sekarang akan fail fast saat startup jika provider aktif belum punya env wajib
- untuk workflow admin, backend Express sekarang memakai login JWT terpisah dan tidak lagi memakai shared secret Apps Script

## 1. Alur frontend saat ini

1. User memilih paket di halaman pricing.
2. CTA mengarahkan ke `/buat-undangan?package=<tier>`.
3. `CreateInvitationFormPage` membaca query `package`, lalu memilih tema pertama yang cocok dengan tier tersebut.
4. User mengisi 4 langkah form:
   - data customer dan mempelai
   - detail acara
   - media (cover, galeri, musik, cerita)
   - review dan submit
5. Saat preview:
   - form dimapping ke schema template
   - draft disimpan ke `sessionStorage`
   - template dibuka dengan `?preview=1`
6. Saat submit:
   - payload order dikirim ke API order
   - hasil submit disimpan ke `localStorage`
   - user diarahkan ke halaman konfirmasi

## 1A. Komponen yang sudah terkoneksi ke API adapter

- pricing paket
- galeri tema
- detail tema
- showcase tema
- order form
- preview preset by `preset_id`
- template live via `useInvitationData`
- submit wishes/RSVP template live via API
- upload asset order via API

Implementasi aktif saat ini:

- `CreateInvitationFormPage` melakukan pre-upload asset `cover`, `gallery`, dan `music` ke endpoint upload sebelum memanggil `POST /api/orders`
- `CreateInvitationFormPage` sekarang pre-generate `orderId`, lalu mengirim `orderId` yang sama ke upload asset dan `POST /api/orders`
- pre-upload di mode `real` sekarang dikirim sebagai `multipart/form-data`, bukan lagi JSON `dataUrl`
- template live `basic`, `premium`, dan `eksklusif` yang sudah memakai form wishes akan memanggil `POST /api/invitations/:slug/wishes` melalui `src/services/wishesApi.js`
- halaman konfirmasi order akan polling `GET /api/orders/:orderId` saat mode `real` aktif, dengan fallback ke `localStorage` saat mode `dummy`
- backend starter sekarang menolak `orderId` dan `invitationSlug` yang duplikat saat create order
- backend starter sekarang mendukung status workflow `pending`, `processing`, `published`, `done`, `cancelled`
- endpoint admin Express sekarang dilindungi oleh login JWT admin
- endpoint admin Express sekarang menerima `x-admin-actor` opsional untuk audit trail ringan
- backend starter sekarang memiliki endpoint `PUT /api/orders/:orderId` untuk edit data order admin
- backend starter sekarang memiliki endpoint eksplisit `POST /api/orders/:orderId/publish`
- backend starter sekarang memiliki endpoint dashboard `GET /api/admin/summary`
- publish sekarang memakai guard minimum agar undangan tidak live saat data inti masih kosong

## 2. Source of truth paket

Frontend sekarang memakai satu katalog paket bersama di `src/data/packageCatalog.js`, dengan isi yang mengikuti definisi bisnis dari `Pricing.jsx`.

Field penting:

- `tier`
- `price`
- `oldPrice`
- `discount`
- `limits.galleryMax`
- `limits.guestShareMax`
- `capabilities.customMusic`
- `capabilities.loveStory`
- `capabilities.digitalEnvelope`
- `capabilities.guestBook`
- `capabilities.rsvp`
- `capabilities.livestream`
- `capabilities.customDomain`

Implikasi untuk backend:

- backend tidak boleh lagi mengandalkan string hardcoded yang berbeda antara pricing dan order form
- tier canonical yang dipakai sistem adalah `BASIC`, `PREMIUM`, `EKSKLUSIF`
- alias legacy `EKSLUSIF` sebaiknya tetap diterima di layer normalisasi request

## 3. Rule bisnis per paket

### BASIC

- maksimal 4 foto galeri
- hanya musik dari list
- love story nonaktif
- digital envelope nonaktif
- guest book nonaktif
- RSVP aktif
- livestream nonaktif

### PREMIUM

- maksimal 8 foto galeri
- musik custom aktif
- love story aktif
- digital envelope aktif
- guest book aktif
- RSVP aktif
- livestream nonaktif
- custom domain opsional
- share nama tamu maksimal 150

### EKSKLUSIF

- maksimal 14 foto galeri
- semua capability PREMIUM aktif
- livestream aktif
- multi bahasa aktif
- priority support aktif
- share nama tamu unlimited

## 4. Model data backend yang disarankan

### `packages`

Simpan ini sebagai master data.

Contoh field:

```json
{
  "tier": "PREMIUM",
  "name": "PREMIUM",
  "price": 110000,
  "oldPrice": 250000,
  "discountLabel": "56% OFF",
  "limits": {
    "galleryMax": 8,
    "guestShareMax": 150
  },
  "capabilities": {
    "customMusic": true,
    "loveStory": true,
    "digitalEnvelope": true,
    "guestBook": true,
    "rsvp": true,
    "livestream": false,
    "customDomain": true
  }
}
```

### `themes`

Satu tema harus selalu terhubung ke satu paket.

Contoh field:

```json
{
  "id": "tlp-premium-001",
  "slug": "timeless-promise",
  "name": "Timeless Promise",
  "category": "Floral",
  "packageTier": "PREMIUM",
  "templateKey": "timeless-promise",
  "status": "active"
}
```

### `orders`

Mencatat order masuk dari form. Jika memakai Google Sheets, simpan satu row per order dan serialisasikan payload lengkap ke kolom `payload_json`.

Field relasi yang sekarang dipakai:

- `orders.order_id` sebagai primary key utama
- `orders.invitation_slug` sebagai identity publik undangan
- `uploads.order_id` untuk mengelompokkan asset per order
- `wishes.invitation_slug` untuk endpoint publik undangan
- `wishes.order_id` untuk kebutuhan admin dan join data

Contoh field:

```json
{
  "id": "ord_01",
  "orderCode": "IKC-260312-1234",
  "invitationSlug": "bima-anisa-ikc-260312-1234",
  "status": "processing",
  "packageTier": "PREMIUM",
  "themeSlug": "timeless-promise",
  "customer": {
    "name": "Anisa Putri",
    "phone": "08123456789",
    "email": "anisa@example.com",
    "address": "Kediri"
  },
  "payment": {
    "method": "manual_transfer",
    "channel": "BCA",
    "status": "unverified"
  },
  "createdAt": "2026-03-12T10:00:00.000Z",
  "updatedAt": "2026-03-12T10:00:00.000Z",
  "publishedAt": null,
  "publishedBy": null,
  "audit": {
    "lastUpdatedBy": "system",
    "lastUpdateType": "create",
    "lastUpdateNote": ""
  }
}
```

### `invitations`

Data invitation final yang nanti dipakai template live.

Contoh field:

```json
{
  "id": "inv_01",
  "orderId": "ord_01",
  "slug": "anisa-dan-bima",
  "packageTier": "PREMIUM",
  "themeSlug": "timeless-promise",
  "eventData": {},
  "media": {},
  "features": {},
  "publicationStatus": "draft"
}
```

### `invitation_guests`

Untuk fitur share nama tamu per-link.

Contoh field:

```json
{
  "id": "guest_01",
  "invitationId": "inv_01",
  "guestName": "Bapak Ahmad",
  "guestCode": "AHMAD001",
  "slugToken": "ahmad001"
}
```

### `wishes`

Untuk ucapan dan RSVP.

Contoh field:

```json
{
  "id": "wish_01",
  "invitationId": "inv_01",
  "orderId": "IKC-260312-1234",
  "invitationSlug": "bima-anisa-ikc-260312-1234",
  "name": "Rina",
  "attendance": "hadir",
  "message": "Selamat menempuh hidup baru",
  "createdAt": "2026-03-12T10:00:00.000Z"
}
```

### `uploads`

Jika memakai arsitektur `Express -> Apps Script -> Google Sheets + Google Drive`, metadata upload disimpan di sheet, sedangkan file fisik disimpan di Drive.

Contoh field:

```json
{
  "assetId": "asset_01",
  "orderId": "IKC-260312-1234",
  "kind": "gallery",
  "fileName": "gallery-1.jpg",
  "mimeType": "image/jpeg",
  "size": 456789,
  "driveFileId": "1AbCdEfGh",
  "driveFolderId": "0BxxRootFolder",
  "url": "https://drive.google.com/uc?export=view&id=1AbCdEfGh",
  "createdAt": "2026-03-12T10:00:00.000Z"
}
```

## 5. Kontrak API minimum

Mock API yang sudah diimplementasikan saat ini:

- `GET /api/health`
- `GET /api/packages`
- `GET /api/themes`
- `GET /api/themes/:slug/invitations`
- `GET /api/invitations/:slug`
- `POST /api/invitations/:slug/wishes`
- `POST /api/uploads`
- `GET /api/uploads`
- `POST /api/orders`
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `PUT /api/orders/:orderId`
- `PATCH /api/orders/:orderId`
- `POST /api/orders/:orderId/publish`
- `POST /api/orders/email`
- `GET /api/admin/summary`

### `GET /api/packages`

Mengembalikan master paket untuk pricing dan validasi frontend.

### `GET /api/themes`

Query yang disarankan:

- `packageTier`
- `slug`
- `presetId`
- `status`

Frontend bisa pakai ini untuk theme picker dan default theme per paket.

### `GET /api/themes/:slug/invitations`

Untuk halaman detail tema, daftar invitation yang memakai tema tersebut.

### `GET /api/orders`

Query opsional untuk admin:

- endpoint ini membutuhkan header `Authorization: Bearer <admin-jwt>`

- `status`
- `packageTier`
- `themeSlug`

### `POST /api/admin/auth/login`

Dipakai admin untuk memperoleh JWT sebelum mengakses endpoint admin lain.

Body minimum:

```json
{
  "email": "admin@example.com",
  "password": "super-secret-password"
}
```

### `GET /api/admin/auth/me`

Dipakai untuk mengecek token admin yang sedang aktif.

Proteksi:

- wajib header `Authorization: Bearer <admin-jwt>`

### `POST /api/orders`

Dipanggil saat user submit form order.

Body minimum:

```json
{
  "orderId": "IKC-260312-1234",
  "invitationSlug": "bima-anisa-ikc-260312-1234",
  "customer": {},
  "groom": {},
  "bride": {},
  "akad": {},
  "resepsi": null,
  "isReceptionEnabled": false,
  "sessions": [],
  "coverImage": {
    "assetId": "asset_cover_123",
    "kind": "cover",
    "name": "cover.jpg",
    "mimeType": "image/jpeg",
    "size": 345678,
    "url": "http://127.0.0.1:3001/mock-assets/IKC-260312-1234/asset_cover_123/cover.jpg"
  },
  "galleryImages": [
    {
      "assetId": "asset_gallery_456",
      "kind": "gallery",
      "name": "gallery-1.jpg",
      "mimeType": "image/jpeg",
      "size": 456789,
      "url": "http://127.0.0.1:3001/mock-assets/IKC-260312-1234/asset_gallery_456/gallery-1.jpg"
    }
  ],
  "stories": [],
  "music": {
    "mode": "upload",
    "file": {
      "assetId": "asset_music_789",
      "kind": "music",
      "name": "song.mp3",
      "mimeType": "audio/mpeg",
      "size": 987654,
      "url": "http://127.0.0.1:3001/mock-assets/IKC-260312-1234/asset_music_789/song.mp3"
    }
  },
  "selectedTheme": {
    "slug": "timeless-promise",
    "packageTier": "PREMIUM",
    "presetId": "tlp-premium-001"
  },
  "selectedPackage": {
    "tier": "PREMIUM",
    "price": 110000,
    "limits": {
      "galleryMax": 8
    },
    "capabilities": {
      "customMusic": true,
      "loveStory": true
    }
  }
}
```

Respons minimum:

```json
{
  "success": true,
  "orderId": "IKC-260312-1234",
  "invitationSlug": "bima-anisa-ikc-260312-1234",
  "createdAt": "2026-03-12T10:00:00.000Z",
  "completedAt": null,
  "status": "processing",
  "message": "Pesanan berhasil diterima dan sedang diproses admin."
}
```

Status workflow yang didukung:

- `pending`
- `processing`
- `published`
- `done`
- `cancelled`

### `GET /api/orders/:orderId`

Dipakai halaman konfirmasi order saat frontend berjalan di mode `real`.

Catatan:

- endpoint ini sengaja tetap public karena frontend memakainya untuk polling status order setelah submit

Respons minimum:

```json
{
  "success": true,
  "data": {
    "orderId": "IKC-260312-1234",
    "invitationSlug": "bima-anisa-ikc-260312-1234",
    "createdAt": "2026-03-12T10:00:00.000Z",
    "completedAt": "2026-03-12T10:00:06.500Z",
    "status": "done",
    "customerName": "Anisa Putri",
    "packageTier": "PREMIUM",
    "themeSlug": "timeless-promise",
    "themeName": "Timeless Promise",
    "totalPrice": 110000,
    "payload": {},
    "uploads": [],
    "wishes": []
  }
}
```

### `PUT /api/orders/:orderId`

Dipakai admin untuk mengedit payload order tanpa mengganti `orderId`.

Proteksi:

- wajib header `Authorization: Bearer <admin-jwt>`
- opsional header `x-admin-actor` untuk mengisi audit ringan

Behavior:

- backend merge payload lama dengan patch baru
- backend validasi ulang `selectedTheme` dan `selectedPackage`
- backend mengecek ulang duplikasi `invitationSlug` bila slug diubah
- backend memperbarui audit ringan `updated_at`, `last_updated_by`, `last_update_type`, `last_update_note`
- order dengan status `done` atau `cancelled` tidak bisa diedit
- order dengan status `published` masih boleh mengubah data mempelai, jadwal acara, sesi acara, dan cover
- order dengan status `published` tidak bisa lagi mengubah `selectedPackage`, `selectedTheme`, dan `invitationSlug`

### `PATCH /api/orders/:orderId`

Dipakai admin untuk mengubah status workflow order.

Proteksi:

- wajib header `Authorization: Bearer <admin-jwt>`
- opsional header `x-admin-actor` untuk mengisi audit ringan

Body minimum:

```json
{
  "status": "published"
}
```

Respons minimum:

```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "orderId": "IKC-260312-1234",
    "status": "published"
  }
}
```

### `POST /api/orders/:orderId/publish`

Dipakai admin untuk publish invitation tanpa mengirim body status manual.

Proteksi:

- wajib header `Authorization: Bearer <admin-jwt>`

Behavior:

- backend mengubah status order menjadi `published`
- backend mengisi `published_at`
- backend mengisi `published_by`
- backend menjalankan publish guard minimum:
  - `customer.name`
  - `selectedTheme.slug`
  - `selectedPackage.tier`
  - `groom.fullname`
  - `bride.fullname`
  - `akad.date`
  - `akad.venue`
  - `coverImage`
  - `invitationSlug`
- response menyertakan `invitationUrl`

### `GET /api/admin/summary`

Dipakai untuk dashboard ringkas admin.

Proteksi:

- wajib header `Authorization: Bearer <admin-jwt>`

### `POST /api/uploads`

Frontend sekarang sudah menyiapkan asset order lewat endpoint upload sebelum memanggil `POST /api/orders`.

Body minimum mock saat ini dikirim sebagai `multipart/form-data`:

```text
orderId=IKC-260312-1234
file=<binary>
kind=cover
name=cover.jpg
mimeType=image/jpeg
size=345678
```

Respons minimum:

```json
{
  "success": true,
  "assetId": "asset_123",
  "orderId": "IKC-260312-1234",
  "kind": "cover",
  "name": "cover.jpg",
  "mimeType": "image/jpeg",
  "url": "http://127.0.0.1:3001/mock-assets/IKC-260312-1234/asset_123/cover.jpg"
}
```

Flow yang lebih sehat:

1. frontend upload file ke `/api/uploads`
2. frontend selalu mengirim `orderId` yang sama ke semua upload asset
3. Express validasi request lalu forward ke Apps Script
4. Apps Script membuat atau memakai folder `DRIVE_ROOT_FOLDER_ID/<orderId>/`
5. Apps Script upload file ke Google Drive
6. Apps Script simpan metadata upload ke Google Sheets
7. Express mengembalikan `assetId`, `driveFileId`, `driveFolderId`, `orderId`, dan `url`
8. `POST /api/orders` menyimpan `orderId` yang sama beserta referensi asset

Relasi data aktif saat ini:

1. `orders.order_id -> uploads.order_id`
2. `orders.invitation_slug -> wishes.invitation_slug`
3. `orders.order_id -> wishes.order_id`
4. `orders.cover_asset_id -> uploads.asset_id`
5. `orders.music_asset_id -> uploads.asset_id`
6. `orders.gallery_asset_ids[] -> uploads.asset_id`

### `POST /api/orders/email`

Dipakai sebagai trigger best-effort setelah `POST /api/orders` berhasil.

Body minimum:

```json
{
  "orderId": "IKC-260312-1234",
  "customer": {
    "email": "anisa@example.com"
  },
  "selectedTheme": {},
  "selectedPackage": {},
  "summary": {}
}
```

## 5A. Kontrak internal Express -> Apps Script

Apps Script tidak menjadi endpoint publik frontend. Semua request frontend tetap masuk ke Express.

Express memanggil Web App Apps Script dengan body JSON:

```json
{
  "secret": "shared-secret-internal",
  "action": "createOrder",
  "payload": {}
}
```

Action yang sudah disiapkan di starter Apps Script:

- `health`
- `createUpload`
- `listUploads`
- `createOrder`
- `listOrders`
- `getOrderById`
- `getOrderByInvitationSlug`
- `updateOrderStatus`
- `queueOrderEmail`
- `createWish`
- `listWishes`

### `GET /api/invitations/:slug`

Dipakai template live saat `useInvitationData` fetch data invitation.

Response harus sudah mengikuti schema template umum:

```json
{
  "guest": {},
  "couple": {},
  "event": {},
  "copy": {},
  "lovestory": [],
  "gallery": [],
  "features": {},
  "audio": {},
  "wishes": {}
}
```

### `POST /api/invitations/:slug/wishes`

Untuk ucapan dan RSVP dari tamu.

Body:

```json
{
  "name": "Rina",
  "attendance": "hadir",
  "message": "Selamat menempuh hidup baru"
}
```

## 6. Validasi backend yang wajib

- normalisasi tier: `EKSLUSIF` -> `EKSKLUSIF`
- pastikan `selectedTheme.packageTier` sama dengan `selectedPackage.tier`
- batasi jumlah galeri berdasarkan paket
- tolak `music.mode=upload` jika paket tidak mendukung
- kosongkan `stories` jika paket tidak mendukung love story
- batasi jumlah guest share sesuai paket
- jangan percaya nominal harga dari frontend; hitung ulang dari master paket di backend
- jangan percaya hasil upload dari frontend; validasi mime type, size, dan kind asset di backend
- simpan hanya referensi asset hasil upload pada entity order, jangan menyimpan `dataUrl` mentah di database

## 7. Struktur service Express yang disarankan

```text
src/
  integrations/
    appsScript/
      client.js
    googleWorkspace/
      client.js
      sheetsStore.js
      driveStore.js
  modules/
    packages/
      package.repository.js
      package.service.js
      package.controller.js
      package.routes.js
    themes/
    orders/
    invitations/
    uploads/
    wishes/
  middlewares/
    validateRequest.js
    handleUpload.js
  utils/
    normalizePackageTier.js
    buildInvitationSchema.js
  app.js
```

## 8. Prioritas implementasi backend

1. pertahankan kontrak endpoint public Express yang sudah dipakai frontend
2. deploy Apps Script Web App dan hubungkan `APPS_SCRIPT_BASE_URL` + `APPS_SCRIPT_SHARED_SECRET`
3. siapkan spreadsheet `orders`, `uploads`, `wishes`, `order_emails` dan folder root Drive
4. ganti provider Express dari `memory` ke `apps_script`
5. tambah admin workflow: verifikasi pembayaran, publish invitation, custom domain, guest import
6. tambahkan rate limit, retry, dan observability

## 9. Catatan penting untuk tahap berikutnya

- template saat ini sudah membaca `features` dari schema, jadi backend sebaiknya mengirim `features` final hasil rule paket
- frontend preview masih memakai `sessionStorage`, jadi backend belum wajib untuk mode preview
- preview form masih memakai `dataUrl` lokal untuk kebutuhan preview template
- submit order sekarang sudah melalui fase upload asset multipart lebih dulu, lalu mengirim referensi asset ke order API
- mock API saat ini memakai seed in-memory dan placeholder image URL untuk kebutuhan serialisasi JSON
- mock API order detail sekarang menghitung status `processing -> done` dari umur order agar polling halaman konfirmasi bisa diuji tanpa admin panel
- untuk Google Sheets, sebaiknya satu spreadsheet dipisah per environment agar data dev dan prod tidak tercampur
- spreadsheet dan folder Drive wajib di-share ke email service account dengan akses editor
- jika `GOOGLE_DRIVE_PUBLIC_READ=true`, backend akan membuat permission `anyone:reader` agar URL file bisa dipakai frontend secara langsung
- `APPS_SCRIPT_SHARED_SECRET` hanya untuk komunikasi internal Express -> Apps Script dan tidak boleh diekspos ke frontend
- Apps Script sebaiknya diperlakukan sebagai storage adapter, bukan tempat utama business rule paket
- karena frontend sudah melalui adapter API, migrasi dari mock Express ke backend Express final cukup di level data source dan middleware validasi
