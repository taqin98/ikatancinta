const QR_IMAGE_ENDPOINT = "https://api.qrserver.com/v1/create-qr-code/";

function pickText(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    const text = String(value).replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

export function buildGuestQrImageUrl(value) {
  const text = pickText(value);
  if (!text) return "";
  return `${QR_IMAGE_ENDPOINT}?size=360x360&data=${encodeURIComponent(text)}`;
}

export function readCurrentGuestQrUrl() {
  if (typeof window === "undefined") return "";

  try {
    const url = new URL(window.location.href);
    url.hash = "";
    return url.toString();
  } catch {
    return window.location.href || "";
  }
}

export function upsertGuestQrSection(options = {}) {
  const {
    root,
    guestName,
    beforeNode,
    markerAttribute = "data-guest-qr-section",
    sectionClassName = "elementor-element e-con-full e-flex e-con e-child",
  } = options;

  if (!root) return null;

  const existingSection = root.querySelector(`[${markerAttribute}='true']`);
  existingSection?.remove();

  const normalizedGuestName = pickText(guestName);
  if (!normalizedGuestName || !beforeNode?.parentNode) return null;

  const guestQrUrl = readCurrentGuestQrUrl();
  const qrImageUrl = buildGuestQrImageUrl(guestQrUrl);
  if (!guestQrUrl || !qrImageUrl) return null;

  const doc = root.ownerDocument || document;
  const section = doc.createElement("section");
  section.setAttribute(markerAttribute, "true");
  section.className = sectionClassName;
  section.innerHTML = `
    <div style="width:min(100%,760px);margin:0 auto 32px;padding:32px 24px;border-radius:32px;background:linear-gradient(180deg,rgba(255,250,244,0.98),rgba(250,242,230,0.96));border:1px solid rgba(180,152,118,0.25);box-shadow:0 18px 48px rgba(89,66,42,0.08);text-align:center;">
      <p style="margin:0;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#9e7e57;">QR Tamu</p>
      <h2 style="margin:14px 0 0;font-size:34px;line-height:1.2;color:#4d3925;font-weight:600;">${normalizedGuestName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</h2>
      <p style="max-width:560px;margin:14px auto 0;font-size:15px;line-height:1.8;color:#745a3e;">
        Tunjukkan QR ini kepada petugas resepsionis. Saat discan, nama tamu akan otomatis masuk ke buku tamu sebagai data kehadiran.
      </p>
      <div style="margin:24px auto 0;display:inline-flex;align-items:center;justify-content:center;padding:16px;border-radius:28px;background:#fff;border:1px solid rgba(180,152,118,0.2);">
        <img src="${qrImageUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" alt="${`QR code undangan ${normalizedGuestName}`.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}" loading="lazy" referrerpolicy="no-referrer" style="display:block;width:min(100%,280px);height:auto;border-radius:20px;" />
      </div>
      <p style="margin:18px 0 0;font-size:12px;line-height:1.7;color:#8f7456;word-break:break-word;">${guestQrUrl
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")}</p>
    </div>
  `;

  beforeNode.parentNode.insertBefore(section, beforeNode);
  return section;
}
