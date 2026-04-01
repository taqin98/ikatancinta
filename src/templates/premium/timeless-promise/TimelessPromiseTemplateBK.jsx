import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { postInvitationWish } from "../../../services/wishesApi";
import behaviorDefaults from "./schema/behavior.json";
import contentDefaults from "./schema/content.json";
import sourceHtml from "./schema/source.html?raw";
import { defaultSchema } from "./schema/invitationSchema";
import { tokens } from "./tokens";

const BODY_CLASSES = [
    "wp-singular",
    "page-template-default",
    "page",
    "page-id-5816",
    "wp-embed-responsive",
    "wp-theme-hello-elementor",
    "hello-elementor-default",
    "elementor-default",
    "elementor-template-canvas",
    "elementor-kit-5",
    "elementor-page",
    "elementor-page-5816",
];

const APP_BASE_URL = import.meta.env.BASE_URL || "/";
const normalizedBaseUrl = APP_BASE_URL.endsWith("/") ? APP_BASE_URL : `${APP_BASE_URL}/`;
const PUBLIC_ASSET_PREFIX = `${normalizedBaseUrl}templates/premium/timeless-promise/assets/`;

function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
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

function pickNonEmptyText(...values) {
    for (const value of values) {
        if (value == null) continue;
        const normalized = normalizeText(value);
        if (normalized) return normalized;
    }
    return "";
}

