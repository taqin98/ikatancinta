import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { postInvitationWish } from "../../../services/wishesApi";
import sourceHtml from "./schema/source.html?raw";
import { defaultSchema } from "./schema/InvitationSchema";
import { aosPreset, tokens } from "./tokens";
import "./misty-romance.css";

const BODY_CLASSES = [
    "wp-singular",
    "page-template-default",
    "page",
    "page-id-13455",
    "wp-embed-responsive",
    "wp-theme-hello-elementor",
    "hello-elementor-default",
    "elementor-default",
    "elementor-template-canvas",
    "elementor-kit-5",
    "elementor-page",
    "elementor-page-13455",
];

const APP_BASE_URL = import.meta.env.BASE_URL || "/";
const normalizedBaseUrl = APP_BASE_URL.endsWith("/") ? APP_BASE_URL : `${APP_BASE_URL}/`;
const PUBLIC_ASSET_PREFIX = `${normalizedBaseUrl}templates/premium/misty-romance/assets/`;
const SKIP_ASSET = "__MISTY_SKIP_ASSET__";
const REMOTE_ASSET_MAP = {
    "https://ikatancinta.in/wp-content/plugins/elementor/assets/lib/animations/styles/fadeInUp.min.css":
        "assets/css/vendor/elementor/lib/animations/styles/fadeInUp.min.css",
    "https://unpkg.com/aos@2.3.1/dist/aos.css": SKIP_ASSET,
};
const LOCAL_GALLERY_MODULES = import.meta.glob("./assets/images/gallery/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
});

const FALLBACKS = {
    innerBackground: "assets/images/cover/ART-BNW-FX-2-JPG-2.webp",
    akadBackground: "assets/images/cover/hitam-5-1.webp",
    resepsiBackground: "assets/images/cover/hitam-5-1.webp",
    closingBackground: "assets/images/cover/akhir-ed-1.webp",
    heroPhoto: "assets/images/gallery/gallery-03.jpg",
    groomPhoto: "assets/images/couple/groom.jpg",
    bridePhoto: "assets/images/couple/bride.jpg",
    mainLottie: "assets/bird-hitam-1-1-1.json",
    secondaryLottie: "assets/bird-hitam-1-1-1.json",
    backgroundVideo: "assets/audio/waterfall2.mp4",
    backgroundAudio: "assets/audio/Percy-Faith-His-Orchestra-A-Summer-Place-1959__Wd3dlEvodk-1.mp3",
};

const STATIC_FALLBACK_GALLERY = [
    "assets/images/gallery/gallery-10.jpg",
    "assets/images/gallery/gallery-01.jpg",
    "assets/images/gallery/gallery-02.jpg",
    "assets/images/gallery/gallery-03.jpg",
    "assets/images/gallery/gallery-04.jpg",
    "assets/images/gallery/gallery-05.jpg",
    "assets/images/gallery/gallery-06.jpg",
    "assets/images/gallery/gallery-07.jpg",
    "assets/images/gallery/gallery-08.jpg",
];
const PREFERRED_GALLERY_ORDER = [
    "gallery-10",
    "gallery-01",
    "gallery-02",
    "gallery-03",
    "gallery-04",
    "gallery-05",
    "gallery-06",
    "gallery-07",
    "gallery-08",
];
const LOCAL_GALLERY_FILES = Object.entries(LOCAL_GALLERY_MODULES)
    .filter(([modulePath]) => !/-\d+x\d+\.(jpg|jpeg|png|webp)$/i.test(modulePath))
    .map(([modulePath, url]) => {
        const fileName = modulePath.split("/").pop() || "";
        const baseName = fileName.replace(/\.[^.]+$/, "").toLowerCase();
        return {
            baseName,
            modulePath,
            url: String(url || ""),
        };
    })
    .filter((item) => item.url)
    .sort((a, b) => a.modulePath.localeCompare(b.modulePath, undefined, { numeric: true, sensitivity: "base" }));
const FALLBACK_GALLERY = [
    ...PREFERRED_GALLERY_ORDER.map((baseName) => LOCAL_GALLERY_FILES.find((item) => item.baseName === baseName)?.url).filter(Boolean),
    ...LOCAL_GALLERY_FILES.filter((item) => !PREFERRED_GALLERY_ORDER.includes(item.baseName)).map((item) => item.url),
];
const FINAL_FALLBACK_GALLERY = FALLBACK_GALLERY.length > 0 ? FALLBACK_GALLERY : STATIC_FALLBACK_GALLERY;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let lottieLibraryPromise = null;

