import { expect, test } from "@playwright/test";

test.describe("velvet burgundy invitation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/undangan/velvet-burgundy?preview=1");
  });

  test("cover keeps background content inert until invitation is opened", async ({ page }) => {
    const openButton = page.getByRole("button", { name: "Buka Undangan" });

    await expect(openButton).toBeVisible();
    await expect(openButton).toBeFocused();

    const contentState = await page.evaluate(() => {
      const pageRoot = document.querySelector("[data-elementor-type='wp-page']");
      const siblings = pageRoot ? Array.from(pageRoot.children).filter((node) => node.id !== "sec") : [];
      return siblings.every((node) => node.hasAttribute("inert") && node.getAttribute("aria-hidden") === "true");
    });
    expect(contentState).toBe(true);

    const focusedHrefs = [];
    for (let index = 0; index < 4; index += 1) {
      await page.keyboard.press("Tab");
      focusedHrefs.push(
        await page.evaluate(() => document.activeElement?.getAttribute?.("href") || null)
      );
    }
    expect(focusedHrefs).toEqual([null, null, null, null]);

    await openButton.click();
    await expect(page.locator("#home")).toBeFocused();
  });

  test("gallery items expose accessible names after invitation is opened", async ({ page }) => {
    await page.getByRole("button", { name: "Buka Undangan" }).click();

    const galleryLinks = page.locator("#galeri .e-gallery-item");
    await expect(galleryLinks).toHaveCount(5);

    for (let index = 0; index < 5; index += 1) {
      await expect(galleryLinks.nth(index)).toHaveAttribute("aria-label", `Buka foto galeri ${index + 1}`);
    }
  });

  test("wish submission keeps the stored timestamp format consistent", async ({ page }) => {
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    await page.getByRole("link", { name: "Comment-dots" }).click();

    await page.getByPlaceholder("Nama").fill("Audit E2E");
    await page.getByPlaceholder("Ucapan").fill("Regression timestamp");
    await page.locator("#konfirmasi").selectOption("Datang");
    await page.getByRole("button", { name: "Kirim" }).click();

    const firstWish = page.locator("[data-wishes-list] .vb-wishes-item").first();
    await expect(firstWish).toContainText("Audit E2E");
    await expect(firstWish).toContainText("Regression timestamp");
    await expect(firstWish).toContainText(/\d{1,2} \w{3} \d{4}, \d{2}:\d{2}/);
  });
});
