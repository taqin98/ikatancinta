import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";

const SAMPLE_MULTI_RESEPSI_DRAFT = {
  theme: "botanical-elegance",
  packageTier: "EKSKLUSIF",
  couple: {
    groom: { name: "Ozy", fullname: "Ozy Firmansyah" },
    bride: { name: "Diyah", fullname: "Diyah Lestari" },
  },
  event: {
    akad: {
      title: "Akad Nikah",
      date: "Sabtu, 20 Juni 2026",
      time: "08.00 – 10.00 WIB",
      venueName: "Masjid Raya Al-Bayan",
      address: "Jl. Masjid Raya No. 1",
      mapsUrl: "https://maps.google.com",
    },
    resepsi: {
      title: "Resepsi Utama",
      date: "Sabtu, 20 Juni 2026",
      time: "11.00 – 14.00 WIB",
      venueName: "Grand Ballroom Hotel Savoy",
      address: "Jl. Asia Afrika No. 112",
      mapsUrl: "https://maps.google.com",
    },
    resepsiList: [
      {
        id: 1,
        title: "Resepsi Utama",
        date: "Sabtu, 20 Juni 2026",
        time: "11.00 – 14.00 WIB",
        venueName: "Grand Ballroom Hotel Savoy",
        address: "Jl. Asia Afrika No. 112",
        mapsUrl: "https://maps.google.com",
      },
      {
        id: 2,
        title: "Ngunduh Mantu",
        date: "Sabtu, 27 Juni 2026",
        time: "13.00 – 17.00 WIB",
        venueName: "Gedung Graha Saba",
        address: "Jl. Letjen Suprapto No. 5",
        mapsUrl: "https://maps.google.com",
      },
    ],
  },
  copy: {
    akadTitle: "Akad Nikah",
    resepsiTitle: "Resepsi",
  },
};

