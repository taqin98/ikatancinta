# Template Script Properties Apps Script

Isi `Project Settings -> Script Properties` dengan pasangan key/value berikut.

## Wajib

- `APPS_SCRIPT_SHARED_SECRET`
  - isi dengan secret acak panjang
  - nilai ini harus sama persis dengan `APPS_SCRIPT_SHARED_SECRET` di backend Express

- `SPREADSHEET_ID`
  - isi dengan ID spreadsheet Google Sheets yang akan menyimpan data
  - format contoh: `1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

- `DRIVE_ROOT_FOLDER_ID`
  - isi dengan ID folder root Google Drive untuk media upload
  - format contoh: `0BxxRootFolderAbCdEf`
  - backend akan membuat subfolder otomatis per `orderId` di bawah folder root ini

## Direkomendasikan

- `DRIVE_PUBLIC_READ=true`
  - agar file upload bisa menghasilkan URL yang langsung dipakai frontend

- `SHEET_ORDERS=orders`
- `SHEET_UPLOADS=uploads`
- `SHEET_WISHES=wishes`
- `SHEET_ORDEREMAILS=order_emails`

## Cara mencari nilainya

### Spreadsheet ID

- buka Google Sheets
- lihat URL:
  - `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
- ambil bagian `<SPREADSHEET_ID>`

### Drive Folder ID

- buka folder Google Drive
- lihat URL:
  - `https://drive.google.com/drive/folders/<DRIVE_ROOT_FOLDER_ID>`
- ambil bagian `<DRIVE_ROOT_FOLDER_ID>`

## Contoh pengisian

- `APPS_SCRIPT_SHARED_SECRET=ikatancinta-super-secret-2026`
- `SPREADSHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`
- `DRIVE_ROOT_FOLDER_ID=0BxxRootFolderAbCdEf`
- `DRIVE_PUBLIC_READ=true`
- `SHEET_ORDERS=orders`
- `SHEET_UPLOADS=uploads`
- `SHEET_WISHES=wishes`
- `SHEET_ORDEREMAILS=order_emails`
