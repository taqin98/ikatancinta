import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";

const COVER_IMAGE_FILE = {
  name: "cover.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAHEgKGTN7L7wAAAABJRU5ErkJggg==",
    "base64"
  ),
};

async function fillStepOne(page) {
  await page.getByPlaceholder("Contoh: Anisa Putri").fill("Anisa Putri");
  await page.getByPlaceholder("Contoh: 08567452717").fill("08567452717");
  await page.getByPlaceholder("Contoh: anisa@email.com").fill("anisa@email.com");
  await page.getByPlaceholder("Nama Lengkap").first().fill("Rizky Pratama");
  await page.getByPlaceholder("Nama Lengkap").nth(1).fill("Anisa Putri");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
}

async function fillStepTwo(page) {
  await page.locator("#akad_date").fill("2026-02-28");
  await page.locator("#akad_start_time").fill("08:00");
  await page.locator("#akad_end_time").fill("10:00");
  await page.locator("#akad_venue").fill("Masjid Agung Al-Azhar");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
}

async function gotoStepThree(page, search = "") {
  await page.goto(`/buat-undangan${search}`);
  await fillStepOne(page);
  await fillStepTwo(page);
}

async function uploadCover(page) {
  await page.locator("#cover_upload_section input[type='file']").first().setInputFiles(COVER_IMAGE_FILE);
}

async function openReviewMediaPanel(page) {
  const mediaSection = page.locator("details").filter({ has: page.getByRole("heading", { name: "Foto & Cerita" }) }).first();
  const isOpen = await mediaSection.evaluate((node) => node.hasAttribute("open"));
  if (!isOpen) {
    await mediaSection.locator("summary").click();
  }
}

test("validasi step 1 dan step 2 mengarahkan fokus ke field error", async ({ page }) => {
  await page.goto("/buat-undangan");

  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await expect(page.getByRole("alert")).toContainText("Nama customer wajib diisi.");
  await expect(page.locator("#customer_name")).toBeFocused();

  await page.locator("#customer_name").fill("Anisa Putri");
  await page.locator("#customer_phone").fill("abc");
  await page.locator("#customer_email").fill("anisa@");
  await page.locator("#groom_fullname").fill("Rizky Pratama");
  await page.locator("#bride_fullname").fill("Anisa Putri");
  await page.getByRole("button", { name: "Selanjutnya" }).click();

  await expect(page.getByRole("alert")).toContainText("Format No HP / WA tidak valid.");
  await expect(page.locator("#customer_phone")).toBeFocused();

  await page.locator("#customer_phone").fill("08567452717");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await expect(page.getByRole("alert")).toContainText("Format email tidak valid.");
  await expect(page.locator("#customer_email")).toBeFocused();

  await page.locator("#customer_email").fill("anisa@email.com");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await expect(page.getByRole("heading", { name: "Detail Acara", exact: true })).toBeVisible();

  await page.locator("#akad_date").fill("2026-02-28");
  await page.locator("#akad_start_time").fill("10:00");
  await page.locator("#akad_end_time").fill("09:00");
  await page.locator("#akad_venue").fill("Masjid Agung Al-Azhar");
  await page.getByRole("button", { name: "Selanjutnya" }).click();

  await expect(page.getByRole("alert")).toContainText("Jam selesai akad harus lebih besar dari jam mulai.");
  await expect(page.locator("#akad_end_time")).toBeFocused();
});

test("alur buat undangan sampai halaman sukses", async ({ page }) => {
  await gotoStepThree(page);
  await uploadCover(page);

  await page.getByRole("button", { name: /Review & Submit/i }).click();

  await expect(page.getByText("Cek Data Terakhir")).toBeVisible();
  await page.getByRole("button", { name: /Submit & Buat Undangan/i }).click();

  await expect(page).toHaveURL(/\/konfirmasi-order$/);
  await expect(page.getByText("Pesanan Anda Sedang")).toBeVisible();
});

test("submit gagal lalu retry dengan tombol coba lagi", async ({ page }) => {
  await gotoStepThree(page, "?mock_fail_once=1");
  await uploadCover(page);
  await page.getByRole("button", { name: /Review & Submit/i }).click();

  await page.getByRole("button", { name: /Submit & Buat Undangan/i }).click();
  await expect(page.getByRole("alert")).toContainText("Submit gagal. Periksa koneksi lalu coba lagi.");
  await expect(page.getByRole("button", { name: "Coba Lagi" })).toBeVisible();

  await page.getByRole("button", { name: "Coba Lagi" }).click();
  await expect(page).toHaveURL(/\/konfirmasi-order$/);
});

test("step 3 musik list tersimpan dan tampil di review", async ({ page }) => {
  await gotoStepThree(page);
  await uploadCover(page);

  await page.locator('select').first().selectOption("novo-amor-anchor");
  await page.getByRole("button", { name: /Review & Submit/i }).click();

  await expect(page.getByText("Cek Data Terakhir")).toBeVisible();
  await openReviewMediaPanel(page);
  await expect(page.getByText("List: Novo Amor - Anchor")).toBeVisible();
});

test("step 3 musik upload validasi format ukuran dan sukses", async ({ page }) => {
  await gotoStepThree(page);
  await uploadCover(page);

  await page.getByText("Upload Musik Sendiri").click();
  await page.getByRole("button", { name: /Review & Submit/i }).click();
  await expect(page.getByRole("alert")).toContainText("Silakan upload file musik MP3 atau pilih mode list musik.");

  await page.locator("#music_upload_input").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("halo"),
  });
  await expect(page.getByRole("alert")).toContainText("File musik harus berformat MP3.");

  await page.locator("#music_upload_input").setInputFiles({
    name: "big.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 1),
  });
  await expect(page.getByRole("alert")).toContainText("Ukuran file musik maksimal 5MB.");

  await page.locator("#music_upload_input").setInputFiles({
    name: "custom.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("ID3"),
  });

  await page.getByRole("button", { name: /Review & Submit/i }).click();
  await expect(page.getByText("Cek Data Terakhir")).toBeVisible();
  await openReviewMediaPanel(page);
  await expect(page.getByText("Upload: custom.mp3")).toBeVisible();
});