test.describe("Exclusive Template Multiple Receptions", () => {
  test("allows adding and removing multiple receptions in order form and renders them in review", async ({ page }) => {
    // Navigate to order form with exclusive theme botanical-elegance
    await page.goto("/buat-undangan?theme=botanical-elegance");

    // Step 1: Mempelai
    await page.getByPlaceholder("Contoh: Anisa Putri").fill("Diyah Lestari");
    await page.getByPlaceholder("Contoh: 08567452717").fill("081234567890");
    await page.getByPlaceholder("Contoh: anisa@email.com").fill("diyah@example.com");
    await page.getByPlaceholder("Nama Lengkap").first().fill("Ozy Firmansyah");
    await page.getByPlaceholder("Nama Lengkap").nth(1).fill("Diyah Lestari");
    await page.getByRole("button", { name: "Selanjutnya" }).click();

    // Step 2: Acara
    await expect(page.getByRole("heading", { name: "Detail Acara", exact: true })).toBeVisible();

    // Fill Akad
    await page.locator("#akad_date").fill("2026-06-20");
    await page.locator("#akad_start_time").fill("08:00");
    await page.locator("#akad_end_time").fill("10:00");
    await page.locator("#akad_venue").fill("Masjid Raya Al-Bayan");

    // Check "Tambah Resepsi" button exists for exclusive package
    const addResepsiBtn = page.getByRole("button", { name: /Tambah Resepsi/i });
    await expect(addResepsiBtn).toBeVisible();

    // Fill Resepsi 1
    await page.locator("#resepsi_date").fill("2026-06-20");
    await page.locator("#resepsi_start_time").fill("11:00");
    await page.locator("#resepsi_end_time").fill("14:00");
    await page.locator("#resepsi_venue").fill("Grand Ballroom Hotel Savoy");

    // Add Resepsi 2
    await addResepsiBtn.click();

    // Fill Resepsi 2
    await page.locator('[data-resepsi-field^="title-"]').last().fill("Ngunduh Mantu");
    await page.locator('[data-resepsi-field^="date-"]').last().fill("2026-06-27");
    await page.locator('[data-resepsi-field^="start_time-"]').last().fill("13:00");
    await page.locator('[data-resepsi-field^="end_time-"]').last().fill("17:00");
    await page.locator('[data-resepsi-field^="venue-"]').last().fill("Gedung Graha Saba");

    // Verify 2 reception cards exist
    await expect(page.locator('[data-resepsi-field^="title-"]')).toHaveCount(2);

    // Test Add & Remove Resepsi 3
    await addResepsiBtn.click();
    await expect(page.locator('[data-resepsi-field^="title-"]')).toHaveCount(3);
    const deleteButtons = page.getByRole("button", { name: /Hapus/i });
    await deleteButtons.last().click();
    await expect(page.locator('[data-resepsi-field^="title-"]')).toHaveCount(2);

    // Advance to Step 3
    await page.getByRole("button", { name: "Selanjutnya" }).click();
    await expect(page.getByRole("heading", { name: "Visual Undangan", exact: true })).toBeVisible();

    // Provide required photos for step 3
    const coverFile = {
      name: "cover.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAHEgKGTN7L7wAAAABJRU5ErkJggg==",
        "base64"
      ),
    };
    const fileInputs = page.locator("main input[type='file']");
    const count = await fileInputs.count();
    for (let i = 0; i < count; i++) {
      await fileInputs.nth(i).setInputFiles(coverFile);
    }

    // Select a quote preset
    await page.locator("select").first().selectOption({ index: 1 });

    // Go to Step 4 Review
    await page.getByRole("button", { name: /Review & Submit/i }).click();
    await expect(page.getByText("Cek Data Terakhir")).toBeVisible();

    // Verify both receptions are rendered in review
    await expect(page.getByText("Grand Ballroom Hotel Savoy")).toBeVisible();
    await expect(page.getByText("Ngunduh Mantu")).toBeVisible();
    await expect(page.getByText("Gedung Graha Saba")).toBeVisible();
  });

  test("renders multiple reception cards in Botanical Elegance template preview", async ({ page }) => {
    await page.addInitScript((draft) => {
      sessionStorage.setItem("ikc_invitation_draft", JSON.stringify(draft));
    }, SAMPLE_MULTI_RESEPSI_DRAFT);
    await page.goto("/undangan/botanical-elegance?preview=1");

    // Open invitation
    const openBtn = page.getByRole("button", { name: /Buka Undangan/i });
    if (await openBtn.isVisible()) {
      await openBtn.click();
    }

    // Both reception cards should be in the DOM
    await expect(page.getByText("Grand Ballroom Hotel Savoy")).toBeVisible();
    await expect(page.getByText("Gedung Graha Saba")).toBeVisible();
    await expect(page.getByText("Ngunduh Mantu")).toBeVisible();
  });

  test("renders multiple reception cards in Puspa Asmara template preview", async ({ page }) => {
    await page.addInitScript((draft) => {
      sessionStorage.setItem("ikc_invitation_draft", JSON.stringify(draft));
    }, SAMPLE_MULTI_RESEPSI_DRAFT);
    await page.goto("/undangan/puspa-asmara?preview=1");

    const openBtn = page.getByRole("button", { name: /Buka Undangan/i });
    if (await openBtn.isVisible()) {
      await openBtn.click();
    }

    await expect(page.getByText("Grand Ballroom Hotel Savoy")).toBeVisible();
    await expect(page.getByText("Gedung Graha Saba")).toBeVisible();
  });

  test("renders multiple reception cards in Eternal Summit template preview", async ({ page }) => {
    await page.addInitScript((draft) => {
      sessionStorage.setItem("ikc_invitation_draft", JSON.stringify(draft));
    }, SAMPLE_MULTI_RESEPSI_DRAFT);
    await page.goto("/undangan/eternal-summit?preview=1");

    const openBtn = page.getByRole("button", { name: /Buka Undangan/i });
    if (await openBtn.isVisible()) {
      await openBtn.click();
    }

    await expect(page.getByText("Grand Ballroom Hotel Savoy")).toBeVisible();
    await expect(page.getByText("Gedung Graha Saba")).toBeVisible();
  });
});