function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeAssetReference(value) {
    return String(value || "")
        .replace(/\\\//g, "/")
        .replace(/[?#].*$/, "")
        .trim();
}

function isSameAsset(candidate, reference) {
    const normalizedCandidate = normalizeAssetReference(candidate);
    const normalizedReference = normalizeAssetReference(reference);
    return Boolean(normalizedCandidate && normalizedReference && normalizedCandidate === normalizedReference);
}

function isTemplateAssetReference(value) {
    const normalized = normalizeAssetReference(value);
    if (!normalized) return false;

    return (
        normalized.startsWith("assets/") ||
        normalized.startsWith("/assets/") ||
        normalized.includes("/templates/premium/misty-romance/assets/")
    );
}

function resolveSectionPhoto(path, fallbackAsset, options = {}) {
    const normalized = normalizeText(path);
    if (!normalized) return fallbackAsset || "";

    if (options.requireTemplateAsset && !isTemplateAssetReference(normalized)) {
        return fallbackAsset || "";
    }

    const rejectedAssets = Array.isArray(options.rejectSameAs) ? options.rejectSameAs : [];
    if (rejectedAssets.some((item) => isSameAsset(normalized, item))) {
        return fallbackAsset || "";
    }

    return normalized;
}

function pickText(...values) {
    for (const value of values) {
        const text = normalizeText(value);
        if (text) return text;
    }
    return "";
}

function pickAsset(...values) {
    for (const value of values) {
        if (typeof value === "string") {
            const text = pickText(value);
            if (text) return text;
            continue;
        }

        if (value && typeof value === "object") {
            const text = pickText(value.url, value.src, value.photo, value.image, value.imageUrl, value.fileUrl, value.dataUrl);
            if (text) return text;
        }
    }
    return "";
}

function formatDateID(value, fallback = "") {
    const text = pickText(value);
    if (!text) return fallback;

    const candidate = new Date(text);
    if (!Number.isFinite(candidate.getTime())) {
        return text;
    }

    try {
        return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(candidate);
    } catch {
        return text;
    }
}

function formatTimeRange(start, end, fallback = "") {
    const startText = pickText(start);
    const endText = pickText(end);
    if (!startText) return fallback;
    if (!endText) return `${startText.replace(":", ".")} WIB`;
    return `${startText.replace(":", ".")} - ${endText.replace(":", ".")} WIB`;
}

function buildLiveDateISO(dateValue, timeValue, fallbackValue) {
    const sourceDate = pickText(dateValue);
    if (!sourceDate) return fallbackValue || defaultSchema.event.dateISO;

    const timeMatch = pickText(timeValue).match(/(\d{1,2})[:.](\d{2})/);
    const hours = timeMatch ? timeMatch[1].padStart(2, "0") : "09";
    const minutes = timeMatch ? timeMatch[2] : "00";
    const candidate = new Date(`${sourceDate}T${hours}:${minutes}:00`);
    if (!Number.isFinite(candidate.getTime())) {
        return fallbackValue || defaultSchema.event.dateISO;
    }
    return candidate.toISOString();
}

function normalizeLoveStoryItem(item) {
    if (!item || typeof item !== "object") return null;
    const title = pickText(item.title, item.label, item.heading, item.name);
    const date = pickText(item.date, item.year);
    const text = pickText(item.text, item.description, item.story, item.content);
    const photo = pickAsset(item.photo, item.image);
    if (!title && !date && !text && !photo) return null;
    return { title, date, text, photo };
}

const BANK_LOGO_FALLBACKS = {
    bca: "assets/images/payment/bca/bca-logo.png",
    dana: "assets/images/payment/dana/dana-logo.png",
};

function resolveBankLogo(bankName, explicitLogo) {
    const logo = pickAsset(explicitLogo);
    if (logo) return logo;

    const normalizedBank = pickText(bankName).toLowerCase();
    if (normalizedBank.includes("bca")) return BANK_LOGO_FALLBACKS.bca;
    if (normalizedBank.includes("dana")) return BANK_LOGO_FALLBACKS.dana;
    return "";
}

function normalizeBankAccount(item) {
    const bank = pickText(item?.bankName, item?.bank, item?.provider, item?.title);
    const account = pickText(item?.account, item?.accountNumber, item?.number);
    const name = pickText(item?.name, item?.accountName, item?.accountHolder);
    const logo = resolveBankLogo(bank, item?.logo || item?.logoUrl || item?.image);
    return { bank, account, name, logo };
}

function formatShippingMarkup(shipping, fallbackAddress) {
    const recipient = pickText(shipping?.recipient, defaultSchema.gift?.shipping?.recipient, defaultSchema.couple.groom.nameFull);
    const phone = pickText(shipping?.phone, defaultSchema.gift?.shipping?.phone, "-");
    const address = pickText(shipping?.address, fallbackAddress, defaultSchema.gift?.shipping?.address, defaultSchema.event.akad.address);
    return `<p>Nama Penerima : ${escapeHtml(recipient)}</p><p>No. HP : ${escapeHtml(phone || "-")}</p><p>${escapeHtml(address)}</p>`;
}

function formatLocationMarkup(detail, fallbackDetail = {}) {
    const venueName = pickText(detail?.venueName, detail?.venue, detail?.locationName, fallbackDetail?.venueName, fallbackDetail?.venue);
    const address = pickText(detail?.address, fallbackDetail?.address);

    if (venueName && address) {
        return `<p class="misty-location-venue">${escapeHtml(venueName)}</p><p class="misty-location-address">${escapeHtml(address)}</p>`;
    }

    if (venueName) {
        return `<p class="misty-location-venue">${escapeHtml(venueName)}</p>`;
    }

    return `<p class="misty-location-address">${escapeHtml(address || "-")}</p>`;
}

function buildCalendarLocation(detail, fallbackDetail = {}) {
    const venueName = pickText(detail?.venueName, detail?.venue, detail?.locationName, fallbackDetail?.venueName, fallbackDetail?.venue);
    const address = pickText(detail?.address, fallbackDetail?.address);
    return [venueName, address].filter(Boolean).join(", ");
}

function formatIcsDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function escapeIcsText(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

function formatGoogleCalendarDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function buildCalendarEventMeta(invitationData) {
    const startDate = new Date(invitationData?.event?.dateISO || "");
    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) return null;

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const title = `${pickText(invitationData?.couple?.groom?.nickName, invitationData?.couple?.groom?.nameFull)} & ${pickText(invitationData?.couple?.bride?.nickName, invitationData?.couple?.bride?.nameFull)}`.trim();
    const summary = title ? `Pernikahan ${title}` : "Save The Date";
    const location = buildCalendarLocation(invitationData?.event?.akad, defaultSchema.event.akad);
    const description = pickText(invitationData?.copy?.openingText, invitationData?.copy?.quote, defaultSchema.copy.openingText);

    return {
        startDate,
        endDate,
        summary,
        location,
        description,
    };
}

function openGoogleCalendar(invitationData) {
    const eventMeta = buildCalendarEventMeta(invitationData);
    if (!eventMeta) return;

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: eventMeta.summary,
        dates: `${formatGoogleCalendarDate(eventMeta.startDate)}/${formatGoogleCalendarDate(eventMeta.endDate)}`,
        details: eventMeta.description,
        location: eventMeta.location,
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer");
}

function shouldUseIcsCalendar() {
    if (typeof navigator === "undefined") return false;
    const userAgent = String(navigator.userAgent || navigator.vendor || "").toLowerCase();
    return /iphone|ipad|ipod|macintosh/.test(userAgent);
}

function downloadCalendarFile(invitationData, invitationSlug = "misty-romance") {
    const eventMeta = buildCalendarEventMeta(invitationData);
    if (!eventMeta) return;

    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Ikatan Cinta//Misty Romance//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${eventMeta.startDate.getTime()}-misty-romance@ikatancinta`,
        `DTSTAMP:${formatIcsDateLocal(new Date())}`,
        `SUMMARY:${escapeIcsText(eventMeta.summary)}`,
        `DTSTART:${formatIcsDateLocal(eventMeta.startDate)}`,
        `DTEND:${formatIcsDateLocal(eventMeta.endDate)}`,
        `DESCRIPTION:${escapeIcsText(eventMeta.description)}`,
        `LOCATION:${escapeIcsText(eventMeta.location)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(eventMeta.summary)}`,
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${String(invitationSlug || "save-the-date").replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "save-the-date"}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setBackgroundImage(root, selector, image, options = {}) {
    if (!root || !selector || !image) return;
    const resolved = resolveAssetUrl(image);
    if (!resolved || resolved === SKIP_ASSET) return;

    const {
        position = "center center",
        size = "cover",
        repeat = "no-repeat",
    } = options;

    const selectors = `${selector}, ${selector} > .elementor-motion-effects-container > .elementor-motion-effects-layer`;
    root.querySelectorAll(selectors).forEach((node) => {
        node.style.backgroundImage = `url("${resolved}")`;
        node.style.backgroundPosition = position;
        node.style.backgroundSize = size;
        node.style.backgroundRepeat = repeat;
    });
}

function formatWishRelativeTime(value) {
    const normalized = normalizeText(value);
    if (!normalized) return "Baru saja";
    if (/baru saja|yang lalu/i.test(normalized)) return normalized;

    const timestamp = new Date(normalized).getTime();
    if (!Number.isFinite(timestamp)) return normalized;

    const diffMs = Date.now() - timestamp;
    if (diffMs <= 0) return "Baru saja";

    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    const yearMs = 365 * dayMs;

    if (diffMs < minuteMs) return "Baru saja";
    if (diffMs < hourMs) {
        const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
        return `${minutes} menit yang lalu`;
    }
    if (diffMs < dayMs) {
        const hours = Math.max(1, Math.floor(diffMs / hourMs));
        return `${hours} jam yang lalu`;
    }
    if (diffMs < weekMs) {
        const days = Math.max(1, Math.floor(diffMs / dayMs));
        return `${days} hari yang lalu`;
    }
    if (diffMs < monthMs) {
        const weeks = Math.max(1, Math.floor(diffMs / weekMs));
        return `${weeks} minggu yang lalu`;
    }
    if (diffMs < yearMs) {
        const months = Math.max(1, Math.floor(diffMs / monthMs));
        return `${months} bulan yang lalu`;
    }

    const years = Math.max(1, Math.floor(diffMs / yearMs));
    return `${years} tahun yang lalu`;
}

function normalizeAttendanceLabel(value) {
    const text = normalizeText(value);
    if (!text) return "Hadir";
    if (/tidak/i.test(text) || /absen/i.test(text)) return "Tidak Hadir";
    if (/ragu/i.test(text)) return "Masih Ragu";
    if (/hadir|datang/i.test(text)) return "Hadir";
    return text;
}

function extractInitialWishes(data) {
    const candidates = [
        data?.wishes,
        data?.wishes?.initial,
        data?.wishes?.data,
        data?.wishes?.items,
        data?.comments,
        data?.comments?.data,
        data?.comments?.items,
        data?.guestbook,
        data?.guestbook?.data,
        data?.guestbook?.items,
        data?.rsvp?.wishes,
        data?.features?.wishes,
        data?.invitation?.wishes,
        data?.invitation?.comments,
        data?.invitation?.guestbook,
        data?.data?.wishes,
        data?.data?.comments,
        data?.data?.guestbook,
        data?.order?.wishes,
        data?.order?.comments,
    ];
    const firstArray = candidates.find((item) => Array.isArray(item));
    const raw = firstArray ?? (Array.isArray(defaultSchema.wishes) ? defaultSchema.wishes : defaultSchema.wishes?.initial || []);
    if (!Array.isArray(raw)) return [];

    return raw
        .map((item) => {
            const author = normalizeText(item?.author || item?.name || item?.guest || item?.guestName || item?.from || "");
            const comment = normalizeText(item?.comment || item?.message || item?.text || item?.wish || item?.content || "");
            if (!author || !comment) return null;

            return {
                author,
                comment,
                attendance: normalizeAttendanceLabel(
                    item?.attendance || item?.status || item?.confirmation || item?.konfirmasi || item?.attendStatus || ""
                ),
                createdAt: normalizeText(
                    item?.createdAt || item?.created_at || item?.timestamp || item?.date || item?.time || "Baru saja"
                ),
            };
        })
        .filter(Boolean);
}

function resolveAssetUrl(path) {
    if (!path || typeof path !== "string") return path;
    if (Object.prototype.hasOwnProperty.call(REMOTE_ASSET_MAP, path)) {
        const mapped = REMOTE_ASSET_MAP[path];
        if (mapped === SKIP_ASSET) return SKIP_ASSET;
        return resolveAssetUrl(mapped);
    }
    if (/^(https?:|data:|blob:|#)/i.test(path)) return path;

    const sanitized = path.replace(/\\\//g, "/").replace(/^\s+|\s+$/g, "");

    if (sanitized.startsWith("/assets/")) {
        if (!/^\/assets\/(images|audio|fonts|js|css)\//i.test(sanitized) && sanitized !== "/assets/bird-hitam-1-1-1.json") {
            return sanitized;
        }
        return `${PUBLIC_ASSET_PREFIX}${sanitized.slice("/assets/".length)}`;
    }

    if (sanitized.startsWith("assets/")) {
        return `${PUBLIC_ASSET_PREFIX}${sanitized.slice("assets/".length)}`;
    }

    return sanitized;
}

function rewriteSrcsetValue(srcset) {
    if (!srcset || typeof srcset !== "string") return srcset;

    return srcset
        .split(",")
        .map((item) => {
            const trimmed = item.trim();
            if (!trimmed) return trimmed;
            const [url, ...rest] = trimmed.split(/\s+/);
            const nextUrl = resolveAssetUrl(url);
            return rest.length ? `${nextUrl} ${rest.join(" ")}` : nextUrl;
        })
        .join(", ");
}

function rewriteInlineStyleValue(styleValue) {
    if (!styleValue) return styleValue;

    return styleValue.replace(/url\((['"]?)(\/??assets\/[^'")]+)\1\)/g, (_, quote, assetPath) => {
        const safeQuote = quote || '"';
        const next = resolveAssetUrl(assetPath);
        return `url(${safeQuote}${next}${safeQuote})`;
    });
}

function normalizeGalleryItem(item) {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item === "object") {
        return item.photo || item.url || item.image || item.src || "";
    }
    return "";
}

function buildGalleryUrls(galleryInput, total = 0) {
    const dynamicUrls = (Array.isArray(galleryInput) ? galleryInput : [])
        .map((item) => normalizeGalleryItem(item))
        .filter((item) => normalizeText(item))
        .map((item) => resolveAssetUrl(item))
        .filter((item) => item && item !== SKIP_ASSET);

    const fallbackUrls = FINAL_FALLBACK_GALLERY
        .map((item) => resolveAssetUrl(item))
        .filter((item) => item && item !== SKIP_ASSET);

    const source = dynamicUrls.length > 0 ? dynamicUrls : fallbackUrls;
    if (source.length === 0) return [];
    if (total > 0) return source.slice(0, total);
    return source;
}

function toFiniteNumber(value, fallback = 0) {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
}

function resolveResponsiveSetting(settings, baseKey, fallbackValue) {
    const viewportWidth = window.innerWidth || 0;
    const keyByViewport =
        viewportWidth <= 767 ? `${baseKey}_mobile` : viewportWidth <= 1024 ? `${baseKey}_tablet` : baseKey;

    const readValue = (raw) => {
        if (raw == null) return null;
        if (typeof raw === "number") return raw;
        if (typeof raw === "object" && raw !== null && "size" in raw) return toFiniteNumber(raw.size, null);
        return toFiniteNumber(raw, null);
    };

    const directValue = readValue(settings?.[keyByViewport]);
    if (directValue != null) return directValue;

    const baseValue = readValue(settings?.[baseKey]);
    if (baseValue != null) return baseValue;

    return fallbackValue;
}

function applyJustifiedGalleryLayout(widget) {
    if (!widget) return;
    const container = widget.querySelector(".elementor-gallery__container");
    if (!container) return;

    const items = Array.from(container.querySelectorAll(".e-gallery-item")).filter((item) => {
        if (item.getAttribute("aria-hidden") === "true") return false;
        return window.getComputedStyle(item).display !== "none";
    });
    if (items.length === 0) {
        container.style.removeProperty("height");
        container.style.removeProperty("padding-bottom");
        container.style.setProperty("--container-aspect-ratio", "0");
        return;
    }

    let settings = {};
    try {
        settings = JSON.parse(widget.getAttribute("data-settings") || "{}");
    } catch {
        settings = {};
    }

    const horizontalGap = resolveResponsiveSetting(settings, "gap", 10);
    const verticalGap = resolveResponsiveSetting(settings, "gap", 10);
    const idealRowHeight = Math.max(1, resolveResponsiveSetting(settings, "ideal_row_height", 250));
    const lastRowSetting = String(settings?.last_row || "auto").toLowerCase();

    container.classList.add("e-gallery-container", "e-gallery-justified", "e-gallery--ltr");
    container.style.setProperty("--hgap", `${horizontalGap}px`);
    container.style.setProperty("--vgap", `${verticalGap}px`);
    container.style.setProperty("--animation-duration", "350ms");

    const containerWidth = toFiniteNumber(container.clientWidth || widget.clientWidth || 0, 0);
    if (containerWidth <= 0) return;

    const imageData = items.map((item) => {
        const imageNode = item.querySelector(".e-gallery-image");
        const width = Math.max(1, toFiniteNumber(imageNode?.getAttribute("data-width"), 1024));
        const height = Math.max(1, toFiniteNumber(imageNode?.getAttribute("data-height"), 1536));
        return {
            width,
            height,
            ratio: width / height,
            computedWidth: 0,
        };
    });

    const rowMeta = [];
    let cursor = 0;

    while (cursor < imageData.length) {
        let rowWidth = 0;
        let endIndex = cursor;

        while (endIndex < imageData.length) {
            const item = imageData[endIndex];
            let scaledWidth = Math.round(idealRowHeight * item.ratio);
            if (scaledWidth > containerWidth) scaledWidth = containerWidth;
            item.computedWidth = scaledWidth;

            const nextWidth = rowWidth + scaledWidth;
            const overflowed = nextWidth > containerWidth;
            const isLastItem = endIndex === imageData.length - 1;

            if (overflowed) {
                const shouldFitCurrent = containerWidth - rowWidth >= nextWidth - containerWidth;
                if (shouldFitCurrent || endIndex === cursor) {
                    rowWidth = nextWidth;
                    endIndex += 1;
                }
                break;
            }

            rowWidth = nextWidth;
            endIndex += 1;
            if (isLastItem) break;
        }

        if (endIndex <= cursor) endIndex = cursor + 1;

        const isLastRow = endIndex >= imageData.length;
        let rowTargetWidth = rowWidth;
        if (isLastRow) {
            if (lastRowSetting === "hide") {
                break;
            }
            const fillThreshold = rowWidth / containerWidth >= 0.7;
            rowTargetWidth = lastRowSetting === "fit" || fillThreshold ? rowWidth : containerWidth;
        }

        const start = cursor;
        const end = Math.min(endIndex, imageData.length);
        const gapCount = Math.max(0, end - start - 1);

        let itemStart = 0;
        let rowHeight = 0;
        for (let index = start; index < end; index += 1) {
            const data = imageData[index];
            const item = items[index];
            const ratioInRow = data.computedWidth / Math.max(1, rowTargetWidth);
            item.style.setProperty("--item-width", String(ratioInRow));
            item.style.setProperty("--gap-count", String(gapCount));
            item.style.setProperty("--item-start", String(itemStart));
            item.style.setProperty("--item-row-index", String(index - start));
            itemStart += ratioInRow;

            if (index === start) {
                const firstRowWidth = ratioInRow * (containerWidth - gapCount * horizontalGap);
                rowHeight = firstRowWidth / data.ratio;
            }
        }

        rowMeta.push({
            start,
            end,
            height: rowHeight,
        });

        cursor = end;
    }

    if (rowMeta.length === 0) {
        container.style.removeProperty("height");
        container.style.removeProperty("padding-bottom");
        container.style.setProperty("--container-aspect-ratio", "0");
        return;
    }

    const totalHeight = rowMeta.reduce((sum, row) => sum + row.height, 0) + Math.max(0, rowMeta.length - 1) * verticalGap;
    const containerRatio = totalHeight / containerWidth;
    container.style.setProperty("--container-aspect-ratio", String(containerRatio));
    container.style.removeProperty("padding-bottom");
    container.style.setProperty("height", `${Math.ceil(totalHeight)}px`);

    const rowHeightsPercent = rowMeta.map((row) => (row.height / totalHeight) * 100);
    let topOffset = 0;

    rowMeta.forEach((row, rowIndex) => {
        const rowTopPercent = topOffset;
        const rowHeightPercent = rowHeightsPercent[rowIndex] || 0;

        for (let index = row.start; index < row.end; index += 1) {
            const item = items[index];
            item.style.setProperty("--item-top", `${rowTopPercent}%`);
            item.style.setProperty("--item-height", `${rowHeightPercent}%`);
            item.style.setProperty("--row", String(rowIndex));
        }

        topOffset += rowHeightPercent;
    });
}

function parseSourceArtifacts(rawHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    const styleSequence = [];
    doc.querySelectorAll("style, link[rel~='stylesheet']").forEach((node) => {
        if (node.tagName.toLowerCase() === "style") {
            styleSequence.push({ type: "style", css: node.textContent || "" });
            return;
        }

        styleSequence.push({
            type: "link",
            href: node.getAttribute("href") || "",
        });
    });

    const bodyClone = doc.body.cloneNode(true);
    bodyClone.querySelectorAll("script, meta").forEach((node) => node.remove());

    return {
        styleSequence,
        markup: bodyClone.innerHTML,
    };
}

function buildTemplateMarkup(rawMarkup, invitationData) {
    if (!rawMarkup) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${rawMarkup}</body>`, "text/html");
    const features = invitationData?.features || {};

    if (features.livestreamEnabled === false) {
        doc.querySelector(".elementor-element-7229000a")?.remove();
    }

    return doc.body.innerHTML;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function toInstagramUrl(handle) {
    if (!handle) return "https://www.instagram.com/";
    return `https://www.instagram.com/${String(handle).replace(/^@/, "")}`;
}

function formatCompactDate(dateISO) {
    const date = new Date(dateISO || "");
    if (!Number.isFinite(date.getTime())) return "01 . 01 . 2024";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${dd} . ${mm} . ${yyyy}`;
}

function formatCountdownDateAttr(dateISO) {
    const date = new Date(dateISO || "");
    if (!Number.isFinite(date.getTime())) return "May 01 2026 10:00:00";

    return `${MONTHS_SHORT[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")} ${date.getFullYear()} ${String(
        date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function formatCountdown(targetISO) {
    const target = new Date(targetISO || "").getTime();
    if (!Number.isFinite(target)) {
        return { days: "00", hours: "00", minutes: "00", seconds: "00" };
    }

    const diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
    };
}

function updateCountdownNode(root, targetISO) {
    const node = root.querySelector("#wpkoi-elements-countdown-32d1474") || root.querySelector(".wpkoi-elements-countdown-items");
    if (!node) return;

    const value = formatCountdown(targetISO);
    const daysNode = node.querySelector("[data-days]");
    const hoursNode = node.querySelector("[data-hours]");
    const minutesNode = node.querySelector("[data-minutes]");
    const secondsNode = node.querySelector("[data-seconds]");

    if (daysNode) daysNode.textContent = value.days;
    if (hoursNode) hoursNode.textContent = value.hours;
    if (minutesNode) minutesNode.textContent = value.minutes;
    if (secondsNode) secondsNode.textContent = value.seconds;
}

function slideToggle(element, duration = 500) {
    if (!element) return;

    const hidden = window.getComputedStyle(element).display === "none";
    if (hidden) {
        element.style.removeProperty("display");
        let display = window.getComputedStyle(element).display;
        if (display === "none") display = "block";

        element.style.display = display;
        const targetHeight = element.scrollHeight;

        element.style.height = "0px";
        element.style.overflow = "hidden";
        element.style.transition = `height ${duration}ms ease`;

        requestAnimationFrame(() => {
            element.style.height = `${targetHeight}px`;
        });

        window.setTimeout(() => {
            element.style.removeProperty("height");
            element.style.removeProperty("overflow");
            element.style.removeProperty("transition");
        }, duration + 50);
        return;
    }

    const startHeight = element.scrollHeight;
    element.style.height = `${startHeight}px`;
    element.style.overflow = "hidden";
    element.style.transition = `height ${duration}ms ease`;

    requestAnimationFrame(() => {
        element.style.height = "0px";
    });

    window.setTimeout(() => {
        element.style.display = "none";
        element.style.removeProperty("height");
        element.style.removeProperty("overflow");
        element.style.removeProperty("transition");
    }, duration + 50);
}

function formatAccount(account) {
    const raw = String(account || "").replace(/\s+/g, "");
    if (!raw) return "-";
    return raw.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function buildRuntimeInvitationData(incomingData, baseSchema) {
    if (!incomingData || typeof incomingData !== "object") return {};
    const orderPayload = incomingData.order?.payload || incomingData.payload || incomingData.data?.payload || incomingData.orderPayload || {};

    const hasRawPayload = Boolean(
        incomingData.groom ||
        incomingData.bride ||
        incomingData.akad ||
        incomingData.resepsi ||
        incomingData.frontCoverImage ||
        incomingData.coverImage ||
        incomingData.closingBackgroundImage ||
        Array.isArray(incomingData.stories) ||
        Array.isArray(incomingData.galleryImages) ||
        Array.isArray(incomingData.gallery) ||
        orderPayload.groom ||
        orderPayload.bride ||
        orderPayload.akad ||
        orderPayload.resepsi ||
        orderPayload.frontCoverImage ||
        orderPayload.coverImage ||
        orderPayload.closingBackgroundImage ||
        Array.isArray(orderPayload.stories) ||
        Array.isArray(orderPayload.galleryImages) ||
        Array.isArray(orderPayload.gallery)
    );
    if (!hasRawPayload) return {};

    const groom = orderPayload.groom || incomingData.groom || {};
    const bride = orderPayload.bride || incomingData.bride || {};
    const akad = orderPayload.akad || incomingData.akad || {};
    const resepsi = orderPayload.resepsi || incomingData.resepsi || {};
    const rawGift = orderPayload.gift || incomingData.gift || {};
    const rawGiftBankList = Array.isArray(rawGift.bankList)
        ? rawGift.bankList.filter((item) => item?.bank || item?.account || item?.name)
        : [];
    const rawGiftShipping = rawGift.shipping || {};
    const capabilities = orderPayload.selectedPackage?.capabilities || incomingData.selectedPackage?.capabilities || {};
    const hasGiftData =
        rawGiftBankList.length > 0 ||
        Boolean(rawGiftShipping.recipient || rawGiftShipping.phone || rawGiftShipping.address);
    const liveStoriesSource = [
        orderPayload.stories,
        orderPayload.loveStory,
        incomingData.stories,
        incomingData.data?.stories,
        orderPayload.lovestory,
        incomingData.loveStory,
        incomingData.lovestory,
        incomingData.data?.lovestory,
    ].find((items) => Array.isArray(items) && items.length > 0);
    const liveStories = Array.isArray(liveStoriesSource)
        ? liveStoriesSource.map((item) => normalizeLoveStoryItem(item)).filter(Boolean)
        : [];
    const liveGallerySource = [
        orderPayload.galleryImages,
        incomingData.galleryImages,
        orderPayload.gallery,
        incomingData.gallery,
        incomingData.data?.galleryImages,
        incomingData.data?.gallery,
    ].find((items) => Array.isArray(items) && items.length > 0);
    const liveGallery = Array.isArray(liveGallerySource)
        ? liveGallerySource.map((item) => normalizeGalleryItem(item)).filter(Boolean)
        : [];
    const liveMusic = orderPayload.music || incomingData.music || {};
    const runtimeInvitationSlug = pickText(
        incomingData.invitation?.slug,
        incomingData.invitationSlug,
        incomingData.invitation_slug,
        incomingData.slug,
        baseSchema.invitation?.slug
    );
    const runtimeOrderId = pickText(
        incomingData.invitation?.orderId,
        incomingData.invitation?.id,
        incomingData.orderId,
        incomingData.order_id,
        incomingData.order?.orderId,
        incomingData.order?.id,
        baseSchema.invitation?.orderId
    );

    return {
        invitation: {
            slug: runtimeInvitationSlug,
            orderId: runtimeOrderId,
        },
        orderId: runtimeOrderId,
        guest: {
            ...baseSchema.guest,
            ...(orderPayload.guest || incomingData.guest || {}),
        },
        couple: {
            groom: {
                nameFull: pickText(groom.fullname, groom.nameFull, baseSchema.couple.groom.nameFull),
                nickName: pickText(groom.nickname, groom.nickName, groom.fullname?.split(" ")[0], baseSchema.couple.groom.nickName),
                instagram: pickText(groom.instagram, baseSchema.couple.groom.instagram),
                photo: pickAsset(groom.photo, baseSchema.couple.groom.photo),
                parentInfo: pickText(groom.parents, groom.parentInfo, baseSchema.couple.groom.parentInfo),
            },
            bride: {
                nameFull: pickText(bride.fullname, bride.nameFull, baseSchema.couple.bride.nameFull),
                nickName: pickText(bride.nickname, bride.nickName, bride.fullname?.split(" ")[0], baseSchema.couple.bride.nickName),
                instagram: pickText(bride.instagram, baseSchema.couple.bride.instagram),
                photo: pickAsset(bride.photo, baseSchema.couple.bride.photo),
                parentInfo: pickText(bride.parents, bride.parentInfo, baseSchema.couple.bride.parentInfo),
            },
            frontCoverPhoto: pickAsset(
                orderPayload.frontCoverImage,
                incomingData.frontCoverImage,
                orderPayload.couple?.frontCoverPhoto,
                incomingData.couple?.frontCoverPhoto,
                baseSchema.couple.frontCoverPhoto,
                baseSchema.couple.heroPhoto
            ),
            heroPhoto: pickAsset(
                orderPayload.coverImage,
                incomingData.coverImage,
                orderPayload.couple?.heroPhoto,
                incomingData.couple?.heroPhoto,
                baseSchema.couple.heroPhoto
            ),
        },
        event: {
            dateISO: buildLiveDateISO(akad.date, akad.startTime, baseSchema.event.dateISO),
            akad: {
                date: pickText(formatDateID(akad.date), akad.date, baseSchema.event.akad.date),
                time: pickText(akad.time, formatTimeRange(akad.startTime, akad.endTime), baseSchema.event.akad.time),
                venueName: pickText(akad.venue, akad.venueName, baseSchema.event.akad.venueName),
                address: pickText(akad.address, baseSchema.event.akad.address),
                mapsUrl: pickText(akad.mapsLink, akad.mapsUrl, baseSchema.event.akad.mapsUrl),
                coverPhoto: pickAsset(akad.coverImage, akad.coverPhoto, baseSchema.event.akad.coverPhoto),
            },
            resepsi: {
                date: pickText(formatDateID(resepsi.date), resepsi.date, baseSchema.event.resepsi.date),
                time: pickText(resepsi.time, formatTimeRange(resepsi.startTime, resepsi.endTime), baseSchema.event.resepsi.time),
                venueName: pickText(resepsi.venue, resepsi.venueName, baseSchema.event.resepsi.venueName),
                address: pickText(resepsi.address, baseSchema.event.resepsi.address),
                mapsUrl: pickText(resepsi.mapsLink, resepsi.mapsUrl, baseSchema.event.resepsi.mapsUrl),
                coverPhoto: pickAsset(resepsi.coverImage, resepsi.coverPhoto, akad.coverImage, baseSchema.event.resepsi.coverPhoto),
            },
            livestream: {
                ...baseSchema.event.livestream,
                ...(incomingData.event?.livestream || {}),
            },
        },
        copy: {
            quote: pickText(orderPayload.quote, incomingData.quote, incomingData.copy?.quote, baseSchema.copy.quote),
            quoteSource: pickText(orderPayload.quoteSource, incomingData.quoteSource, baseSchema.copy.quoteSource),
            giftTitle: pickText(orderPayload.copy?.giftTitle, incomingData.copy?.giftTitle, baseSchema.copy.giftTitle),
            giftIntro: pickText(orderPayload.copy?.giftIntro, incomingData.copy?.giftIntro, baseSchema.copy.giftIntro),
            openingGreeting: pickText(orderPayload.copy?.openingGreeting, incomingData.copy?.openingGreeting, baseSchema.copy.openingGreeting),
            openingText: pickText(orderPayload.copy?.openingText, incomingData.copy?.openingText, baseSchema.copy.openingText),
            closingText: pickText(orderPayload.copy?.closingText, incomingData.copy?.closingText, baseSchema.copy.closingText),
            closingLabel: pickText(orderPayload.copy?.closingLabel, incomingData.copy?.closingLabel, baseSchema.copy.closingLabel),
            closingBackgroundPhoto: pickAsset(
                orderPayload.closingBackgroundImage,
                incomingData.closingBackgroundImage,
                orderPayload.copy?.closingBackgroundPhoto,
                incomingData.copy?.closingBackgroundPhoto,
                baseSchema.copy.closingBackgroundPhoto
            ),
        },
        lovestory: liveStories.length > 0 ? liveStories : baseSchema.lovestory,
        gallery: liveGallery.length > 0 ? liveGallery : baseSchema.gallery,
        gift: {
            bankList: hasGiftData ? rawGiftBankList : [],
            shipping: hasGiftData ? rawGiftShipping : {},
        },
        features: {
            countdownEnabled: capabilities.countdown ?? capabilities.saveTheDate ?? baseSchema.features.countdownEnabled,
            saveTheDateEnabled: capabilities.saveTheDate ?? baseSchema.features.saveTheDateEnabled,
            digitalEnvelopeEnabled: capabilities.digitalEnvelope ?? hasGiftData,
            rsvpEnabled: capabilities.rsvp ?? baseSchema.features.rsvpEnabled,
            livestreamEnabled: false,
            digitalEnvelopeInfo: {
                bankList: hasGiftData ? rawGiftBankList : [],
                shipping: hasGiftData ? rawGiftShipping : {},
            },
        },
        audio: {
            src: pickAsset(
                incomingData.audio?.src,
                liveMusic?.file?.url,
                liveMusic?.file?.src,
                liveMusic?.file?.dataUrl,
                liveMusic?.previewUrl,
                baseSchema.audio?.src,
                FALLBACKS.backgroundAudio
            ),
        },
    };
}

function mergeInvitationData(baseSchema, incomingData) {
    if (!incomingData) return baseSchema;

    const runtimeData = buildRuntimeInvitationData(incomingData, baseSchema);

    return {
        ...baseSchema,
        ...incomingData,
        ...runtimeData,
        orderId: runtimeData.orderId || incomingData.orderId || incomingData.order_id || incomingData.order?.orderId || baseSchema.orderId,
        invitation: {
            ...(baseSchema.invitation || {}),
            ...(incomingData.invitation || {}),
            ...(runtimeData.invitation || {}),
        },
        guest: { ...baseSchema.guest, ...(incomingData.guest || {}), ...(runtimeData.guest || {}) },
        couple: {
            ...baseSchema.couple,
            ...(incomingData.couple || {}),
            ...(runtimeData.couple || {}),
            groom: {
                ...baseSchema.couple.groom,
                ...(incomingData.couple?.groom || {}),
                ...(runtimeData.couple?.groom || {}),
            },
            bride: {
                ...baseSchema.couple.bride,
                ...(incomingData.couple?.bride || {}),
                ...(runtimeData.couple?.bride || {}),
            },
        },
        event: {
            ...baseSchema.event,
            ...(incomingData.event || {}),
            ...(runtimeData.event || {}),
            akad: { ...baseSchema.event.akad, ...(incomingData.event?.akad || {}), ...(runtimeData.event?.akad || {}) },
            resepsi: { ...baseSchema.event.resepsi, ...(incomingData.event?.resepsi || {}), ...(runtimeData.event?.resepsi || {}) },
            livestream: { ...baseSchema.event.livestream, ...(incomingData.event?.livestream || {}), ...(runtimeData.event?.livestream || {}) },
        },
        copy: {
            ...baseSchema.copy,
            ...(incomingData.copy || {}),
            ...(runtimeData.copy || {}),
        },
        features: {
            ...baseSchema.features,
            ...(incomingData.features || {}),
            ...(runtimeData.features || {}),
            digitalEnvelopeInfo: {
                ...baseSchema.features.digitalEnvelopeInfo,
                ...(incomingData.features?.digitalEnvelopeInfo || {}),
                ...(runtimeData.features?.digitalEnvelopeInfo || {}),
            },
        },
        gift: {
            ...(baseSchema.gift || {}),
            ...(incomingData.gift || {}),
            ...(runtimeData.gift || {}),
            shipping: {
                ...(baseSchema.gift?.shipping || {}),
                ...(incomingData.gift?.shipping || {}),
                ...(runtimeData.gift?.shipping || {}),
            },
        },
        audio: {
            ...(baseSchema.audio || {}),
            ...(incomingData.audio || {}),
            ...(runtimeData.audio || {}),
        },
        lovestory: Array.isArray(runtimeData.lovestory) && runtimeData.lovestory.length > 0
            ? runtimeData.lovestory
            : Array.isArray(incomingData.lovestory)
                ? incomingData.lovestory
                : baseSchema.lovestory,
        gallery: Array.isArray(runtimeData.gallery) && runtimeData.gallery.length > 0
            ? runtimeData.gallery
            : Array.isArray(incomingData.gallery)
                ? incomingData.gallery
                : baseSchema.gallery,
    };
}

function ensureLottieLibrary() {
    if (window.lottie && typeof window.lottie.loadAnimation === "function") {
        return Promise.resolve(window.lottie);
    }

    if (lottieLibraryPromise) {
        return lottieLibraryPromise;
    }

    lottieLibraryPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector("script[data-misty-lottie='1']");
        if (existing) {
            existing.addEventListener("load", () => resolve(window.lottie), { once: true });
            existing.addEventListener("error", () => reject(new Error("Failed to load lottie library")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.setAttribute("data-misty-lottie", "1");
        script.src = resolveAssetUrl("assets/js/vendor/elementor-pro/lib/lottie/lottie.min.js");
        script.async = true;
        script.onload = () => resolve(window.lottie);
        script.onerror = () => reject(new Error("Failed to load lottie library"));
        document.body.appendChild(script);
    });

    return lottieLibraryPromise;
}

function applyInvitationData(root, invitationData) {
    const guest = invitationData?.guest || {};
    const couple = invitationData?.couple || {};
    const groom = couple?.groom || {};
    const bride = couple?.bride || {};
    const event = invitationData?.event || {};
    const copy = invitationData?.copy || {};
    const features = invitationData?.features || {};
    const gift = invitationData?.gift || {};
    const digitalEnvelopeInfo = features?.digitalEnvelopeInfo || {};
    const groomDisplayName = pickText(groom.nickName, groom.nameFull, defaultSchema.couple.groom.nickName);
    const brideDisplayName = pickText(bride.nickName, bride.nameFull, defaultSchema.couple.bride.nickName);
    const coupleNames = `${groomDisplayName || "Mempelai Pria"} & ${brideDisplayName || "Mempelai Wanita"}`;

    const setText = (selector, value) => {
        const node = root.querySelector(selector);
        if (!node || value == null) return;
        node.textContent = String(value);
    };

    const setHtml = (selector, html) => {
        const node = root.querySelector(selector);
        if (!node || html == null) return;
        node.innerHTML = html;
    };

    const setLink = (selector, href) => {
        const node = root.querySelector(selector);
        if (!node || !href) return;
        node.setAttribute("href", href);
    };

    const setImage = (selector, src, alt = "") => {
        const node = root.querySelector(selector);
        if (!node || !src) return;
        node.setAttribute("src", resolveAssetUrl(src));
        node.setAttribute("alt", alt);
        node.removeAttribute("srcset");
        node.removeAttribute("sizes");
    };

    const frontCoverPhoto = resolveAssetUrl(
        resolveSectionPhoto(
            pickAsset(couple.frontCoverPhoto, couple.heroPhoto),
            defaultSchema.couple.frontCoverPhoto || defaultSchema.couple.heroPhoto || FALLBACKS.heroPhoto
        )
    );
    const heroPhoto = resolveAssetUrl(resolveSectionPhoto(couple.heroPhoto, defaultSchema.couple.heroPhoto || FALLBACKS.heroPhoto));
    const groomPhoto = resolveAssetUrl(
        resolveSectionPhoto(groom.photo, defaultSchema.couple.groom.photo || FALLBACKS.groomPhoto, {
            rejectSameAs: [couple.heroPhoto, couple.frontCoverPhoto],
        })
    );
    const bridePhoto = resolveAssetUrl(
        resolveSectionPhoto(bride.photo, defaultSchema.couple.bride.photo || FALLBACKS.bridePhoto, {
            rejectSameAs: [couple.heroPhoto, couple.frontCoverPhoto],
        })
    );
    const closingThumbnailPhoto = resolveSectionPhoto(
        copy.closingBackgroundPhoto,
        defaultSchema.couple.heroPhoto || FALLBACKS.heroPhoto,
        {
            rejectSameAs: [
                defaultSchema.copy.closingBackgroundPhoto,
                FALLBACKS.closingBackground,
            ],
        }
    );

    setText(".elementor-element-baf17c3 .elementor-heading-title", copy.openingGreeting || defaultSchema.copy.openingGreeting || "The Wedding Of");
    setText(".elementor-element-6992be1d .elementor-heading-title", defaultSchema.copy.openingGreeting || "The Wedding Of");

    setText(".elementor-element-3c39178 .elementor-heading-title", coupleNames);
    setText(".elementor-element-39cd1298 .elementor-heading-title", coupleNames);
    setText(".elementor-element-63cd0286 .elementor-heading-title", coupleNames);

    setHtml(".elementor-element-44b08d83 .elementor-widget-container", `<p>${escapeHtml(guest.greetingLabel || "Kepada Yth,")}</p>`);
    setText(".elementor-element-4adfa30d .elementor-widget-container", guest.name || "Nama Tamu");
    setHtml(".elementor-element-7980ad32 .elementor-widget-container", `<p>${escapeHtml(formatCompactDate(event.dateISO))}</p>`);

    setHtml(".elementor-element-af3859d .elementor-widget-container", `<p>${escapeHtml(copy.quote || defaultSchema.copy.quote)}</p>`);
    setHtml(".elementor-element-27921e34 .elementor-widget-container", `<p><strong>${escapeHtml(copy.quoteSource || defaultSchema.copy.quoteSource)}</strong></p>`);
    setHtml(".elementor-element-3f0f405f .elementor-widget-container", `<p>${escapeHtml(copy.openingText || defaultSchema.copy.openingText)}</p>`);

    setText(".elementor-element-141d17c5 .elementor-heading-title", groom.nameFull || defaultSchema.couple.groom.nameFull);
    setHtml(".elementor-element-57873783 .elementor-widget-container", `<p>${escapeHtml(groom.parentInfo || defaultSchema.couple.groom.parentInfo)}</p>`);

    setText(".elementor-element-3820e5c0 .elementor-heading-title", bride.nameFull || defaultSchema.couple.bride.nameFull);
    setHtml(".elementor-element-3ec0cf31 .elementor-widget-container", `<p>${escapeHtml(bride.parentInfo || defaultSchema.couple.bride.parentInfo)}</p>`);

    setLink(".elementor-element-44e2339d a", toInstagramUrl(groom.instagram));
    setLink(".elementor-element-7604b9ef a", toInstagramUrl(bride.instagram));

    setText(".elementor-element-37549bd4 .elementor-heading-title", event.akad?.date || defaultSchema.event.akad.date);
    setText(
        ".elementor-element-7dbd32cd .elementor-heading-title",
        `Pukul : ${event.akad?.time || defaultSchema.event.akad.time}`
    );
    setHtml(
        ".elementor-element-6ee50e57 .elementor-widget-container",
        formatLocationMarkup(event.akad, defaultSchema.event.akad)
    );
    setLink(".elementor-element-78af535d a", event.akad?.mapsUrl || defaultSchema.event.akad.mapsUrl);

    setText(".elementor-element-33751c04 .elementor-heading-title", event.resepsi?.date || defaultSchema.event.resepsi.date);
    setText(
        ".elementor-element-5985d32a .elementor-heading-title",
        `Pukul : ${event.resepsi?.time || defaultSchema.event.resepsi.time}`
    );
    setHtml(
        ".elementor-element-74d5e6e8 .elementor-widget-container",
        formatLocationMarkup(event.resepsi, defaultSchema.event.resepsi)
    );
    setLink(".elementor-element-17e003ad a", event.resepsi?.mapsUrl || defaultSchema.event.resepsi.mapsUrl);

    const liveDate = event.livestream?.date || defaultSchema.event.livestream.date;
    const liveTime = event.livestream?.time || defaultSchema.event.livestream.time;
    setText(".elementor-element-59d645ef .elementor-heading-title", liveDate);
    setText(".elementor-element-61516101 .elementor-heading-title", `Pukul : ${liveTime}`);
    setLink(".elementor-element-86fc076 a", event.livestream?.url || defaultSchema.event.livestream.url);

    const stories = Array.isArray(invitationData?.lovestory) && invitationData.lovestory.length > 0
        ? invitationData.lovestory.map((item) => normalizeLoveStoryItem(item)).filter(Boolean)
        : defaultSchema.lovestory.map((item) => normalizeLoveStoryItem(item)).filter(Boolean);
    const storySelectors = [
        [".elementor-element-6fc29ce0 .elementor-widget-container", ".elementor-element-2405a23a .elementor-widget-container"],
        [".elementor-element-5fcbcdb2 .elementor-widget-container", ".elementor-element-7a6af8d5 .elementor-widget-container"],
        [".elementor-element-46830ca3 .elementor-widget-container", ".elementor-element-3078cddc .elementor-widget-container"],
    ];
    const storyImageWrappers = [
        ".elementor-element-611e824a",
        ".elementor-element-61875e89",
    ];

    storySelectors.forEach(([dateSelector, textSelector], index) => {
        const item = stories[index] || null;
        const dateElement = root.querySelector(dateSelector)?.closest(".elementor-element");
        const textElement = root.querySelector(textSelector)?.closest(".elementor-element");

        if (!item) {
            if (dateElement) dateElement.style.display = "none";
            if (textElement) textElement.style.display = "none";
            return;
        }

        if (dateElement) dateElement.style.display = "";
        if (textElement) textElement.style.display = "";
        setHtml(dateSelector, `<p>${escapeHtml(item.date || "-")}</p>`);
        setHtml(textSelector, `<p>${escapeHtml(item.text || "-")}</p>`);
    });

    storyImageWrappers.forEach((selector, index) => {
        const wrapper = root.querySelector(selector);
        if (!wrapper) return;
        wrapper.style.display = stories[index] ? "" : "none";
    });
    setBackgroundImage(root, ".elementor-element-733088fb", stories[0]?.photo || "", { position: "center center" });
    setBackgroundImage(root, ".elementor-element-46c78335", stories[1]?.photo || "", { position: "center center" });

    const anchors = Array.from(root.querySelectorAll(".elementor-element-118bde3a .e-gallery-item"));
    const galleryUrls = buildGalleryUrls(invitationData?.gallery, anchors.length);
    anchors.forEach((anchor, index) => {
        const url = galleryUrls[index] || "";
        if (!url) {
            anchor.style.display = "none";
            anchor.setAttribute("aria-hidden", "true");
            return;
        }

        anchor.style.display = "";
        anchor.removeAttribute("aria-hidden");
        anchor.setAttribute("href", url);
        anchor.setAttribute("data-misty-gallery-index", String(index));

        const imageNode = anchor.querySelector(".e-gallery-image");
        if (imageNode) {
            imageNode.setAttribute("data-thumbnail", url);
            imageNode.classList.add("e-gallery-image-loaded");
            imageNode.style.setProperty("background-image", `url("${url}")`, "important");
            imageNode.style.setProperty("background-size", "cover", "important");
            imageNode.style.setProperty("background-position", "center center", "important");
            imageNode.style.setProperty("background-repeat", "no-repeat", "important");
        }
    });

    const rawBankList = features?.digitalEnvelopeEnabled
        ? (gift?.bankList || digitalEnvelopeInfo?.bankList || defaultSchema.gift?.bankList || defaultSchema.features.digitalEnvelopeInfo.bankList || [])
        : [];
    const bankList = rawBankList.map((item) => normalizeBankAccount(item)).filter((item) => item.bank || item.account || item.name);
    const bankA = bankList[0] || normalizeBankAccount(defaultSchema.gift?.bankList?.[0] || { bank: "BCA", account: "1234567890", name: groom.nickName || "Mempelai" });
    const bankB = bankList[1] || bankA;

    setText(".elementor-element-cd714b5 .elementor-heading-title", copy.giftTitle || defaultSchema.copy.giftTitle || "Wedding Gift");
    setHtml(
        ".elementor-element-31b44f00 .elementor-widget-container",
        `<p>${escapeHtml(copy.giftIntro || defaultSchema.copy.giftIntro || "")}</p>`
    );

    setText(".elementor-element-18c43aa0 .elementor-heading-title", formatAccount(bankA.account));
    setText(".elementor-element-6bcd8060 .elementor-heading-title", bankA.name || groom.nickName || "Mempelai");

    setText(".elementor-element-7dbf494b .elementor-heading-title", formatAccount(bankB.account));
    setText(".elementor-element-1d4ee940 .elementor-heading-title", bankB.name || groom.nickName || "Mempelai");
    setImage(".elementor-element-236be77b img", bankA.logo || resolveBankLogo(bankA.bank), bankA.bank || "Bank");
    setImage(".elementor-element-480f8ff5 img", bankB.logo || resolveBankLogo(bankB.bank), bankB.bank || "Bank");

    const copyBtnA = root.querySelector(".elementor-element-465e11a4 a[data-message]");
    const copyBtnB = root.querySelector(".elementor-element-1fadc68f a[data-message]");
    if (copyBtnA) copyBtnA.setAttribute("data-copy-value", String(bankA.account || ""));
    if (copyBtnB) copyBtnB.setAttribute("data-copy-value", String(bankB.account || ""));

    const shippingInfo = gift?.shipping || digitalEnvelopeInfo?.shipping || defaultSchema.gift?.shipping || {};
    setHtml(".elementor-element-3682a7a4 .elementor-widget-container", formatShippingMarkup(shippingInfo, event.akad?.address));
    setHtml(".elementor-element-21a4cf9b .elementor-widget-container", `<p>${escapeHtml(copy.closingText || defaultSchema.copy.closingText)}</p>`);
    setText(".elementor-element-168dfa88 .elementor-heading-title", copy.closingLabel || defaultSchema.copy.closingLabel || "Kami yang berbahagia,");

    setImage(".elementor-element-21b75889 img", heroPhoto, coupleNames);
    setImage(".elementor-element-33eb40df img", groomPhoto, groom.nameFull || "Groom");
    setImage(".elementor-element-848bff4 img", bridePhoto, bride.nameFull || "Bride");
    setImage(".elementor-element-78e08e2e img", resolveAssetUrl(closingThumbnailPhoto), coupleNames);
    setBackgroundImage(root, ".elementor-element-11fc743f", frontCoverPhoto, { position: "top center" });
    setBackgroundImage(root, ".elementor-element-12e00978", FALLBACKS.innerBackground, { position: "center center" });
    setBackgroundImage(root, ".elementor-element-1a993b64", FALLBACKS.akadBackground, { position: "bottom center" });
    setBackgroundImage(root, ".elementor-element-8f1740c", FALLBACKS.resepsiBackground, { position: "bottom center" });
    setBackgroundImage(root, ".elementor-element-693eba44", FALLBACKS.closingBackground, { position: "bottom center" });

    const countdownList = root.querySelector("#wpkoi-elements-countdown-32d1474");
    if (countdownList) {
        countdownList.setAttribute("data-date", formatCountdownDateAttr(event.dateISO || defaultSchema.event.dateISO));
    }
    updateCountdownNode(root, event.dateISO || defaultSchema.event.dateISO);

    const giftSection = root.querySelector(".elementor-element-3e596d7f");
    const wishesSection = root.querySelector(".elementor-element-7e385746");
    const countdownSection = root.querySelector(".elementor-element-709e9c12");

    if (giftSection) giftSection.style.display = features.digitalEnvelopeEnabled ? "" : "none";
    if (wishesSection) wishesSection.style.display = features.rsvpEnabled ? "" : "none";
    if (countdownSection) countdownSection.style.display = features.countdownEnabled || features.saveTheDateEnabled ? "" : "none";

    const audioSource = root.querySelector("source[data-audio-key='main_theme']");
    if (audioSource) {
        audioSource.setAttribute("src", resolveAssetUrl(pickAsset(invitationData?.audio?.src, FALLBACKS.backgroundAudio)));
    }

    const bgVideo = root.querySelector("[data-bg-video-key='waterfall_main'] video");
    if (bgVideo) {
        bgVideo.setAttribute("src", resolveAssetUrl(FALLBACKS.backgroundVideo));
    }
}

function applyAosAttributes(root) {
    const apply = (nodes, type) => {
        nodes.forEach((node, index) => {
            if (!node) return;
            const preset = aosPreset(type, index);
            node.setAttribute("data-aos", preset.aos);
            node.setAttribute("data-aos-delay", String(preset.delay));
        });
    };

    apply(Array.from(root.querySelectorAll(".elementor-widget-heading")), "heading");
    apply(Array.from(root.querySelectorAll(".elementor-widget-image")), "photo");
    apply(
        Array.from(root.querySelectorAll(".elementor-element-3c39178, .elementor-element-39cd1298, .elementor-element-63cd0286")),
        "title"
    );
    apply(Array.from(root.querySelectorAll(".elementor-element.elementor-absolute")), "ornament");
    apply(
        Array.from(
            root.querySelectorAll(
                ".elementor-element-1a993b64, .elementor-element-8f1740c, .elementor-element-5c98e149, .elementor-element-44e8b472, .elementor-element-10f7206b"
            )
        ),
        "card"
    );
    apply(Array.from(root.querySelectorAll(".elementor-element-118bde3a .e-gallery-item")), "stagger");
}

function copyToClipboard(value) {
    const text = String(value || "");
    if (!text) return Promise.resolve(false);

    if (navigator.clipboard?.writeText) {
        return navigator.clipboard
            .writeText(text)
            .then(() => true)
            .catch(() => false);
    }

    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        return Promise.resolve(true);
    } catch {
        return Promise.resolve(false);
    }
}

function setDynamicVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}

export default function MistyRomanceTemplate({ data: propData = null, invitationSlug = "misty-romance", mode = "live" }) {
    const isDemoMode = mode === "demo";
    const rootRef = useRef(null);
    const audioRef = useRef(null);
    const lottieInstancesRef = useRef([]);
    const wasPlayingOnHideRef = useRef(false);
    const wishesInitializedRef = useRef(false);

    const { data: fetchedData, loading } = useInvitationData(invitationSlug, {
        fallbackSlug: "misty-romance",
        skipFetch: Boolean(propData) || isDemoMode,
    });

    const [opened, setOpened] = useState(false);
    const [wishes, setWishes] = useState([]);
    const [lightboxItems, setLightboxItems] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [lightboxZoomed, setLightboxZoomed] = useState(false);
    const [lightboxFullscreen, setLightboxFullscreen] = useState(false);
    const lightboxFrameRef = useRef(null);

    const sourceArtifacts = useMemo(() => parseSourceArtifacts(sourceHtml), []);
    const liveData = isDemoMode ? null : propData || fetchedData || null;

    const mergedData = useMemo(() => {
        return mergeInvitationData(defaultSchema, liveData || {});
    }, [liveData]);

    const initialWishes = useMemo(() => extractInitialWishes(mergedData), [mergedData]);

    useEffect(() => {
        document.documentElement.style.setProperty("--mr-max-width", tokens.layout.maxWidth);
        document.documentElement.style.setProperty("--mr-color-primary", tokens.colors.primary);
        document.documentElement.style.setProperty("--mr-color-secondary", tokens.colors.secondary);
        document.documentElement.style.setProperty("--mr-color-text", tokens.colors.text);
        document.documentElement.style.setProperty("--mr-color-accent", tokens.colors.accent);
        document.documentElement.style.setProperty("--mr-font-heading", tokens.fonts.heading);
        document.documentElement.style.setProperty("--mr-font-display", tokens.fonts.display);
        document.documentElement.style.setProperty("--mr-font-body", tokens.fonts.body);
        document.documentElement.style.setProperty("--mr-font-sans", tokens.fonts.sans);
    }, []);

    useEffect(() => {
        BODY_CLASSES.forEach((className) => document.body.classList.add(className));
        return () => {
            BODY_CLASSES.forEach((className) => document.body.classList.remove(className));
        };
    }, []);

    useEffect(() => {
        const nodes = [];

        sourceArtifacts.styleSequence.forEach((entry) => {
            if (entry.type === "link") {
                const href = entry.href || "";
                if (!href) return;

                const nextHref = resolveAssetUrl(href);
                if (!nextHref || nextHref === SKIP_ASSET) return;
                const link = document.createElement("link");
                link.setAttribute("rel", "stylesheet");
                link.setAttribute("href", nextHref);
                link.setAttribute("data-misty-style", "1");
                document.head.appendChild(link);
                nodes.push(link);
                return;
            }

            const style = document.createElement("style");
            style.setAttribute("data-misty-inline-style", "1");
            style.textContent = rewriteInlineStyleValue(entry.css || "");
            document.head.appendChild(style);
            nodes.push(style);
        });

        return () => {
            nodes.forEach((node) => {
                if (node.parentNode) node.parentNode.removeChild(node);
            });
        };
    }, [sourceArtifacts.styleSequence]);

    useEffect(() => {
        AOS.init({
            duration: tokens.aos.duration,
            offset: tokens.aos.offset,
            easing: tokens.aos.easing,
            once: tokens.aos.once,
            mirror: tokens.aos.mirror,
        });
    }, []);

    useEffect(() => {
        if (loading) return;
        if (wishesInitializedRef.current) return;
        wishesInitializedRef.current = true;
        setWishes(initialWishes);
    }, [loading, initialWishes]);

    useEffect(() => {
        if (!opened) {
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "";
            };
        }

        document.body.style.overflow = "";
        return undefined;
    }, [opened]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root || loading) return undefined;

        setDynamicVh();
        root.style.fontFamily = tokens.fonts.body;

        root.innerHTML = buildTemplateMarkup(sourceArtifacts.markup, mergedData);

        root.querySelectorAll("[src], [href], [poster], [data-thumbnail], [srcset], [style]").forEach((node) => {
            ["src", "href", "poster", "data-thumbnail"].forEach((attr) => {
                if (!node.hasAttribute(attr)) return;
                const raw = node.getAttribute(attr) || "";
                const next = resolveAssetUrl(raw);
                if (next === SKIP_ASSET) {
                    node.removeAttribute(attr);
                    return;
                }
                if (next && next !== raw) node.setAttribute(attr, next);
            });

            if (node.hasAttribute("srcset")) {
                const srcset = node.getAttribute("srcset") || "";
                node.setAttribute("srcset", rewriteSrcsetValue(srcset));
            }

            if (node.hasAttribute("style")) {
                const styleValue = node.getAttribute("style") || "";
                node.setAttribute("style", rewriteInlineStyleValue(styleValue));
            }
        });

        root.querySelectorAll(".elementor-invisible").forEach((node) => node.classList.remove("elementor-invisible"));
        root.querySelectorAll(".e-con.e-parent").forEach((node) => node.classList.add("e-lazyloaded"));
        root.querySelectorAll("a[onclick*='copyText']").forEach((node) => node.removeAttribute("onclick"));

        applyInvitationData(root, mergedData);
        applyAosAttributes(root);

        const refreshGalleryLayout = () => {
            const galleryWidget = root.querySelector(".elementor-element-118bde3a.elementor-widget-gallery");
            applyJustifiedGalleryLayout(galleryWidget);
        };
        const scheduleGalleryLayout = () => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(refreshGalleryLayout);
            });
        };
        scheduleGalleryLayout();

        const cleanupFns = [];

        const secNode = root.querySelector("#sec");
        const kolomNode = root.querySelector("#kolom");
        const awNode = root.querySelector(".aw");

        const openInvitation = async (event) => {
            if (event) event.preventDefault();

            setOpened(true);

            if (awNode) awNode.style.display = "block";
            if (kolomNode) {
                kolomNode.style.transform = "translateY(-100%)";
                kolomNode.style.transition = "transform 1.5s ease-in-out";
            }

            if (secNode) {
                secNode.style.opacity = "0";
                secNode.style.transition = "opacity 1.5s ease-in-out";
                secNode.style.pointerEvents = "none";
                window.setTimeout(() => {
                    secNode.style.visibility = "hidden";
                    secNode.style.display = "none";
                }, 1500);
            }

            const audio = audioRef.current;
            if (audio) {
                try {
                    await audio.play();
                } catch {
                    // Ignore autoplay restrictions.
                }
            }

            window.setTimeout(() => AOS.refresh(), 350);
        };

        const openWrap = root.querySelector("#open");
        const openButton = openWrap?.querySelector("a,button");
        if (openWrap) {
            openWrap.addEventListener("click", openInvitation);
            cleanupFns.push(() => openWrap.removeEventListener("click", openInvitation));
        }
        if (openButton) {
            openButton.addEventListener("click", openInvitation);
            cleanupFns.push(() => openButton.removeEventListener("click", openInvitation));
        }

        if (opened) {
            if (awNode) awNode.style.display = "block";
            if (secNode) {
                secNode.style.visibility = "hidden";
                secNode.style.display = "none";
            }
        }

        const giftButton = root.querySelector("#klik");
        const giftContainer = root.querySelector("#amplop");
        const handleGiftToggle = (event) => {
            event.preventDefault();
            slideToggle(giftContainer, 1000);
        };

        if (giftButton && giftContainer) {
            giftButton.addEventListener("click", handleGiftToggle);
            cleanupFns.push(() => giftButton.removeEventListener("click", handleGiftToggle));
        }

        root.querySelectorAll(".elementor-element-465e11a4 a[data-copy-value], .elementor-element-1fadc68f a[data-copy-value]").forEach((button) => {
            const onCopy = async (event) => {
                event.preventDefault();
                const copyValue = button.getAttribute("data-copy-value") || "";
                const original = button.innerHTML;
                await copyToClipboard(copyValue);
                button.innerHTML = escapeHtml(button.getAttribute("data-message") || "berhasil disalin");
                window.setTimeout(() => {
                    button.innerHTML = original;
                }, 500);
            };

            button.addEventListener("click", onCopy);
            cleanupFns.push(() => button.removeEventListener("click", onCopy));
        });

        const audioElement = root.querySelector("#song");
        if (audioElement) {
            audioElement.load();
            audioRef.current = audioElement;
        }

        const audioContainer = root.querySelector("#audio-container");
        const muteIcon = root.querySelector("#mute-sound");
        const unmuteIcon = root.querySelector("#unmute-sound");

        const syncAudioIcons = () => {
            const audio = audioRef.current;
            if (!audio || !muteIcon || !unmuteIcon) return;
            const paused = audio.paused;
            muteIcon.style.display = paused ? "none" : "block";
            unmuteIcon.style.display = paused ? "block" : "none";
        };

        if (muteIcon && unmuteIcon) {
            muteIcon.style.display = "none";
            unmuteIcon.style.display = "block";
        }

        const handleAudioToggle = async () => {
            const audio = audioRef.current;
            if (!audio) return;

            if (audio.paused) {
                try {
                    await audio.play();
                } catch {
                    // Ignore autoplay restrictions.
                }
            } else {
                audio.pause();
            }
            syncAudioIcons();
        };

        if (audioContainer) {
            audioContainer.addEventListener("click", handleAudioToggle);
            cleanupFns.push(() => audioContainer.removeEventListener("click", handleAudioToggle));
        }

        const countdownTarget = mergedData?.event?.dateISO || defaultSchema.event.dateISO;
        const runCountdown = () => updateCountdownNode(root, countdownTarget);
        runCountdown();
        const countdownTimer = window.setInterval(runCountdown, 1000);
        cleanupFns.push(() => window.clearInterval(countdownTimer));

        const countdownWidgetContainer = root.querySelector(".elementor-element-32d1474 .elementor-widget-container");
        if (countdownWidgetContainer && !countdownWidgetContainer.querySelector("[data-misty-calendar-button='1']")) {
            const calendarAction = document.createElement("div");
            calendarAction.className = "misty-calendar-action";
            calendarAction.setAttribute("data-misty-calendar-button", "1");
            calendarAction.innerHTML = `
                <button type="button" class="misty-calendar-button" data-calendar-target="adaptive">
                    <span class="misty-calendar-button__icon"><i aria-hidden="true" class="far fa-calendar-alt"></i></span>
                    <span class="misty-calendar-button__label">Simpan ke Kalender</span>
                </button>
            `;

            const button = calendarAction.querySelector("[data-calendar-target='adaptive']");
            const handleCalendarAction = () => {
                if (shouldUseIcsCalendar()) {
                    downloadCalendarFile(mergedData, invitationSlug);
                    return;
                }
                openGoogleCalendar(mergedData);
            };
            if (button) {
                button.addEventListener("click", handleCalendarAction);
                cleanupFns.push(() => button.removeEventListener("click", handleCalendarAction));
            }

            countdownWidgetContainer.appendChild(calendarAction);
        }

        const commentsWrap = root.querySelector("#cui-wrap-commnent-13455");
        const commentsBox = root.querySelector("#cui-box");
        const commentsList = root.querySelector("#cui-container-comment-13455");
        if (commentsWrap) commentsWrap.style.display = "block";
        if (commentsBox) {
            commentsBox.style.display = "block";
            commentsBox.style.opacity = "1";
            commentsBox.style.visibility = "visible";
        }
        if (commentsList) {
            commentsList.style.display = "block";
            commentsList.style.opacity = "1";
            commentsList.style.visibility = "visible";
        }

        const commentsToggle = root.querySelector("#cui-link-13455");
        if (commentsToggle && commentsWrap) {
            const toggleComments = (event) => {
                event.preventDefault();
                const hidden = commentsWrap.style.display === "none";
                commentsWrap.style.display = hidden ? "block" : "none";
            };

            commentsToggle.addEventListener("click", toggleComments);
            cleanupFns.push(() => commentsToggle.removeEventListener("click", toggleComments));
        }

        const authorInput = root.querySelector("#author");
        if (authorInput) {
            authorInput.removeAttribute("readonly");
            authorInput.removeAttribute("nofocus");
            authorInput.value = mergedData?.guest?.name || "";
        }

        const runtimeStyle = document.createElement("style");
        runtimeStyle.textContent = `
            .misty-romance-template .cui-submit-spinner {
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: #ffffff;
                border-radius: 50%;
                animation: misty-spin 0.6s linear infinite;
                vertical-align: middle;
                margin-right: 6px;
            }
            @keyframes misty-spin {
                to { transform: rotate(360deg); }
            }
            .misty-romance-template #commentform-13455.is-submitting input,
            .misty-romance-template #commentform-13455.is-submitting textarea,
            .misty-romance-template #commentform-13455.is-submitting select,
            .misty-romance-template #commentform-13455.is-submitting button {
                opacity: 0.6;
                pointer-events: none;
                cursor: not-allowed;
            }
        `;
        root.appendChild(runtimeStyle);

        const readonlyWarning = root.querySelector(".cui-error-info-name");
        if (readonlyWarning) readonlyWarning.style.display = "none";

        const commentForm = root.querySelector("#commentform-13455");
        if (commentForm) {
            const onSubmit = async (event) => {
                event.preventDefault();
                if (commentForm.classList.contains("is-submitting")) return;

                const name = normalizeText(root.querySelector("#author")?.value || mergedData?.guest?.name || "");
                const message = normalizeText(root.querySelector("#cui-textarea-13455")?.value || "");
                const attendanceValue = normalizeText(root.querySelector("#konfirmasi")?.value || "");
                const attendanceText = normalizeText(
                    root.querySelector("#konfirmasi option:checked")?.textContent || attendanceValue || ""
                );

                if (!name || !message) return;

                commentForm.classList.add("is-submitting");
                const formElements = commentForm.querySelectorAll("input, textarea, select, button");
                formElements.forEach((el) => {
                    el.disabled = true;
                });

                const submitBtn = commentForm.querySelector("button[type='submit'], input[type='submit']");
                let originalBtnContent = "";
                if (submitBtn) {
                    originalBtnContent = submitBtn.innerHTML || submitBtn.value;
                    if (submitBtn.tagName === "INPUT") submitBtn.value = "Mengirim...";
                    else submitBtn.innerHTML = '<span class="cui-submit-spinner"></span> Mengirim...';
                }

                const nextAttendance = normalizeAttendanceLabel(attendanceText || attendanceValue);
                const activeInvitationSlug =
                    invitationSlug ||
                    mergedData?.invitation?.slug ||
                    mergedData?.invitationSlug ||
                    "misty-romance";
                const activeOrderId =
                    mergedData?.invitation?.orderId ||
                    mergedData?.orderId ||
                    mergedData?.order?.orderId ||
                    "";
                let nextCreatedAt = new Date().toISOString();

                try {
                    const response = await postInvitationWish(activeInvitationSlug, {
                        invitationSlug: activeInvitationSlug,
                        orderId: activeOrderId,
                        author: name,
                        comment: message,
                        attendance: nextAttendance,
                    });
                    nextCreatedAt = normalizeText(
                        response?.data?.createdAt || response?.data?.created_at || nextCreatedAt
                    );
                } catch {
                    // Keep optimistic local render even if API is unavailable.
                } finally {
                    commentForm.classList.remove("is-submitting");
                    formElements.forEach((el) => {
                        el.disabled = false;
                    });
                    if (submitBtn) {
                        if (submitBtn.tagName === "INPUT") submitBtn.value = originalBtnContent;
                        else submitBtn.innerHTML = originalBtnContent;
                    }
                }

                setWishes((prev) => [
                    {
                        author: name,
                        comment: message,
                        attendance: nextAttendance,
                        createdAt: nextCreatedAt,
                    },
                    ...prev,
                ]);

                const textarea = root.querySelector("#cui-textarea-13455");
                const select = root.querySelector("#konfirmasi");
                if (textarea) textarea.value = "";
                if (select) select.value = "";
            };

            commentForm.addEventListener("submit", onSubmit);
            cleanupFns.push(() => commentForm.removeEventListener("submit", onSubmit));
        }

        const galleryAnchors = Array.from(root.querySelectorAll(".elementor-element-118bde3a .e-gallery-item"));
        const gallerySource = galleryAnchors.map((anchor) => anchor.getAttribute("href") || "").filter(Boolean);
        setLightboxItems(gallerySource);

        galleryAnchors.forEach((anchor, index) => {
            const onOpenLightbox = (event) => {
                event.preventDefault();
                setLightboxIndex(index);
                setLightboxZoomed(false);
                setLightboxFullscreen(false);
            };
            anchor.addEventListener("click", onOpenLightbox);
            cleanupFns.push(() => anchor.removeEventListener("click", onOpenLightbox));
        });

        const revealElements = () => {
            ["reveal", "revealin", "revealkanan", "revealkiri", "revealatas", "revealr", "ef"].forEach((className) => {
                root.querySelectorAll(`.${className}`).forEach((element) => {
                    const rect = element.getBoundingClientRect();
                    const visible = className === "ef" ? 100 : 150;
                    if (rect.top < window.innerHeight - visible) {
                        element.classList.add("active");
                    }
                });
            });
        };

        revealElements();
        window.addEventListener("scroll", revealElements);
        cleanupFns.push(() => window.removeEventListener("scroll", revealElements));

        const lottieWidgets = Array.from(root.querySelectorAll(".elementor-widget-lottie"));

        lottieInstancesRef.current.forEach((instance) => {
            if (instance && typeof instance.destroy === "function") instance.destroy();
        });
        lottieInstancesRef.current = [];

        ensureLottieLibrary()
            .then((lottie) => {
                if (!lottie || typeof lottie.loadAnimation !== "function") return;

                lottieWidgets.forEach((widget) => {
                    const raw = widget.getAttribute("data-settings") || "{}";
                    let settings = {};
                    try {
                        settings = JSON.parse(raw);
                    } catch {
                        settings = {};
                    }

                    let src = settings?.source_json?.url || "";
                    if (!src || src.includes("mjdhnQTmWf-1-1-1.json")) {
                        src = FALLBACKS.secondaryLottie;
                    }

                    if (widget.classList.contains("elementor-element-111517f8") || widget.classList.contains("elementor-element-345e5403")) {
                        src = FALLBACKS.mainLottie;
                    }

                    const resolved = resolveAssetUrl(src);
                    if (!settings.source_json || typeof settings.source_json !== "object") {
                        settings.source_json = {};
                    }
                    settings.source_json.url = resolved;
                    widget.setAttribute("data-settings", JSON.stringify(settings));

                    const container = widget.querySelector(".e-lottie__animation");
                    if (!container) return;

                    container.innerHTML = "";

                    const instance = lottie.loadAnimation({
                        container,
                        renderer: settings.renderer || "svg",
                        loop: settings.loop === "yes" || settings.loop === true,
                        autoplay: true,
                        path: resolved,
                    });

                    lottieInstancesRef.current.push(instance);
                });
            })
            .catch(() => {
                // Ignore lottie load failures to keep template usable.
            });

        window.addEventListener("resize", setDynamicVh);
        cleanupFns.push(() => window.removeEventListener("resize", setDynamicVh));
        window.addEventListener("resize", scheduleGalleryLayout);
        cleanupFns.push(() => window.removeEventListener("resize", scheduleGalleryLayout));

        window.setTimeout(() => {
            applyAosAttributes(root);
            AOS.refreshHard();
        }, 250);

        return () => {
            cleanupFns.forEach((cleanup) => cleanup());
            lottieInstancesRef.current.forEach((instance) => {
                if (instance && typeof instance.destroy === "function") instance.destroy();
            });
            lottieInstancesRef.current = [];
            audioRef.current = null;
        };
    }, [sourceArtifacts.markup, mergedData, loading]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const commentsWrap = root.querySelector("#cui-wrap-commnent-13455");
        const commentsBox = root.querySelector("#cui-box");
        const list = root.querySelector("#cui-container-comment-13455");

        if (commentsWrap) commentsWrap.style.display = "block";
        if (commentsBox) {
            commentsBox.style.display = "block";
            commentsBox.style.opacity = "1";
            commentsBox.style.visibility = "visible";
        }
        if (list) {
            list.style.display = "block";
            list.style.opacity = "1";
            list.style.visibility = "visible";
            list.innerHTML = wishes
                .map((wish) => {
                    return `<li class="cui-item-comment"><div class="cui-comment-content"><div class="cui-comment-info"><a class="cui-commenter-name" href="#">${escapeHtml(
                        wish.author
                    )}</a><span class="cui-comment-name" style="display:none;">${escapeHtml(wish.author)}</span></div><div class="cui-comment-text"><p>${escapeHtml(
                        wish.comment
                    )}</p></div><div class="cui-comment-actions"><a href="#">${escapeHtml(
                        wish.attendance
                    )}</a><span> · ${escapeHtml(formatWishRelativeTime(wish.createdAt))}</span></div></div></li>`;
                })
                .join("");
        }

        const hadirCount = wishes.filter((item) => normalizeText(item.attendance).toLowerCase() === "hadir").length;
        const tidakHadirCount = wishes.filter((item) => normalizeText(item.attendance).toLowerCase().includes("tidak")).length;

        const hadirNode = root.querySelector("#invitation-count-13455 .cui_card-hadir span:first-child");
        const tidakHadirNode = root.querySelector("#invitation-count-13455 .cui_card-tidak_hadir span:first-child");
        const totalNode = root.querySelector("#cui-link-13455 span");

        if (hadirNode) hadirNode.textContent = String(hadirCount);
        if (tidakHadirNode) tidakHadirNode.textContent = String(tidakHadirCount);
        if (totalNode) totalNode.textContent = String(wishes.length);
    }, [wishes]);

    useEffect(() => {
        const onVisibilityChange = async () => {
            const audio = audioRef.current;
            if (!audio) return;

            if (document.visibilityState === "hidden") {
                wasPlayingOnHideRef.current = !audio.paused;
                audio.pause();
                return;
            }

            if (wasPlayingOnHideRef.current) {
                try {
                    await audio.play();
                } catch {
                    // Ignore autoplay restrictions.
                }
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, []);

    useEffect(() => {
        const onEscape = (event) => {
            if (lightboxIndex >= 0 && event.key === "Escape") {
                setLightboxIndex(-1);
            }

            if (lightboxIndex < 0) return;

            if (event.key === "ArrowLeft") {
                setLightboxIndex((prev) => (prev - 1 + lightboxItems.length) % lightboxItems.length);
            }
            if (event.key === "ArrowRight") {
                setLightboxIndex((prev) => (prev + 1) % lightboxItems.length);
            }
            if (event.key.toLowerCase() === "f") {
                setLightboxFullscreen((prev) => !prev);
            }
            if (event.key === "+" || event.key === "=" || event.key === "-") {
                setLightboxZoomed((prev) => !prev);
            }
        };

        window.addEventListener("keydown", onEscape);
        return () => window.removeEventListener("keydown", onEscape);
    }, [lightboxIndex, lightboxItems.length]);

    useEffect(() => {
        if (lightboxIndex >= 0) return;
        setLightboxZoomed(false);
        setLightboxFullscreen(false);
    }, [lightboxIndex]);

    useEffect(() => {
        if (lightboxIndex < 0) return undefined;

        const frame = lightboxFrameRef.current;
        if (!frame) return undefined;

        const onFullscreenChange = () => {
            if (document.fullscreenElement !== frame) {
                setLightboxFullscreen(false);
            }
        };
        document.addEventListener("fullscreenchange", onFullscreenChange);

        if (lightboxFullscreen && document.fullscreenElement !== frame && frame.requestFullscreen) {
            frame.requestFullscreen().catch(() => {
                setLightboxFullscreen(false);
            });
        }

        if (!lightboxFullscreen && document.fullscreenElement === frame && document.exitFullscreen) {
            document.exitFullscreen().catch(() => { });
        }

        return () => {
            document.removeEventListener("fullscreenchange", onFullscreenChange);
        };
    }, [lightboxFullscreen, lightboxIndex]);

    const currentLightboxImage = lightboxItems[lightboxIndex] || "";

    return (
        <div className="misty-romance-template">
            <div className="misty-romance-root" ref={rootRef} />

            {lightboxIndex >= 0 && currentLightboxImage ? (
                <div className="misty-lightbox" ref={lightboxFrameRef} onClick={() => setLightboxIndex(-1)}>
                    <div className="misty-lightbox__toolbar" onClick={(event) => event.stopPropagation()}>
                        <span className="misty-lightbox__counter">{`${lightboxIndex + 1} / ${lightboxItems.length}`}</span>
                        <div className="misty-lightbox__actions">
                            <button
                                type="button"
                                className="misty-lightbox__icon"
                                aria-label={lightboxZoomed ? "Zoom out" : "Zoom in"}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setLightboxZoomed((prev) => !prev);
                                }}
                            >
                                {lightboxZoomed ? "−" : "+"}
                            </button>
                            <button
                                type="button"
                                className="misty-lightbox__icon"
                                aria-label={lightboxFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setLightboxFullscreen((prev) => !prev);
                                }}
                            >
                                {lightboxFullscreen ? "⤡" : "⤢"}
                            </button>
                            <button
                                type="button"
                                className="misty-lightbox__icon"
                                aria-label="Close"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setLightboxIndex(-1);
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="misty-lightbox__nav misty-lightbox__nav--prev"
                        aria-label="Previous image"
                        onClick={(event) => {
                            event.stopPropagation();
                            const next = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
                            setLightboxIndex(next);
                            setLightboxZoomed(false);
                        }}
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        className="misty-lightbox__nav misty-lightbox__nav--next"
                        aria-label="Next image"
                        onClick={(event) => {
                            event.stopPropagation();
                            const next = (lightboxIndex + 1) % lightboxItems.length;
                            setLightboxIndex(next);
                            setLightboxZoomed(false);
                        }}
                    >
                        ›
                    </button>
                    <img
                        className={lightboxZoomed ? "is-zoomed" : ""}
                        src={currentLightboxImage}
                        alt={`Gallery ${lightboxIndex + 1}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            setLightboxZoomed((prev) => !prev);
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
}
