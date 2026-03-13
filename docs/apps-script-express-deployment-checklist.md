# Checklist Deployment Express + Apps Script

## 1. Deploy Apps Script

- buat project Google Apps Script baru
- copy file dari `google-apps-script-starter/Code.gs`
- copy file dari `google-apps-script-starter/appsscript.json`
- pastikan `webapp.access = ANYONE_ANONYMOUS`
- pastikan `webapp.executeAs = USER_DEPLOYING`
- buka `Project Settings -> Script Properties`
- isi:
  - `APPS_SCRIPT_SHARED_SECRET`
  - `SPREADSHEET_ID`
  - `DRIVE_ROOT_FOLDER_ID`
  - `DRIVE_PUBLIC_READ=true`
  - `SHEET_ORDERS=orders`
  - `SHEET_UPLOADS=uploads`
  - `SHEET_WISHES=wishes`
  - `SHEET_ORDEREMAILS=order_emails`
- deploy sebagai `Web app`
- set `Execute as: Me`
- simpan URL deployment
- jika memakai deployment yang sudah ada, buat versi baru lalu redeploy

## 2. Siapkan Google Sheets

- buat satu spreadsheet khusus environment
- buat atau biarkan Apps Script membuat sheet:
  - `orders`
  - `uploads`
  - `wishes`
  - `order_emails`
- pastikan header sheet menyesuaikan versi terbaru starter:
  - `orders` sekarang memiliki kolom `invitation_slug`
  - `orders` sekarang memiliki kolom audit ringan `updated_at`, `published_at`, `published_by`, `last_updated_by`, `last_update_type`, `last_update_note`
  - `wishes` sekarang memiliki kolom `order_id`
  - `uploads` sekarang memiliki kolom `order_id`
- pastikan akun Apps Script punya akses edit

## 3. Siapkan Google Drive

- buat satu folder root untuk media
- salin folder ID ke `DRIVE_ROOT_FOLDER_ID`
- pastikan akun Apps Script punya akses edit
- backend akan membuat subfolder otomatis per `orderId` di dalam folder root

## 4. Siapkan Backend Express

- copy `backend-express-starter/` ke repo backend baru
- copy `.env.example` menjadi `.env`
- atau mulai dari `backend-express-starter/.env.apps-script.ready.example`
- isi minimal:
  - `DATA_STORE_PROVIDER=apps_script`
  - `MEDIA_STORAGE_PROVIDER=apps_script`
  - `APPS_SCRIPT_BASE_URL=<deployment-url>`
  - `APPS_SCRIPT_SHARED_SECRET=<shared-secret>`
  - `ADMIN_AUTH_EMAIL=<email-admin>`
  - `ADMIN_AUTH_PASSWORD=<password-admin>`
  - `ADMIN_JWT_SECRET=<jwt-secret>`
- jalankan `npm install`
- jalankan `npm run start`
- cek `GET /api/health`

## 5. Siapkan Frontend

- copy `.env.local.example` menjadi `.env.local`
- arahkan semua `VITE_*_API_URL` ke backend Express
- jalankan frontend

## 6. Verifikasi Minimum

- `GET /api/health`
- `GET /api/packages`
- `GET /api/themes`
- `POST /api/invitations/:slug/wishes`
- `POST /api/uploads`
- pastikan request upload menyertakan `orderId`
- `POST /api/orders`
- `POST /api/admin/auth/login`
- simpan JWT dari response login
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `PUT /api/orders/:orderId`
- `PATCH /api/orders/:orderId`
- `POST /api/orders/:orderId/publish`
- `GET /api/admin/summary`
- pastikan request admin menyertakan header `Authorization: Bearer <admin-jwt>`
- opsional: sertakan `x-admin-actor` agar audit trail order terisi lebih jelas

## 7. File bantu test

- `backend-express-starter/http/express-api.http`
- `backend-express-starter/http/apps-script.http`