function resolveAssetUrl(path) {
    if (!path || typeof path !== "string") return path;
    if (/^(https?:|data:|blob:|#)/i.test(path)) return path;
    const normalized = path.replace(/^\.\/?/, "").replace(/^\//, "");
    if (!normalized.startsWith("assets/")) return path;
    return `${PUBLIC_ASSET_PREFIX}${normalized.slice("assets/".length)}`;
}

function rewriteCssAssetUrls(cssText) {
    if (!cssText) return "";
    return cssText.replace(/url\((['"]?)(assets\/[^'")]+)\1\)/g, (_, quote, assetPath) => {
        const resolved = resolveAssetUrl(assetPath);
        const safeQuote = quote || "\"";
        return `url(${safeQuote}${resolved}${safeQuote})`;
    });
}

function rewriteSrcsetValue(srcset) {
    if (!srcset || typeof srcset !== "string") return srcset;
    return srcset
        .split(",")
        .map((part) => {
            const trimmed = part.trim();
            if (!trimmed) return trimmed;
            const [urlPart, ...descriptor] = trimmed.split(/\s+/);
            const resolved = resolveAssetUrl(urlPart);
            return descriptor.length > 0 ? `${resolved} ${descriptor.join(" ")}` : resolved;
        })
        .join(", ");
}

function rewriteInlineStyleValue(styleValue) {
    if (!styleValue || typeof styleValue !== "string") return styleValue;
    // Don't rewrite if it's already a full external URL
    if (/url\((['"]?)(https?:|data:|blob:)/i.test(styleValue)) return styleValue;

    return styleValue.replace(/url\((['"]?)(assets\/[^'")]+)\1\)/g, (_, quote, assetPath) => {
        const resolved = resolveAssetUrl(assetPath);
        const safeQuote = quote || "\"";
        return `url(${safeQuote}${resolved}${safeQuote})`;
    });
}

function parseSourceArtifacts(rawHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    const styleSequence = [];
    const styleAndLinkNodes = doc.querySelectorAll("style, link[rel~='stylesheet']");
    styleAndLinkNodes.forEach((node) => {
        if (node.tagName.toLowerCase() === "style") {
            styleSequence.push({ type: "style", css: node.textContent || "" });
            return;
        }

        const href = node.getAttribute("href") || "";
        styleSequence.push({ type: "link", href });
    });

    const bodyClone = doc.body.cloneNode(true);
    bodyClone.querySelectorAll("script, style, meta").forEach((node) => node.remove());
    const markup = bodyClone.innerHTML;

    return { styleSequence, markup };
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function textToHtmlWithBreaks(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
}

function toInstagramUrl(handle) {
    if (!handle) return "https://instagram.com";
    return `https://instagram.com/${String(handle).replace(/^@/, "")}`;
}

function formatCountdown(targetInput) {
    const target = new Date(targetInput).getTime();
    if (!Number.isFinite(target)) {
        return { days: "00", hours: "00", minutes: "00", seconds: "00", ended: true };
    }

    const diff = target - Date.now();
    if (diff <= 0) {
        return { days: "00", hours: "00", minutes: "00", seconds: "00", ended: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        ended: false,
    };
}

function updateCountdownNode(node, targetInput) {
    const value = formatCountdown(targetInput);
    const days = node.querySelector("[data-days]");
    const hours = node.querySelector("[data-hours]");
    const minutes = node.querySelector("[data-minutes]");
    const seconds = node.querySelector("[data-seconds]");

    if (days) days.textContent = value.days;
    if (hours) hours.textContent = value.hours;
    if (minutes) minutes.textContent = value.minutes;
    if (seconds) seconds.textContent = value.seconds;
}

function slideToggle(element, duration = 500) {
    const isHidden = window.getComputedStyle(element).display === "none";

    if (isHidden) {
        element.style.removeProperty("display");
        let display = window.getComputedStyle(element).display;
        if (display === "none") display = "block";
        element.style.display = display;

        const targetHeight = element.scrollHeight;
        element.style.overflow = "hidden";
        element.style.height = "0px";
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

function mergeInvitationData(baseSchema, incomingData) {
    if (!incomingData) return baseSchema;

    return {
        ...baseSchema,
        ...incomingData,
        guest: { ...baseSchema.guest, ...(incomingData.guest || {}) },
        couple: {
            ...baseSchema.couple,
            ...(incomingData.couple || {}),
            groom: {
                ...baseSchema.couple.groom,
                ...(incomingData.couple?.groom || {}),
            },
            bride: {
                ...baseSchema.couple.bride,
                ...(incomingData.couple?.bride || {}),
            },
        },
        event: {
            ...baseSchema.event,
            ...(incomingData.event || {}),
            akad: { ...baseSchema.event.akad, ...(incomingData.event?.akad || {}) },
            resepsi: { ...baseSchema.event.resepsi, ...(incomingData.event?.resepsi || {}) },
            livestream: { ...baseSchema.event.livestream, ...(incomingData.event?.livestream || {}) },
        },
        copy: {
            ...baseSchema.copy,
            ...(incomingData.copy || {}),
        },
        features: {
            ...baseSchema.features,
            ...(incomingData.features || {}),
            digitalEnvelopeInfo: {
                ...baseSchema.features.digitalEnvelopeInfo,
                ...(incomingData.features?.digitalEnvelopeInfo || {}),
            },
        },
        lovestory: Array.isArray(incomingData.lovestory) ? incomingData.lovestory : baseSchema.lovestory,
        gallery: Array.isArray(incomingData.gallery) ? incomingData.gallery : baseSchema.gallery,
    };
}

function applyInvitationData(root, invitationData) {
    const guestName = invitationData?.guest?.name || defaultSchema.guest.name;
    const greetingLabel = invitationData?.guest?.greetingLabel || defaultSchema.guest.greetingLabel;

    const bride = invitationData?.couple?.bride || defaultSchema.couple.bride;
    const groom = invitationData?.couple?.groom || defaultSchema.couple.groom;
    const event = invitationData?.event || defaultSchema.event;

    const replaceExactText = (selector, fromText, toText) => {
        const fromNormalized = normalizeText(fromText);
        root.querySelectorAll(selector).forEach((node) => {
            if (normalizeText(node.textContent) === fromNormalized) {
                node.textContent = toText;
            }
        });
    };

    replaceExactText(".elementor-widget-container p, .elementor-heading-title", "Nama Tamu", guestName || "");
    replaceExactText(".elementor-widget-container p, .elementor-heading-title", "Kepada Bapak/Ibu/Saudara/i", greetingLabel);

    replaceExactText(".elementor-widget-container p, .elementor-heading-title", "Habib & Adiba", `${groom.nickName} & ${bride.nickName}`);
    replaceExactText(".elementor-widget-container p, .elementor-heading-title", "Adiba  & Habib", `${bride.nickName} & ${groom.nickName}`);
    replaceExactText(".elementor-widget-container p, .elementor-heading-title", "Adiba & Habib", `${bride.nickName} & ${groom.nickName}`);

    replaceExactText(".elementor-widget-container p, .elementor-heading-title", "Adiba Putri Syakila", bride.nameFull);
    replaceExactText(".elementor-widget-container p, .elementor-heading-title", "Habib Yulianto", groom.nameFull);

    replaceExactText(".elementor-widget-container p, .elementor-heading-title", "The Wedding Of", invitationData?.copy?.openingGreeting || "The Wedding Of");
    replaceExactText(
        ".elementor-widget-container p, .elementor-heading-title",
        "Minggu, 30 Maret 2025",
        event?.akad?.date || defaultSchema.event.akad.date
    );
    replaceExactText(
        ".elementor-widget-container p, .elementor-heading-title",
        "10.00 WIB",
        event?.akad?.time || defaultSchema.event.akad.time
    );
    replaceExactText(
        ".elementor-widget-container p, .elementor-heading-title",
        "Ds Pagu Kec. Wates Kab. Kediri",
        event?.akad?.address || defaultSchema.event.akad.address
    );

    const openingTextNode = Array.from(root.querySelectorAll(".elementor-widget-container p")).find((node) =>
        normalizeText(node.textContent).startsWith("Tanpa mengurangi rasa hormat")
    );
    if (openingTextNode && invitationData?.copy?.openingText) {
        openingTextNode.textContent = invitationData.copy.openingText;
    }

    const closingTextNode = Array.from(root.querySelectorAll(".elementor-widget-container p")).find((node) =>
        normalizeText(node.textContent).startsWith("Merupakan suatu kehormatan")
    );
    if (closingTextNode && invitationData?.copy?.closingText) {
        closingTextNode.textContent = invitationData.copy.closingText;
    }

    const infoNodes = root.querySelectorAll("#mempelai .elementor-widget-container");
    infoNodes.forEach((node) => {
        const text = normalizeText(node.textContent);
        if (!text) return;
        if (text.includes("Putri Pertama Bapak") || text.includes("Putri Pertama")) {
            node.innerHTML = textToHtmlWithBreaks(bride.parentInfo || defaultSchema.couple.bride.parentInfo);
        }
        if (text.includes("Putra Kedua Bapak") || text.includes("Putra Kedua")) {
            node.innerHTML = textToHtmlWithBreaks(groom.parentInfo || defaultSchema.couple.groom.parentInfo);
        }
    });

    const instagramNodes = root.querySelectorAll("#mempelai .elementor-social-icon-instagram");
    if (instagramNodes[0]) instagramNodes[0].setAttribute("href", toInstagramUrl(bride.instagram));
    if (instagramNodes[1]) instagramNodes[1].setAttribute("href", toInstagramUrl(groom.instagram));

    const rawBankList = invitationData?.features?.digitalEnvelopeEnabled ? (invitationData?.gift?.bankList || invitationData?.features?.digitalEnvelopeInfo?.bankList || []) : [];
    const bankList = rawBankList.map((item) => ({
        bank: item.bank || "",
        account: item.account || item.accountNumber || "",
        name: item.name || item.accountName || "",
    }));
    const accountTitles = Array.from(root.querySelectorAll("#amplop .elementor-heading-title"));
    const numberNodes = accountTitles.filter((node) => /\d/.test(node.textContent || ""));
    const nameNodes = accountTitles.filter((node) => {
        const text = normalizeText(node.textContent);
        return Boolean(text) && !/\d/.test(text) && text.toLowerCase() !== "kirim hadiah";
    });

    if (numberNodes[0]) {
        const current = numberNodes[0].textContent;
        numberNodes[0].textContent = pickNonEmptyText(
            bankList[0]?.account,
            contentDefaults.gift?.bankList?.[0]?.account,
            current
        );
    }
    if (nameNodes[0]) {
        const current = nameNodes[0].textContent;
        nameNodes[0].textContent = pickNonEmptyText(bankList[0]?.name, contentDefaults.gift?.bankList?.[0]?.name, current);
    }

    if (numberNodes[1]) {
        const current = numberNodes[1].textContent;
        numberNodes[1].textContent = pickNonEmptyText(
            bankList[1]?.account,
            contentDefaults.gift?.bankList?.[1]?.account,
            current
        );
    }
    if (nameNodes[1]) {
        const current = nameNodes[1].textContent;
        nameNodes[1].textContent = pickNonEmptyText(bankList[1]?.name, contentDefaults.gift?.bankList?.[1]?.name, current);
    }

    const shippingParagraph = Array.from(root.querySelectorAll("#amplop .elementor-widget-text-editor p")).find((node) =>
        normalizeText(node.textContent).startsWith("Nama Penerima")
    );

    if (shippingParagraph) {
        const shipping = invitationData?.gift?.shipping || contentDefaults.gift.shipping;
        const recipient = shipping.recipient || groom.nameFull;
        const phone = shipping.phone || (bankList[0]?.account || "-");
        const address = shipping.address || event?.akad?.address || "-";
        const parent = shippingParagraph.parentElement;
        if (parent) {
            parent.innerHTML = `<p>Nama Penerima : ${escapeHtml(recipient)}</p><p>No. HP : ${escapeHtml(phone)}</p><p>${escapeHtml(address)}</p>`;
        }
    }

    // Dynamic Photos
    const frontCoverPhoto = invitationData?.couple?.frontCoverPhoto;
    if (frontCoverPhoto) {
        const coverNode = root.querySelector(".elementor-element-26797a73 .elementor-widget-container img, #sec .elementor-image img");
        if (coverNode) {
            coverNode.setAttribute("src", resolveAssetUrl(frontCoverPhoto));
            coverNode.setAttribute("srcset", "");
        }
    }

    const heroPhoto = invitationData?.couple?.heroPhoto;
    if (heroPhoto) {
        const heroNode = root.querySelector(".elementor-element-ac20593 .elementor-widget-container img, #hero .elementor-image img");
        if (heroNode) {
            heroNode.setAttribute("src", resolveAssetUrl(heroPhoto));
            heroNode.setAttribute("srcset", "");
        }
    }

    if (bride.photo) {
        const bridePhotoNode = root.querySelector(".elementor-element-2a734d13 .elementor-widget-container img");
        if (bridePhotoNode) {
            bridePhotoNode.setAttribute("src", resolveAssetUrl(bride.photo));
            bridePhotoNode.setAttribute("srcset", "");
        } else {
            // Background fallback if img not found
            const brideBgNode = root.querySelector(".elementor-element-2a734d13");
            if (brideBgNode) brideBgNode.style.backgroundImage = `url("${resolveAssetUrl(bride.photo)}")`;
        }
    }

    if (groom.photo) {
        const groomPhotoNode = root.querySelector(".elementor-element-1be20715 .elementor-widget-container img");
        if (groomPhotoNode) {
            groomPhotoNode.setAttribute("src", resolveAssetUrl(groom.photo));
            groomPhotoNode.setAttribute("srcset", "");
        } else {
            // Background fallback if img not found
            const groomBgNode = root.querySelector(".elementor-element-1be20715");
            if (groomBgNode) groomBgNode.style.backgroundImage = `url("${resolveAssetUrl(groom.photo)}")`;
        }
    }

    // Gallery Dynamic
    const galleryItems = Array.isArray(invitationData?.gallery) ? invitationData.gallery : [];
    if (galleryItems.length > 0) {
        const galleryNodes = root.querySelectorAll(".elementor-gallery__container .e-gallery-item");
        galleryNodes.forEach((node, idx) => {
            const item = galleryItems[idx];
            if (!item) {
                node.style.display = "none";
                return;
            }
            const imgNode = node.querySelector(".e-gallery-image");
            const resolved = resolveAssetUrl(item.src || item.url || "");
            if (imgNode && resolved) {
                imgNode.style.backgroundImage = `url("${resolved}")`;
                imgNode.setAttribute("data-thumbnail", resolved);
            }
            const anchorNode = node.querySelector("a[data-elementor-open-lightbox]");
            if (anchorNode && resolved) {
                anchorNode.setAttribute("href", resolved);
            }
        });
    }

    // Dynamic Background Photos (FORCE override via Style Injection + DOM)
    const bgPhotos = [
        [".elementor-element-1506e139", invitationData?.couple?.frontCoverPhoto],
        [".elementor-element-c854208", invitationData?.couple?.frontCoverPhoto],
        [".elementor-element-1151be1e", invitationData?.couple?.heroPhoto],
        [".elementor-element-2a734d13", invitationData?.couple?.bride?.photo],
        [".elementor-element-1be20715", invitationData?.couple?.groom?.photo],
        [".elementor-element-36d72a88", invitationData?.couple?.closingBackgroundPhoto],
    ];

    let forceStyleId = "tp-force-bg-styles";
    let forceStyle = root.querySelector(`#${forceStyleId}`);
    if (!forceStyle) {
        forceStyle = document.createElement("style");
        forceStyle.id = forceStyleId;
        root.appendChild(forceStyle);
    }

    let cssRules = "";
    bgPhotos.forEach(([selector, assetPath]) => {
        if (!assetPath) return;
        const resolved = resolveAssetUrl(assetPath);
        
        // Strategy A: CSS Injection (Highly persistent)
        cssRules += `.timeless-promise-template ${selector} { 
            background-image: url("${resolved}") !important; 
            background-position: center center !important; 
            background-size: cover !important; 
        }\n`;

        // Strategy B: DOM direct manipulation
        const node = root.querySelector(selector);
        if (node) {
            node.style.setProperty("background-image", `url("${resolved}")`, "important");
            node.style.setProperty("background-position", "center center", "important");
            node.style.setProperty("background-size", "cover", "important");
        }
    });
    forceStyle.textContent = cssRules;
}

function renderWishList(listElement, wishes) {
    if (!listElement) return;
    listElement.innerHTML = "";

    const items = Array.isArray(wishes) ? wishes : [];
    items.forEach((wish) => {
        const item = document.createElement("li");
        item.className = "cui-item-comment";
        const metaParts = [];
        if (wish?.createdAt) metaParts.push(escapeHtml(formatWishRelativeTime(wish.createdAt)));
        if (wish?.attendance && wish.attendance !== "-") metaParts.push(escapeHtml(wish.attendance));
        const metaText = metaParts.join(", ") || "Baru saja";
        item.innerHTML = `
      <div class="cui-comment-content tp-wish-card">
        <div class="cui-comment-name tp-wish-name">${escapeHtml(wish.author || "Tamu")}</div>
        <div class="cui-comment-text tp-wish-text">${escapeHtml(wish.comment || "")}</div>
        <div class="cui-comment-meta tp-wish-meta">
          <span class="tp-wish-clock" aria-hidden="true">◷</span>
          <span class="tp-wish-meta-text">${metaText}</span>
        </div>
      </div>
    `;
        listElement.appendChild(item);
    });
}

function SimpleLightbox({ open, slides, index, onClose, onIndexChange }) {
    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowRight") onIndexChange((prev) => (prev + 1) % slides.length);
            if (event.key === "ArrowLeft") onIndexChange((prev) => (prev - 1 + slides.length) % slides.length);
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, slides.length, onClose, onIndexChange]);

    if (!open || slides.length === 0) return null;

    const activeSlide = slides[index];
    if (!activeSlide) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2000,
                background: "rgba(0, 0, 0, 0.88)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={onClose}
        >
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onClose();
                }}
                style={{
                    position: "absolute",
                    top: 12,
                    right: 14,
                    border: 0,
                    borderRadius: 999,
                    width: 40,
                    height: 40,
                    fontSize: 24,
                    cursor: "pointer",
                }}
                aria-label="Close"
            >
                ×
            </button>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onIndexChange((prev) => (prev - 1 + slides.length) % slides.length);
                }}
                style={{
                    position: "absolute",
                    left: 10,
                    border: 0,
                    borderRadius: 999,
                    width: 44,
                    height: 44,
                    fontSize: 24,
                    cursor: "pointer",
                }}
                aria-label="Previous image"
            >
                ‹
            </button>
            <img
                src={activeSlide.src}
                alt=""
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12 }}
                onClick={(event) => event.stopPropagation()}
            />
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onIndexChange((prev) => (prev + 1) % slides.length);
                }}
                style={{
                    position: "absolute",
                    right: 10,
                    border: 0,
                    borderRadius: 999,
                    width: 44,
                    height: 44,
                    fontSize: 24,
                    cursor: "pointer",
                }}
                aria-label="Next image"
            >
                ›
            </button>
        </div>
    );
}

export default function TimelessPromiseTemplate({
    data: externalData,
    invitationSlug = "timeless-promise",
    mode = "live",
    onSubmitWish,
    onFetchWishes,
}) {
    const { data: fetchedData, loading } = useInvitationData(invitationSlug, {
        fallbackSlug: "timeless-promise",
        skipFetch: Boolean(externalData),
    });

    const [opened, setOpened] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxSlides, setLightboxSlides] = useState([]);
    const [ready, setReady] = useState(false);

    const rootRef = useRef(null);
    const audioRef = useRef(null);
    const wasPlayingOnHiddenRef = useRef(false);
    const isInitializedRef = useRef(false);

    const sourceArtifacts = useMemo(() => parseSourceArtifacts(sourceHtml), []);

    const mergedData = useMemo(() => {
        const incoming = externalData || fetchedData || contentDefaults;
        return mergeInvitationData(defaultSchema, incoming);
    }, [externalData, fetchedData]);

    const guest = mergedData?.guest;
    const couple = mergedData?.couple;
    const event = mergedData?.event;
    const copy = mergedData?.copy;
    const lovestory = mergedData?.lovestory;
    const gallery = mergedData?.gallery;
    const features = mergedData?.features;
    const gift = mergedData?.gift;

    const behavior = useMemo(() => {
        return {
            ...behaviorDefaults,
            ...(mergedData?.behavior || {}),
            audio: { ...behaviorDefaults.audio, ...(mergedData?.behavior?.audio || {}) },
            countdown: { ...behaviorDefaults.countdown, ...(mergedData?.behavior?.countdown || {}) },
            cover: { ...behaviorDefaults.cover, ...(mergedData?.behavior?.cover || {}) },
            gift: { ...behaviorDefaults.gift, ...(mergedData?.behavior?.gift || {}) },
            copy: { ...behaviorDefaults.copy, ...(mergedData?.behavior?.copy || {}) },
            lightbox: { ...behaviorDefaults.lightbox, ...(mergedData?.behavior?.lightbox || {}) },
            motionText: { ...behaviorDefaults.motionText, ...(mergedData?.behavior?.motionText || {}) },
            viewportVh: { ...behaviorDefaults.viewportVh, ...(mergedData?.behavior?.viewportVh || {}) },
            wishes: { ...behaviorDefaults.wishes, ...(mergedData?.behavior?.wishes || {}) },
        };
    }, [mergedData]);

    const initialWishes = useMemo(() => (Array.isArray(mergedData?.wishes?.initial) ? mergedData.wishes.initial : contentDefaults.wishes?.initial || []), [mergedData]);
    const [wishes, setWishes] = useState(() => initialWishes);
    const [submittingWish, setSubmittingWish] = useState(false);
    const [wishFormState, setWishFormState] = useState({ author: "", comment: "", attendance: "" });

    useEffect(() => {
        BODY_CLASSES.forEach((className) => document.body.classList.add(className));
        return () => {
            BODY_CLASSES.forEach((className) => document.body.classList.remove(className));
        };
    }, []);

    useEffect(() => {
        if (!behavior.aos) return undefined;

        AOS.init({
            duration: tokens.aos.duration,
            offset: tokens.aos.offset,
            easing: tokens.aos.easing,
            once: tokens.aos.once,
            mirror: tokens.aos.mirror,
            debounceDelay: tokens.aos.debounceDelay,
        });

        return undefined;
    }, [behavior.aos]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        if (isInitializedRef.current) return;

        // 1. Inject Markup
        root.innerHTML = sourceArtifacts.markup;
        isInitializedRef.current = true;

        // 2. Apply Data
        applyInvitationData(root, mergedData);

        // 3. Reveal
        root.querySelectorAll(".elementor-invisible").forEach((node) => {
            node.classList.remove("elementor-invisible");
        });
        root.querySelectorAll(".e-con.e-parent").forEach((node) => {
            node.classList.add("e-lazyloaded");
        });

        // 4. Finalize
        setReady(true);
    }, [sourceArtifacts.markup, mergedData]);

    useEffect(() => {
        const styleNodes = [];
        sourceArtifacts.styleSequence.forEach((entry) => {
            if (entry.type === "link") {
                const href = resolveAssetUrl(entry.href || "");
                if (!href) return;
                const link = document.createElement("link");
                link.setAttribute("rel", "stylesheet");
                link.setAttribute("href", href);
                link.setAttribute("data-tp-style", "1");
                document.head.appendChild(link);
                styleNodes.push(link);
                return;
            }
            const style = document.createElement("style");
            style.setAttribute("data-tp-inline-style", "1");
            style.textContent = rewriteCssAssetUrls(entry.css || "");
            document.head.appendChild(style);
            styleNodes.push(style);
        });

        return () => {
            styleNodes.forEach((node) => {
                if (node.parentNode) node.parentNode.removeChild(node);
            });
        };
    }, [sourceArtifacts.styleSequence]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;

        root.querySelectorAll("[src], [href], [poster], [data-thumbnail], [srcset], [style]").forEach((node) => {
            ["src", "href", "poster", "data-thumbnail"].forEach((attribute) => {
                if (!node.hasAttribute(attribute)) return;
                const value = node.getAttribute(attribute);
                // IF it's already a full URL, don't try to re-resolve it
                if (/^(https?:|data:|blob:)/i.test(value || "")) return;

                const nextValue = resolveAssetUrl(value || "");
                if (nextValue && nextValue !== value) {
                    node.setAttribute(attribute, nextValue);
                }
            });

            if (node.hasAttribute("srcset")) {
                const srcset = node.getAttribute("srcset") || "";
                if (!/^(https?:|data:|blob:)/i.test(srcset)) {
                    node.setAttribute("srcset", rewriteSrcsetValue(srcset));
                }
            }

            if (node.hasAttribute("style")) {
                const styleValue = node.getAttribute("style") || "";
                node.setAttribute("style", rewriteInlineStyleValue(styleValue));
            }
        });

        // Elementor gallery thumbnails rely on Elementor runtime JS to map data-thumbnail
        // into background-image. Set it explicitly so thumbnails are visible in React mode.
        root.querySelectorAll(".e-gallery-image[data-thumbnail]").forEach((node) => {
            const thumbnail = node.getAttribute("data-thumbnail");
            const resolved = resolveAssetUrl(thumbnail || "");
            if (!resolved) return;

            node.style.backgroundImage = `url("${resolved}")`;
            if (!node.style.backgroundSize) node.style.backgroundSize = "cover";
            if (!node.style.backgroundPosition) node.style.backgroundPosition = "center center";
        });

        const galleryContainers = root.querySelectorAll(".elementor-gallery__container");
        const applyGalleryFallbackLayout = () => {
            const columns = window.innerWidth <= 520 ? 2 : 3;
            galleryContainers.forEach((container) => {
                container.style.display = "grid";
                container.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
                container.style.gap = "10px";
                container.style.paddingBottom = "0";
                container.style.position = "relative";
            });

            root.querySelectorAll(".elementor-gallery__container .e-gallery-item").forEach((item) => {
                item.style.position = "relative";
                item.style.width = "100%";
                item.style.height = "auto";
                item.style.top = "auto";
                item.style.left = "auto";
                item.style.right = "auto";
            });

            root.querySelectorAll(".elementor-gallery__container .e-gallery-image").forEach((node) => {
                const width = Number(node.getAttribute("data-width")) || 4;
                const height = Number(node.getAttribute("data-height")) || 5;
                const ratioPercent = (height / width) * 100;

                node.style.display = "block";
                node.style.width = "100%";
                node.style.height = "0";
                node.style.paddingBottom = `${ratioPercent}%`;
            });
        };

        applyGalleryFallbackLayout();

        // Ensure digital-envelope headings stay visible even without full Elementor animation runtime.
        root.querySelectorAll(".elementor-element-5f53c68c, .elementor-element-79395a37, #klik").forEach((node) => {
            node.classList.add("active");
        });
        root.querySelectorAll(".elementor-element-5f53c68c .elementor-heading-title, .elementor-element-79395a37 .elementor-heading-title").forEach((node) => {
            node.style.opacity = "1";
            node.style.visibility = "visible";
            node.style.color = "#FFFFFF";
        });
        root.querySelectorAll("#amplop .elementor-heading-title, #amplop p").forEach((node) => {
            node.style.opacity = "1";
            node.style.visibility = "visible";
            node.style.color = "#5F2424";
        });
        root.querySelectorAll("#klik, #klik .elementor-widget-container, #klik .elementor-button-wrapper, #klik .elementor-button").forEach((node) => {
            node.style.opacity = "1";
            node.style.visibility = "visible";
            if (node.id === "klik") {
                node.style.display = "block";
            }
        });
        const giftButtonFallbackStyle = document.createElement("style");
        giftButtonFallbackStyle.textContent = `
          #klik .elementor-button,
          #klik .elementor-button:hover,
          #klik .elementor-button:focus {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            background-image: linear-gradient(180deg, #7A3B3B 0%, #46010F 100%) !important;
            background-color: #46010F !important;
            color: #FFFFFF !important;
            border: 1px solid #FFFFFF !important;
            border-radius: 20px !important;
            padding: 10px 20px !important;
            cursor: pointer !important;
          }
          #klik .elementor-button .elementor-button-text,
          #klik .elementor-button .elementor-button-icon,
          #klik .elementor-button .elementor-button-icon i {
            color: #FFFFFF !important;
            fill: #FFFFFF !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
        `;
        root.appendChild(giftButtonFallbackStyle);

        const floatingUiStyle = document.createElement("style");
        floatingUiStyle.textContent = `
          .timeless-promise-template [data-tp-floating-nav] {
            position: fixed !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            bottom: 14px !important;
            z-index: 1250 !important;
            width: min(70%, 360px) !important;
            max-width: calc(100vw - 24px) !important;
            margin: 0 !important;
          }
          .timeless-promise-template [data-tp-audio-widget] {
            position: fixed !important;
            right: 14px !important;
            bottom: 92px !important;
            z-index: 1260 !important;
            width: auto !important;
            max-width: none !important;
            margin: 0 !important;
          }
          .timeless-promise-template [data-tp-audio-widget] #audio-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 999px;
            background: #5f2424;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
            cursor: pointer;
          }
          .timeless-promise-template [data-tp-audio-widget] #audio-container .elementor-icon {
            color: #ffffff !important;
          }
          .timeless-promise-template #cui-box {
            display: block !important;
            margin-top: 16px !important;
            padding-left: 15px !important;
            padding-right: 15px !important;
          }
          .timeless-promise-template #cui-container-comment-5816 {
            list-style: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .timeless-promise-template #cui-container-comment-5816 .cui-item-comment {
            border: 0 !important;
            background: transparent !important;
            margin: 0 0 20px !important;
            padding: 0 !important;
          }
          .timeless-promise-template #cui-container-comment-5816 .tp-wish-card {
            background: transparent !important;
          }
          .timeless-promise-template #cui-container-comment-5816 .tp-wish-name {
            color: #ffffff !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            line-height: 1.3 !important;
            margin: 0 0 8px !important;
          }
          .timeless-promise-template #cui-container-comment-5816 .tp-wish-text {
            color: #ffffff !important;
            font-size: 14px !important;
            font-weight: 400 !important;
            line-height: 1.5 !important;
            margin: 0 !important;
          }
          .timeless-promise-template #cui-container-comment-5816 .tp-wish-meta {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            margin-top: 8px !important;
            color: rgba(255, 255, 255, 0.95) !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            line-height: 1.3 !important;
          }
          .timeless-promise-template #cui-container-comment-5816 .tp-wish-clock {
            font-size: 13px !important;
            line-height: 1 !important;
          }
          .timeless-promise-template #cui-container-comment-5816 .tp-wish-reply {
            margin-left: 2px !important;
            color: #ffffff !important;
            font-weight: 700 !important;
          }
        `;
        root.appendChild(floatingUiStyle);

        const floatingNav = root.querySelector(".elementor-element-5169c5e6");
        if (floatingNav) {
            floatingNav.setAttribute("data-tp-floating-nav", "1");
            floatingNav.style.display = "none";
        }

        const audioWidget = root.querySelector(".elementor-element-1976a21f");
        if (audioWidget) {
            audioWidget.setAttribute("data-tp-audio-widget", "1");
            audioWidget.style.display = "none";
        }

        const audioContainer = root.querySelector("#audio-container");
        if (audioContainer) {
            audioContainer.style.display = "none";
        }

        const cleanups = [];
        const timers = [];
        let isOpened = false;
        let isAudioPlaying = false;

        const addCleanup = (fn) => {
            cleanups.push(fn);
        };

        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);
        };

        if (behavior.viewportVh.enabled) {
            setVh();
            window.addEventListener("resize", setVh);
            addCleanup(() => window.removeEventListener("resize", setVh));
        }

        window.addEventListener("resize", applyGalleryFallbackLayout);
        addCleanup(() => window.removeEventListener("resize", applyGalleryFallbackLayout));

        let bodyLocked = false;
        const previousBodyStyles = {
            position: document.body.style.position,
            height: document.body.style.height,
            left: document.body.style.left,
            right: document.body.style.right,
            overflowY: document.body.style.overflowY,
            overflowX: document.body.style.overflowX,
        };

        const lockBody = () => {
            bodyLocked = true;
            document.body.style.position = "fixed";
            document.body.style.height = "calc(var(--vh, 1vh) * 100)";
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.overflowY = "scroll";
            document.body.style.overflowX = "hidden";
        };

        const unlockBody = () => {
            bodyLocked = false;
            document.body.style.position = previousBodyStyles.position;
            document.body.style.height = previousBodyStyles.height;
            document.body.style.left = previousBodyStyles.left;
            document.body.style.right = previousBodyStyles.right;
            document.body.style.overflowY = previousBodyStyles.overflowY;
            document.body.style.overflowX = previousBodyStyles.overflowX;
        };

        const sec = root.querySelector("#sec");
        if (behavior.cover.lockScrollUntilOpen && sec && !opened) {
            lockBody();
        }

        const song = root.querySelector("#song");
        audioRef.current = song || null;
        if (song) {
            song.loop = mergedData?.audio?.loop ?? contentDefaults.audio.loop;
        }

        const muteSound = root.querySelector("#mute-sound");
        const unmuteSound = root.querySelector("#unmute-sound");

        const syncAudioIcons = () => {
            if (!muteSound || !unmuteSound) return;
            if (!opened) { // CHANGED: use component state 'opened' instead of local 'isOpened'
                muteSound.style.display = "none";
                unmuteSound.style.display = "none";
                return;
            }

            if (audioPlaying) { // CHANGED: use component state 'audioPlaying' instead of local 'isAudioPlaying'
                muteSound.style.display = "block";
                unmuteSound.style.display = "none";
            } else {
                muteSound.style.display = "none";
                unmuteSound.style.display = "block";
            }
        };

        const playAudio = async () => {
            if (!song || !behavior.audio.enabled) return;
            try {
                await song.play();
                isAudioPlaying = true;
                setAudioPlaying(true);
            } catch {
                isAudioPlaying = false;
                setAudioPlaying(false);
            }
        };

        const pauseAudio = () => {
            if (!song) return;
            song.pause();
            isAudioPlaying = false;
            setAudioPlaying(false);
        };

        const toggleAudio = async (event) => {
            event.preventDefault();
            if (!song || !isOpened) return;

            if (song.paused) {
                try {
                    await song.play();
                    isAudioPlaying = true;
                    setAudioPlaying(true);
                } catch {
                    isAudioPlaying = false;
                    setAudioPlaying(false);
                }
                return;
            }

            pauseAudio();
        };

        if (audioContainer) {
            audioContainer.addEventListener("click", toggleAudio);
            addCleanup(() => audioContainer.removeEventListener("click", toggleAudio));
        }

        const activateMotionText = () => {
            if (!behavior.motionText.enabled) return;
            const motionTexts = root.querySelectorAll(".motion-text");
            motionTexts.forEach((text, index) => {
                const timer = window.setTimeout(() => {
                    text.classList.add("active");
                }, index * behavior.motionText.staggerMs);
                timers.push(timer);
            });
        };

        const openTrigger = root.querySelector("#open");
        const coverColumn = root.querySelector("#kolom");
        const handleOpenInvitation = (event) => {
            event.preventDefault();
            if (isOpened) return;

            isOpened = true;
            setOpened(true);
            activateMotionText();
            if (floatingNav) floatingNav.style.display = "flex";
            if (audioWidget) audioWidget.style.display = "block";
            if (audioContainer) audioContainer.style.display = "flex";
            if (behavior.audio.autoplayOnOpen) {
                playAudio();
            }

            if (coverColumn) {
                coverColumn.style.cssText = "transform: translateY(-100%); transition: transform 1.5s ease-in-out;";
            }

            if (sec) {
                sec.style.cssText = "opacity: 0; transition: opacity 1.5s ease-in-out;";
                const timer = window.setTimeout(() => {
                    sec.style.visibility = "hidden";
                }, behavior.cover.closeTransitionMs);
                timers.push(timer);
            }

            unlockBody();

            const refreshTimer = window.setTimeout(() => {
                if (behavior.aos) {
                    AOS.refreshHard();
                }
            }, 360);
            timers.push(refreshTimer);
        };

        if (openTrigger) {
            openTrigger.addEventListener("click", handleOpenInvitation);
            addCleanup(() => openTrigger.removeEventListener("click", handleOpenInvitation));
        }

        const floatingNavLinks = root.querySelectorAll("[data-tp-floating-nav] a[href^='#']");
        floatingNavLinks.forEach((anchor) => {
            const handleNavClick = (event) => {
                const href = anchor.getAttribute("href") || "";
                if (!href || href === "#") return;
                const target = root.querySelector(href);
                if (!target) return;

                event.preventDefault();
                const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                target.scrollIntoView({
                    behavior: reduceMotion ? "auto" : "smooth",
                    block: "start",
                });
            };

            anchor.addEventListener("click", handleNavClick);
            addCleanup(() => anchor.removeEventListener("click", handleNavClick));
        });

        const handleVisibilityChange = () => {
            if (!behavior.audio.pauseOnHidden || !song) return;

            if (document.visibilityState === "hidden") {
                wasPlayingOnHiddenRef.current = !song.paused;
                if (!song.paused) {
                    song.pause();
                    isAudioPlaying = false;
                    setAudioPlaying(false);
                }
                return;
            }

            if (document.visibilityState === "visible" && wasPlayingOnHiddenRef.current && isOpened) {
                song
                    .play()
                    .then(() => {
                        isAudioPlaying = true;
                        setAudioPlaying(true);
                    })
                    .catch(() => {
                        isAudioPlaying = false;
                        setAudioPlaying(false);
                    });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        addCleanup(() => document.removeEventListener("visibilitychange", handleVisibilityChange));

        if (behavior.countdown.enabled) {
            const targetDate = mergedData?.event?.dateISO || "Mar 30 2025 10:00:00";
            const countdownNodes = root.querySelectorAll("ul.wpkoi-elements-countdown-items");
            countdownNodes.forEach((node) => {
                node.setAttribute("data-date", targetDate);
                updateCountdownNode(node, targetDate);
            });

            const interval = window.setInterval(() => {
                countdownNodes.forEach((node) => updateCountdownNode(node, targetDate));
            }, 1000);

            addCleanup(() => window.clearInterval(interval));
        }

        const giftButton = root.querySelector("#klik");
        const giftPanel = root.querySelector("#amplop");
        if (giftButton && giftPanel && behavior.gift.toggleEnabled) {
            if (behavior.gift.startHidden) {
                giftPanel.style.display = "none";
            } else {
                giftPanel.style.display = giftPanel.classList.contains("e-con") ? "flex" : "block";
            }

            const handleGiftToggle = (event) => {
                event.preventDefault();
                slideToggle(giftPanel, behavior.gift.toggleDurationMs);
                const timer = window.setTimeout(() => {
                    if (behavior.aos) {
                        AOS.refreshHard();
                    }
                }, behavior.gift.toggleDurationMs + 100);
                timers.push(timer);
            };

            giftButton.addEventListener("click", handleGiftToggle);
            addCleanup(() => giftButton.removeEventListener("click", handleGiftToggle));
        }

        const copyButtons = root.querySelectorAll(".elementor-widget-weddingpress-copy-text .elementor-button");
        copyButtons.forEach((button) => {
            button.removeAttribute("onclick");
            const handleCopy = async (event) => {
                event.preventDefault();

                const widget = button.closest(".elementor-widget-weddingpress-copy-text");
                const copyContent = widget?.querySelector(".copy-content");

                let targetText = normalizeText(copyContent?.textContent || "");
                if (!targetText) {
                    const card = widget?.closest(".e-con.e-child") || widget?.parentElement;
                    const accountNode = card
                        ? Array.from(card.querySelectorAll(".elementor-heading-title")).find((node) => /\d/.test(node.textContent || ""))
                        : null;
                    targetText = normalizeText(accountNode?.textContent || "");
                    if (copyContent && targetText) {
                        copyContent.textContent = targetText;
                    }
                }

                if (!targetText) return;

                const fallbackCopy = () => {
                    const textarea = document.createElement("textarea");
                    textarea.value = targetText;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                };

                if (navigator.clipboard?.writeText) {
                    try {
                        await navigator.clipboard.writeText(targetText);
                    } catch {
                        fallbackCopy();
                    }
                } else {
                    fallbackCopy();
                }

                const textNode = button.querySelector(".elementor-button-text");
                const feedbackText = button.getAttribute("data-message") || "berhasil disalin";
                if (textNode) {
                    const originalText = textNode.textContent;
                    textNode.textContent = feedbackText;
                    const timer = window.setTimeout(() => {
                        textNode.textContent = originalText;
                    }, behavior.copy.feedbackDurationMs);
                    timers.push(timer);
                }
            };

            button.addEventListener("click", handleCopy);
            addCleanup(() => button.removeEventListener("click", handleCopy));
        });

        if (behavior.reveal) {
            const revealSelector = ".ef, .reveal, .revealin, .revealkanan, .revealkiri, .revealatas, .revealr";
            const revealNodes = root.querySelectorAll(revealSelector);

            const observer = new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("active");
                            obs.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.15,
                    rootMargin: "0px 0px -60px 0px",
                }
            );

            revealNodes.forEach((node) => observer.observe(node));
            addCleanup(() => observer.disconnect());
        }

        if (behavior.lightbox.enabled) {
            const anchors = root.querySelectorAll("a[data-elementor-open-lightbox='yes']");
            anchors.forEach((anchor) => {
                anchor.removeAttribute("data-e-action-hash");

                const handleLightboxClick = (event) => {
                    event.preventDefault();
                    const group = anchor.getAttribute("data-elementor-lightbox-slideshow") || "default";
                    const groupSelector = `a[data-elementor-open-lightbox='yes'][data-elementor-lightbox-slideshow='${group}']`;
                    const groupAnchors = Array.from(root.querySelectorAll(groupSelector));
                    const slides = groupAnchors.map((item) => ({
                        src: item.getAttribute("href") || "",
                    }));
                    const index = Math.max(groupAnchors.indexOf(anchor), 0);

                    setLightboxSlides(slides);
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                };

                anchor.addEventListener("click", handleLightboxClick);
                addCleanup(() => anchor.removeEventListener("click", handleLightboxClick));
            });
        }

        const wishesList = root.querySelector("#cui-container-comment-5816");

        if (behavior.wishes.enabled) {
            const wishesLink = root.querySelector("#cui-link-5816");
            const wishesWrap = root.querySelector("#cui-wrap-commnent-5816");
            const wishesBox = root.querySelector("#cui-box");
            const wishForm = root.querySelector("#commentform-5816");

            if (wishesWrap) {
                wishesWrap.style.display = "block";
            }
            if (wishesBox) {
                wishesBox.style.display = "block";
                wishesBox.style.opacity = "1";
                wishesBox.style.visibility = "visible";
            }
            if (wishesList) {
                wishesList.style.display = "block";
                wishesList.style.opacity = "1";
                wishesList.style.visibility = "visible";
            }

            if (wishesLink && wishesWrap) {
                const focusWishes = (event) => {
                    event.preventDefault();
                    wishesWrap.style.display = "block";
                    const textarea = wishesWrap.querySelector("textarea[name='comment']");
                    textarea?.focus();
                };

                wishesLink.addEventListener("click", focusWishes);
                addCleanup(() => wishesLink.removeEventListener("click", focusWishes));
            }

            const initialWishes = contentDefaults.wishes?.initial || [];
            renderWishList(wishesList, initialWishes);

            if (typeof onFetchWishes === "function") {
                Promise.resolve(onFetchWishes())
                    .then((items) => {
                        if (Array.isArray(items) && items.length > 0) {
                            setWishes(items);
                        }
                    })
                    .catch(() => { });
            }

            if (wishForm) {
                wishForm.removeAttribute("action");
                wishForm.removeAttribute("method");
                const authorInput = wishForm.querySelector("#author");
                const commentInput = wishForm.querySelector("textarea[name='comment']");
                const attendanceInput = wishForm.querySelector("select[name='konfirmasi']");

                if (authorInput) {
                    authorInput.removeAttribute("readonly");
                    authorInput.removeAttribute("nofocus");
                    authorInput.value = wishFormState.author || (mode === "preview" ? mergedData?.guest?.name || "" : "");
                    authorInput.oninput = (e) => setWishFormState(prev => ({ ...prev, author: e.target.value }));
                }
                if (commentInput) {
                    commentInput.value = wishFormState.comment;
                    commentInput.oninput = (e) => setWishFormState(prev => ({ ...prev, comment: e.target.value }));
                }
                if (attendanceInput) {
                    attendanceInput.value = wishFormState.attendance;
                    attendanceInput.onchange = (e) => setWishFormState(prev => ({ ...prev, attendance: e.target.value }));
                }

                const errorInfoName = wishForm.querySelector(".cui-error-info-name");
                if (errorInfoName) errorInfoName.style.display = "none";

                const runtimeStyle = document.createElement("style");
                runtimeStyle.textContent = `
                    .timeless-promise-template .tp-submit-spinner {
                        display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.3);
                        border-top-color: #ffffff; border-radius: 50%; animation: tp-spin 0.6s linear infinite;
                        vertical-align: middle; margin-right: 6px;
                    }
                    @keyframes tp-spin { to { transform: rotate(360deg); } }
                    .timeless-promise-template #commentform-5816.is-submitting input,
                    .timeless-promise-template #commentform-5816.is-submitting textarea,
                    .timeless-promise-template #commentform-5816.is-submitting select,
                    .timeless-promise-template #commentform-5816.is-submitting button {
                        opacity: 0.6; pointer-events: none !important; cursor: not-allowed !important;
                    }
                `;
                root.appendChild(runtimeStyle);

                const handleWishSubmit = async (event) => {
                    event.preventDefault();
                    if (submittingWish) return;

                    const payload = {
                        author: normalizeText(wishFormState.author || mergedData?.guest?.name || "Tamu"),
                        comment: normalizeText(wishFormState.comment || ""),
                        attendance: normalizeText(wishFormState.attendance || "-"),
                        createdAt: new Date().toISOString(),
                    };

                    if (!payload.comment) return;

                    setSubmittingWish(true);
                    wishForm.classList.add("is-submitting");
                    const formInputs = wishForm.querySelectorAll("input, textarea, select, button");
                    formInputs.forEach((el) => { el.disabled = true; });

                    const submitBtn = wishForm.querySelector("button[type='submit'], input[type='submit']");
                    let originalBtnContent = "";
                    if (submitBtn) {
                        originalBtnContent = submitBtn.innerHTML || submitBtn.value;
                        if (submitBtn.tagName === "INPUT") submitBtn.value = "Mengirim...";
                        else submitBtn.innerHTML = '<span class="tp-submit-spinner"></span> Mengirim...';
                    }

                    try {
                        await postInvitationWish("timeless-promise", payload);
                        setWishes(prev => [payload, ...prev]);
                        setWishFormState({ author: "", comment: "", attendance: "" });
                        wishForm.reset();
                        if (authorInput && mode === "preview") authorInput.value = mergedData?.guest?.name || "";
                    } catch {
                    } finally {
                        setSubmittingWish(false);
                        wishForm.classList.remove("is-submitting");
                        formInputs.forEach((el) => { el.disabled = false; });
                        if (submitBtn) {
                            if (submitBtn.tagName === "INPUT") submitBtn.value = originalBtnContent;
                            else submitBtn.innerHTML = originalBtnContent;
                        }
                    }
                };

                wishForm.addEventListener("submit", handleWishSubmit);
                addCleanup(() => wishForm.removeEventListener("submit", handleWishSubmit));
            }
        }

        const refreshTimer = window.setTimeout(() => {
            if (behavior.aos) {
                AOS.refreshHard();
            }
        }, 400);
        timers.push(refreshTimer);

        renderWishList(wishesList, wishes);

        if (opened) {
            isOpened = true;
            isAudioPlaying = audioPlaying;
            if (floatingNav) floatingNav.style.display = "flex";
            if (audioWidget) audioWidget.style.display = "block";
            if (audioContainer) audioContainer.style.display = "flex";

            if (coverColumn) {
                coverColumn.style.display = "none";
            }
            if (sec) {
                sec.style.display = "none";
            }
            unlockBody();
            activateMotionText();
        }

        return () => {
            timers.forEach(window.clearTimeout);
            cleanups.forEach((fn) => {
                if (typeof fn === "function") fn();
            });
            if (bodyLocked) {
                unlockBody();
            }

            audioRef.current = null;
        };
    }, [mergedData, behavior, mode, onFetchWishes, onSubmitWish]);

    useEffect(() => {
        const root = rootRef.current;
        const wishesList = root?.querySelector("#cui-container-comment-5816");
        if (wishesList) {
            renderWishList(wishesList, wishes);
        }
    }, [wishes]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const floatingNav = root.querySelector("[data-tp-floating-nav]");
        const audioWidget = root.querySelector("[data-tp-audio-widget]");
        const audioContainer = root.querySelector("#audio-container");
        const muteSound = root.querySelector("#mute-sound");
        const unmuteSound = root.querySelector("#unmute-sound");

        if (floatingNav) {
            floatingNav.style.display = opened ? "flex" : "none";
        }
        if (audioWidget) {
            audioWidget.style.display = opened ? "block" : "none";
        }
        if (audioContainer) {
            audioContainer.style.display = opened ? "flex" : "none";
        }

        if (!muteSound || !unmuteSound) return;

        if (!opened) {
            muteSound.style.display = "none";
            unmuteSound.style.display = "none";
            return;
        }

        if (audioPlaying) {
            muteSound.style.display = "block";
            unmuteSound.style.display = "none";
        } else {
            muteSound.style.display = "none";
            unmuteSound.style.display = "block";
        }
    }, [opened, audioPlaying]);

    if (loading && !mergedData && !externalData) {
        return (
            <div
                className="timeless-promise-template-loading"
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fdf8f4",
                    color: "#5f2424",
                    fontFamily: "serif",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div className="tp-loading-spinner" style={{
                        display: "inline-block",
                        width: 40,
                        height: 40,
                        border: "4px solid rgba(95, 36, 36, 0.2)",
                        borderTopColor: "#5f2424",
                        borderRadius: "50%",
                        animation: "tp-spin 0.6s linear infinite"
                    }}></div>
                    <p style={{ marginTop: 16, fontSize: 18, letterSpacing: 1 }}>Memuat Undangan...</p>
                    <style>{`
                        @keyframes tp-spin { to { transform: rotate(360deg); } }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="timeless-promise-template"
                ref={rootRef}
                style={{ visibility: ready ? "visible" : "hidden", opacity: ready ? 1 : 0 }}
            />

            <SimpleLightbox
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                index={lightboxIndex}
                slides={lightboxSlides}
                onIndexChange={setLightboxIndex}
            />
        </>
    );
}
