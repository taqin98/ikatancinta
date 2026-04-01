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
    "page-id-14805",
    "wp-embed-responsive",
    "wp-theme-hello-elementor",
    "hello-elementor-default",
    "elementor-default",
    "elementor-template-canvas",
    "elementor-kit-5",
    "elementor-page",
    "elementor-page-14805",
];

const APP_BASE_URL = import.meta.env.BASE_URL || "/";
const normalizedBaseUrl = APP_BASE_URL.endsWith("/") ? APP_BASE_URL : `${APP_BASE_URL}/`;
const PUBLIC_ASSET_PREFIX = `${normalizedBaseUrl}templates/basic/navy-blossom/assets/`;

const REMOTE_UPLOADS_REGEX = /https?:\/\/inv\.rumahundangan\.id\/wp-content\/uploads\/[^/]+\/[^/]+\/([^/?#"')]+)/i;
const GENERIC_UPLOADS_REGEX = /https?:\/\/[^/]+\/wp-content\/uploads\/[^/]+\/[^/]+\/([^/?#"')]+)/i;
const PARTICLES_KOLOM_CONFIG = {
    particles: {
        number: { value: 24, density: { enable: true, value_area: 3393.3348590187725 } },
        color: { value: "#ffffff" },
        shape: {
            type: "circle",
            stroke: { width: 0, color: "#000" },
            polygon: { nb_sides: 6 },
            image: { src: "img/github.svg", width: 100, height: 100 },
        },
        opacity: { value: 0.6155351604731727, random: true, anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false } },
        size: { value: 19.728691040806815, random: false, anim: { enable: true, speed: 10, size_min: 40, sync: false } },
        line_linked: { enable: false, distance: 200, color: "#ffffff", opacity: 1, width: 2 },
        move: {
            enable: true,
            speed: 4,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: { enable: false, rotateX: 600, rotateY: 1200 },
        },
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: false, mode: "grab" },
            onclick: { enable: false, mode: "push" },
            resize: true,
        },
        modes: {
            grab: { distance: 400, line_linked: { opacity: 1 } },
            bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
            repulse: { distance: 200, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 },
        },
    },
    retina_detect: true,
};

const PARTICLES_HERO_CONFIG = {
    particles: {
        number: { value: 152, density: { enable: true, value_area: 800 } },
        color: { value: "#fff" },
        shape: {
            type: "circle",
            stroke: { width: 0, color: "#000000" },
            polygon: { nb_sides: 5 },
            image: { src: "img/github.svg", width: 100, height: 100 },
        },
        opacity: { value: 0.5, random: true, anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false } },
        size: { value: 10, random: true, anim: { enable: false, speed: 40, size_min: 0.1, sync: false } },
        line_linked: { enable: false, distance: 500, color: "#ffffff", opacity: 0.4, width: 2 },
        move: {
            enable: true,
            speed: 1.5782952832645452,
            direction: "bottom",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: { enable: false, rotateX: 600, rotateY: 1200 },
        },
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: true, mode: "bubble" },
            onclick: { enable: true, mode: "repulse" },
            resize: true,
        },
        modes: {
            grab: { distance: 400, line_linked: { opacity: 0.5 } },
            bubble: { distance: 400, size: 4, duration: 0.3, opacity: 1, speed: 3 },
            repulse: { distance: 200, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 },
        },
    },
    retina_detect: true,
};

function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function resolveAssetUrl(path) {
    if (!path || typeof path !== "string") return path;

    if (/^(data:|blob:|#|mailto:|tel:|javascript:)/i.test(path)) {
        return path;
    }

    const remoteMatch = path.match(REMOTE_UPLOADS_REGEX) || path.match(GENERIC_UPLOADS_REGEX);
    if (remoteMatch?.[1]) {
        const fileName = remoteMatch[1];
        if (/\.json$/i.test(fileName)) {
            return `${PUBLIC_ASSET_PREFIX}data/${fileName}`;
        }
        return `${PUBLIC_ASSET_PREFIX}images/${fileName}`;
    }

    if (/^https?:/i.test(path)) {
        return path;
    }

    const normalized = path
        .replace(/^\.\//, "")
        .replace(/^\//, "")
        .replace(/\\/g, "/");

    if (normalized.startsWith("assets/")) {
        return `${PUBLIC_ASSET_PREFIX}${normalized.slice("assets/".length)}`;
    }

    return path;
}

function rewriteCssAssetUrls(cssText) {
    if (!cssText) return "";
    return cssText.replace(/url\((['"]?)([^'"()]+)\1\)/g, (_, quote, assetPath) => {
        const resolved = resolveAssetUrl(assetPath);
        const safeQuote = quote || '"';
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
            return descriptor.length ? `${resolved} ${descriptor.join(" ")}` : resolved;
        })
        .join(", ");
}

function rewriteInlineStyleValue(styleValue) {
    if (!styleValue) return styleValue;
    return rewriteCssAssetUrls(styleValue);
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
    bodyClone.querySelectorAll("script, style, meta").forEach((node) => node.remove());

    return {
        styleSequence,
        markup: bodyClone.innerHTML,
    };
}

function safeParseJson(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function rewriteDataSettings(dataSettingsValue) {
    const parsed = safeParseJson(dataSettingsValue);
    if (!parsed) return dataSettingsValue;

    const rewriteDeep = (value) => {
        if (typeof value === "string") {
            return resolveAssetUrl(value);
        }

        if (Array.isArray(value)) {
            return value.map(rewriteDeep);
        }

        if (value && typeof value === "object") {
            return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, rewriteDeep(inner)]));
        }

        return value;
    };

    try {
        return JSON.stringify(rewriteDeep(parsed));
    } catch {
        return dataSettingsValue;
    }
}

function toInstagramUrl(handle) {
    if (!handle) return "https://instagram.com";
    return `https://instagram.com/${String(handle).replace(/^@/, "")}`;
}

function normalizeCountdownTarget(eventData, fallbackEventData = {}) {
    const candidateValues = [
        eventData?.dateISO,
        fallbackEventData?.dateISO,
    ].filter(Boolean);

    for (const candidate of candidateValues) {
        const parsed = new Date(candidate);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString();
        }
    }

    const rawDate = eventData?.akad?.date || fallbackEventData?.akad?.date || "";
    const rawTime = eventData?.akad?.time || fallbackEventData?.akad?.time || "";
    const timeMatch = String(rawTime).match(/(\d{1,2})[:.](\d{2})/);
    const normalizedTime = timeMatch ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}` : "09:00";

    if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))) {
        return `${rawDate}T${normalizedTime}:00+07:00`;
    }

    const parsedDate = new Date(rawDate);
    if (!Number.isNaN(parsedDate.getTime())) {
        parsedDate.setHours(Number(normalizedTime.slice(0, 2)), Number(normalizedTime.slice(3, 5)), 0, 0);
        return parsedDate.toISOString();
    }

    return fallbackEventData?.dateISO || "";
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
        if (display === "none") display = element.classList.contains("e-con") ? "flex" : "block";
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
        audio: {
            ...baseSchema.audio,
            ...(incomingData.audio || {}),
        },
        wishes: {
            ...baseSchema.wishes,
            ...(incomingData.wishes || {}),
            initial: Array.isArray(incomingData.wishes?.initial)
                ? incomingData.wishes.initial
                : baseSchema.wishes?.initial || [],
        },
        behavior: {
            ...behaviorDefaults,
            ...(incomingData.behavior || {}),
        },
        lovestory: Array.isArray(incomingData.lovestory) ? incomingData.lovestory : baseSchema.lovestory,
        gallery: Array.isArray(incomingData.gallery) ? incomingData.gallery : baseSchema.gallery,
    };
}

function formatEventDateParts(dateInput) {
    const date = new Date(dateInput);
    if (!Number.isNaN(date.getTime())) {
        const dayName = date.toLocaleDateString("id-ID", { weekday: "long" });
        const month = date.toLocaleDateString("id-ID", { month: "long" });
        const year = date.getFullYear();
        const dayNumber = String(date.getDate()).padStart(2, "0");
        return {
            dayNumber,
            dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            month: month.charAt(0).toUpperCase() + month.slice(1),
            year: String(year),
        };
    }

    const text = normalizeText(dateInput);
    const match = text.match(/([A-Za-zÀ-ÿ]+),?\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
    if (match) {
        return {
            dayNumber: String(match[2]).padStart(2, "0"),
            dayName: match[1],
            month: match[3],
            year: match[4],
        };
    }

    return { dayNumber: "30", dayName: "Minggu", month: "Maret", year: "2025" };
}

function toParagraphsHtml(value) {
    const lines = String(value || "")
        .split("\n")
        .map((line) => normalizeText(line))
        .filter(Boolean);

    if (lines.length === 0) return "";
    return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function buildLocationHtml(venueName, addressText, fallbackText = "") {
    const resolvedVenueName = normalizeText(venueName);
    const resolvedAddress = normalizeText(addressText || fallbackText);

    if (resolvedVenueName && resolvedAddress) {
        return `<p><strong>${escapeHtml(resolvedVenueName)}</strong><br>${escapeHtml(resolvedAddress).replace(/,\s*/g, "<br>")}</p>`;
    }

    if (resolvedVenueName) {
        return `<p><strong>${escapeHtml(resolvedVenueName)}</strong></p>`;
    }

    if (!resolvedAddress) return "";
    return `<p>${escapeHtml(resolvedAddress).replace(/,\s*/g, "<br>")}</p>`;
}

function parseEventDateTime(dateValue, timeValue, fallbackDateValue = "") {
    const directDate = new Date(dateValue || fallbackDateValue);
    if (!Number.isNaN(directDate.getTime())) {
        return directDate;
    }

    const text = normalizeText(dateValue || fallbackDateValue);
    if (!text) return null;

    const monthMap = {
        januari: 0,
        februari: 1,
        maret: 2,
        april: 3,
        mei: 4,
        juni: 5,
        juli: 6,
        agustus: 7,
        september: 8,
        oktober: 9,
        november: 10,
        desember: 11,
    };

    const match = text.match(/(?:[A-Za-zÀ-ÿ]+,\s*)?(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/i);
    if (!match) return null;

    const day = Number(match[1]);
    const monthName = normalizeText(match[2]).toLowerCase();
    const month = monthMap[monthName];
    const year = Number(match[3]);
    if (!Number.isFinite(day) || !Number.isFinite(year) || month === undefined) {
        return null;
    }

    const timeMatch = normalizeText(timeValue).match(/(\d{1,2})[.:](\d{2})/);
    const hours = timeMatch ? Number(timeMatch[1]) : 0;
    const minutes = timeMatch ? Number(timeMatch[2]) : 0;

    return new Date(year, month, day, hours, minutes, 0, 0);
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

function downloadCalendarReminder({ title, startDate, location, description, fileName }) {
    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) return;

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const uid = `${startDate.getTime()}-${normalizeText(fileName || "event").replace(/\s+/g, "-").toLowerCase()}@ikatancinta`;
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Ikatan Cinta//NavyBlossom//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatIcsDateLocal(new Date())}`,
        `DTSTART:${formatIcsDateLocal(startDate)}`,
        `DTEND:${formatIcsDateLocal(endDate)}`,
        `SUMMARY:${escapeIcsText(title)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        `LOCATION:${escapeIcsText(location)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(`Pengingat ${title}`)}`,
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "save-the-date.ics";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
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

function applyClassicBackground(node, imageUrl, position = "center center") {
    const resolved = resolveAssetUrl(imageUrl);
    if (!node || !resolved) return;

    node.style.backgroundImage = `url("${resolved}")`;
    node.style.backgroundSize = "cover";
    node.style.backgroundPosition = position;

    const settings = safeParseJson(node.getAttribute("data-settings") || "") || {};
    settings.background_background = "classic";
    delete settings.background_slideshow_gallery;
    node.setAttribute("data-settings", JSON.stringify(settings));
}

function applySlideshowBackground(node, imageUrls, position = "center center") {
    const resolvedUrls = (Array.isArray(imageUrls) ? imageUrls : [imageUrls])
        .map((url) => resolveAssetUrl(url))
        .filter(Boolean);

    if (!node || !resolvedUrls.length) return;

    node.style.backgroundImage = `url("${resolvedUrls[0]}")`;
    node.style.backgroundSize = "cover";
    node.style.backgroundPosition = position;

    const settings = safeParseJson(node.getAttribute("data-settings") || "") || {};
    settings.background_background = resolvedUrls.length > 1 ? "slideshow" : "classic";
    settings.background_slideshow_gallery = resolvedUrls.map((url, index) => ({ id: index + 1, url }));
    node.setAttribute("data-settings", JSON.stringify(settings));
}

function applyWidgetImage(node, imageUrl) {
    const resolved = resolveAssetUrl(imageUrl);
    if (!node || !resolved) return;

    const image = node.matches("img") ? node : node.querySelector("img");
    if (!image) return;

    image.setAttribute("src", resolved);
    image.setAttribute("data-lazy-src", resolved);
    image.removeAttribute("srcset");
}

function applyCarouselImages(root, selector, imageUrls) {
    const resolvedUrls = (Array.isArray(imageUrls) ? imageUrls : [imageUrls])
        .map((url) => resolveAssetUrl(url))
        .filter(Boolean);

    if (!resolvedUrls.length) return;

    root.querySelectorAll(`${selector} .elementor-carousel-image`).forEach((node, index) => {
        const nextUrl = resolvedUrls[index % resolvedUrls.length];
        node.style.backgroundImage = `url("${nextUrl}")`;
        node.style.backgroundSize = "cover";
        node.style.backgroundPosition = "center center";
        node.setAttribute("aria-label", `Photo ${index + 1}`);
    });
}

function applyInvitationData(root, invitationData, options = {}) {
    const guest = invitationData?.guest || defaultSchema.guest;
    const bride = invitationData?.couple?.bride || defaultSchema.couple.bride;
    const groom = invitationData?.couple?.groom || defaultSchema.couple.groom;
    const event = invitationData?.event || defaultSchema.event;
    const copy = invitationData?.copy || defaultSchema.copy;
    const features = invitationData?.features || defaultSchema.features;
    const disableLockedBasicSections = Boolean(options?.disableLockedBasicSections);
    const frontCoverPhoto = invitationData?.couple?.frontCoverPhoto || invitationData?.couple?.heroPhoto || "";
    const heroPhoto = invitationData?.couple?.heroPhoto || invitationData?.couple?.frontCoverPhoto || "";
    const isDistinctAsset = (candidate, ...fallbacks) => {
        const normalizedCandidate = normalizeText(candidate);
        if (!normalizedCandidate) return false;

        return fallbacks.every((fallback) => {
            const normalizedFallback = normalizeText(fallback);
            return !normalizedFallback || normalizedFallback !== normalizedCandidate;
        });
    };

    const bridePhoto = isDistinctAsset(bride?.photo, heroPhoto, frontCoverPhoto) ? bride.photo : "";
    const groomPhoto = isDistinctAsset(groom?.photo, heroPhoto, frontCoverPhoto, bride?.photo) ? groom.photo : "";
    const akadCoverPhoto = isDistinctAsset(event?.akad?.coverPhoto, heroPhoto, frontCoverPhoto) ? event.akad.coverPhoto : "";
    const resepsiCoverPhoto = isDistinctAsset(event?.resepsi?.coverPhoto, heroPhoto, frontCoverPhoto, akadCoverPhoto)
        ? event.resepsi.coverPhoto
        : "";
    const closingBackgroundPhoto = isDistinctAsset(copy?.closingBackgroundPhoto, heroPhoto, frontCoverPhoto)
        ? copy.closingBackgroundPhoto
        : "";
    const saveTheDateBackgroundPhoto = isDistinctAsset(copy?.saveTheDateBackgroundPhoto, heroPhoto, frontCoverPhoto)
        ? copy.saveTheDateBackgroundPhoto
        : "";
    const wishesBackgroundPhoto = isDistinctAsset(copy?.wishesBackgroundPhoto, heroPhoto, frontCoverPhoto, saveTheDateBackgroundPhoto)
        ? copy.wishesBackgroundPhoto
        : "";
    const saveTheDatePhoto = saveTheDateBackgroundPhoto || heroPhoto || frontCoverPhoto || "";
    const wishesPhoto = wishesBackgroundPhoto || heroPhoto || frontCoverPhoto || "";
    const closingPhoto = closingBackgroundPhoto || heroPhoto || frontCoverPhoto || "";
    const story = Array.isArray(invitationData?.lovestory) && invitationData.lovestory.length
        ? invitationData.lovestory
        : contentDefaults.lovestory;

    const replaceExactText = (selector, fromText, toText) => {
        const fromNormalized = normalizeText(fromText);
        root.querySelectorAll(selector).forEach((node) => {
            if (normalizeText(node.textContent) === fromNormalized) {
                node.textContent = toText;
            }
        });
    };

    const textSelector = ".elementor-widget-container p, .elementor-heading-title";
    const livestreamSection = root.querySelector(".elementor-element-46e3d068");
    const loveStorySection = root.querySelector(".elementor-element-5387f9cf");
    const weddingGiftSection = root.querySelector(".elementor-element-422b9190");
    const saveTheDateButton = root.querySelector(".elementor-element-7002ff54");

    const removeAdjacentSpacer = (node) => {
        const previous = node?.previousElementSibling;
        if (!previous) return;
        if (previous.classList.contains("elementor-widget-spacer")) {
            previous.remove();
        }
    };

    const setSectionAvailability = (section, enabled) => {
        if (!section) return;

        if (!enabled) {
            if (disableLockedBasicSections) {
                removeAdjacentSpacer(section);
                section.remove();
                return;
            }

            section.style.display = "none";
            section.setAttribute("aria-hidden", "true");
            section.setAttribute("inert", "");
            return;
        }

        section.style.removeProperty("display");
        section.removeAttribute("aria-hidden");
        section.removeAttribute("inert");
    };

    setSectionAvailability(livestreamSection, Boolean(features?.livestreamEnabled && event?.livestream?.url));
    setSectionAvailability(loveStorySection, disableLockedBasicSections ? false : story.length > 0);
    setSectionAvailability(weddingGiftSection, disableLockedBasicSections ? false : Boolean(features?.digitalEnvelopeEnabled));
    setSectionAvailability(saveTheDateButton, Boolean(features?.saveTheDateEnabled));

    applyClassicBackground(root.querySelector(".elementor-element-67920115"), frontCoverPhoto, "center center");
    applySlideshowBackground(root.querySelector(".elementor-element-35e9d5a7"), [heroPhoto], "center center");
    applyWidgetImage(root.querySelector(".elementor-element-685f99d0"), saveTheDatePhoto);
    applyClassicBackground(root.querySelector(".elementor-element-7febfdfb"), wishesPhoto, "center center");
    applyWidgetImage(root.querySelector(".elementor-element-31ebc793"), bridePhoto);
    applyWidgetImage(root.querySelector(".elementor-element-40cd203b"), groomPhoto);
    applyCarouselImages(root, ".elementor-element-305adcef", [akadCoverPhoto]);
    applyCarouselImages(root, ".elementor-element-1a8272fc", [resepsiCoverPhoto]);
    applyWidgetImage(root.querySelector(".elementor-element-1a57482a"), closingPhoto);

    replaceExactText(textSelector, "Nama Tamu", guest?.name || "");
    replaceExactText(textSelector, "Dear,", guest?.greetingLabel || "Dear,");

    const brideNick = bride?.nickName || contentDefaults?.couple?.bride?.nickName || "Adiba";
    const groomNick = groom?.nickName || contentDefaults?.couple?.groom?.nickName || "Habib";
    const coupleMixed = `${brideNick} & ${groomNick}`;

    replaceExactText(textSelector, "Adiba & Habib", coupleMixed);
    replaceExactText(textSelector, "The Wedding of", copy?.openingGreeting || contentDefaults.copy.openingGreeting);

    const coverCoupleNode = root.querySelector(".elementor-element-d37b672 .elementor-widget-container p");
    if (coverCoupleNode) coverCoupleNode.textContent = coupleMixed;

    const heroCoupleStackNode = root.querySelector(".elementor-element-3666d867 .elementor-widget-container");
    if (heroCoupleStackNode) {
        heroCoupleStackNode.innerHTML = `<p>${escapeHtml(brideNick)}</p><p>&amp; ${escapeHtml(groomNick)}</p>`;
    }

    const heroDateNode = root.querySelector(".elementor-element-1c97af03 .elementor-widget-container p");
    if (heroDateNode) {
        heroDateNode.textContent = event?.akad?.date || contentDefaults?.event?.akad?.date || heroDateNode.textContent;
    }

    const closingCoupleNode = root.querySelector(".elementor-element-74101908 .elementor-widget-container p");
    if (closingCoupleNode) {
        closingCoupleNode.textContent = coupleMixed;
    }

    const brideNameNode = root.querySelector(".elementor-element-4f0349c1 .elementor-heading-title");
    if (brideNameNode) brideNameNode.textContent = bride?.nameFull || contentDefaults.couple.bride.nameFull;

    const groomNameNode = root.querySelector(".elementor-element-59748fd0 .elementor-heading-title");
    if (groomNameNode) groomNameNode.textContent = groom?.nameFull || contentDefaults.couple.groom.nameFull;

    const brideParentNode = root.querySelector(".elementor-element-7870e289 .elementor-widget-container");
    if (brideParentNode) {
        brideParentNode.innerHTML = toParagraphsHtml(bride?.parentInfo || contentDefaults.couple.bride.parentInfo);
    }

    const groomParentNode = root.querySelector(".elementor-element-262bdceb .elementor-widget-container");
    if (groomParentNode) {
        groomParentNode.innerHTML = toParagraphsHtml(groom?.parentInfo || contentDefaults.couple.groom.parentInfo);
    }

    const quoteNode = root.querySelector(".elementor-element-24047276 .elementor-widget-container p");
    if (quoteNode && copy?.quote) quoteNode.textContent = `“${copy.quote}”`;

    const quoteSourceNode = root.querySelector(".elementor-element-6e04ec58 .elementor-widget-container p");
    if (quoteSourceNode && copy?.quoteSource) quoteSourceNode.textContent = copy.quoteSource;

    const saveDateTextNode = root.querySelector(".elementor-element-5240c666 .elementor-widget-container p");
    if (saveDateTextNode && copy?.openingText) {
        saveDateTextNode.textContent = copy.openingText;
    }

    const brideInstagramNode = root.querySelector(".elementor-element-a9fe155 .elementor-social-icon-instagram");
    if (brideInstagramNode) brideInstagramNode.setAttribute("href", toInstagramUrl(bride?.instagram || contentDefaults.couple.bride.instagram));
    const groomInstagramNode = root.querySelector(".elementor-element-7285b1d2 .elementor-social-icon-instagram");
    if (groomInstagramNode) groomInstagramNode.setAttribute("href", toInstagramUrl(groom?.instagram || contentDefaults.couple.groom.instagram));

    const akadParts = formatEventDateParts(event?.akad?.date || event?.dateISO);
    const resepsiParts = formatEventDateParts(event?.resepsi?.date || event?.dateISO);

    const akadDayNumberNode = root.querySelector(".elementor-element-6ea6d5e1 .elementor-counter-number");
    if (akadDayNumberNode) {
        akadDayNumberNode.setAttribute("data-to-value", akadParts.dayNumber);
        akadDayNumberNode.textContent = akadParts.dayNumber;
    }

    const akadDateNode = root.querySelector(".elementor-element-6217d8c4 .elementor-widget-container");
    if (akadDateNode) {
        akadDateNode.innerHTML = `<p><strong>${escapeHtml(akadParts.dayName)}</strong></p><p>${escapeHtml(akadParts.month)}</p><p>${escapeHtml(akadParts.year)}</p>`;
    }

    const resepsiDayNumberNode = root.querySelector(".elementor-element-5d68c9f9 .elementor-counter-number");
    if (resepsiDayNumberNode) {
        resepsiDayNumberNode.setAttribute("data-to-value", resepsiParts.dayNumber);
        resepsiDayNumberNode.textContent = resepsiParts.dayNumber;
    }

    const resepsiDateNode = root.querySelector(".elementor-element-513882a9 .elementor-widget-container");
    if (resepsiDateNode) {
        resepsiDateNode.innerHTML = `<p><strong>${escapeHtml(resepsiParts.dayName)}</strong></p><p>${escapeHtml(resepsiParts.month)}</p><p>${escapeHtml(resepsiParts.year)}</p>`;
    }

    const akadTimeNode = root.querySelector(".elementor-element-1757f687 .elementor-widget-container p");
    if (akadTimeNode) akadTimeNode.textContent = event?.akad?.time || contentDefaults.event.akad.time;

    const resepsiTimeNode = root.querySelector(".elementor-element-1c295340 .elementor-widget-container p");
    if (resepsiTimeNode) resepsiTimeNode.textContent = event?.resepsi?.time || contentDefaults.event.resepsi.time;

    const akadLocationNode = root.querySelector(".elementor-element-5403cd6e .elementor-widget-container");
    if (akadLocationNode) {
        akadLocationNode.innerHTML = buildLocationHtml(
            event?.akad?.venueName,
            event?.akad?.address,
            contentDefaults.event.akad.address,
        );
    }

    const resepsiLocationNode = root.querySelector(".elementor-element-7cec9ffc .elementor-widget-container");
    if (resepsiLocationNode) {
        resepsiLocationNode.innerHTML = buildLocationHtml(
            event?.resepsi?.venueName,
            event?.resepsi?.address,
            contentDefaults.event.resepsi.address,
        );
    }

    const mapsButtons = root.querySelectorAll(".elementor-element-1975556c .elementor-button, .elementor-element-1ba44a3a .elementor-button");
    mapsButtons.forEach((button, index) => {
        const url = index === 0
            ? event?.akad?.mapsUrl || contentDefaults.event.akad.mapsUrl
            : event?.resepsi?.mapsUrl || contentDefaults.event.resepsi.mapsUrl;
        button.setAttribute("href", url);
        button.setAttribute("target", "_blank");
        button.setAttribute("rel", "noreferrer");
    });

    const livestreamDateNode = root.querySelector(".elementor-element-3e7724ab .elementor-widget-container");
    if (livestreamDateNode) {
        livestreamDateNode.innerHTML = `<p>${escapeHtml(event?.livestream?.date || contentDefaults.event.livestream.date)}</p><p>Pukul : ${escapeHtml(event?.livestream?.time || contentDefaults.event.livestream.time)}</p>`;
    }

    const livestreamButton = root.querySelector(".elementor-element-4377431f .elementor-button");
    if (livestreamButton) {
        livestreamButton.setAttribute("href", event?.livestream?.url || contentDefaults.event.livestream.url);
        livestreamButton.setAttribute("target", "_blank");
        livestreamButton.setAttribute("rel", "noreferrer");
    }

    const storyDateSelectors = [
        ".elementor-element-5ebf9ac0 .elementor-widget-container p",
        ".elementor-element-77792df2 .elementor-widget-container p",
        ".elementor-element-7780fd93 .elementor-widget-container p",
    ];

    const storyTextSelectors = [
        ".elementor-element-14ed9c58 .elementor-widget-container p",
        ".elementor-element-401e1e57 .elementor-widget-container p",
        ".elementor-element-575a36f7 .elementor-widget-container p",
    ];

    storyDateSelectors.forEach((selector, index) => {
        const node = root.querySelector(selector);
        if (node) {
            node.textContent = story[index]?.title || contentDefaults.lovestory[index]?.title || node.textContent;
        }
    });

    storyTextSelectors.forEach((selector, index) => {
        const node = root.querySelector(selector);
        if (node) {
            node.textContent = story[index]?.text || contentDefaults.lovestory[index]?.text || node.textContent;
        }
    });

    const galleryItems = Array.isArray(invitationData?.gallery) && invitationData.gallery.length
        ? invitationData.gallery
        : contentDefaults.gallery;

    const galleryAnchors = root.querySelectorAll(".elementor-element-698a6553 .e-gallery-item");
    galleryAnchors.forEach((anchor, index) => {
        const nextImage = galleryItems[index];
        if (!nextImage) {
            anchor.style.display = "none";
            return;
        }

        const resolved = resolveAssetUrl(nextImage);
        anchor.setAttribute("href", resolved);

        const thumbnail = anchor.querySelector(".e-gallery-image");
        if (thumbnail) {
            thumbnail.setAttribute("data-thumbnail", resolved);
            thumbnail.style.backgroundImage = `url("${resolved}")`;
            thumbnail.style.backgroundSize = "cover";
            thumbnail.style.backgroundPosition = "center center";
        }
    });

    const rawBankList = invitationData?.features?.digitalEnvelopeEnabled ? (invitationData?.gift?.bankList
        || invitationData?.features?.digitalEnvelopeInfo?.bankList
        || contentDefaults?.gift?.bankList
        || []) : [];
    const bankList = rawBankList.map((item) => ({
        bank: item.bank || "",
        account: item.account || item.accountNumber || "",
        name: item.name || item.accountName || "",
    }));

    const accountNodes = [
        root.querySelector(".elementor-element-3e651f0b .elementor-heading-title"),
        root.querySelector(".elementor-element-146cb04c .elementor-heading-title"),
    ];

    const accountNameNodes = [
        root.querySelector(".elementor-element-1b0aa9b9 .elementor-heading-title"),
        root.querySelector(".elementor-element-3053a7c2 .elementor-heading-title"),
    ];

    accountNodes.forEach((node, index) => {
        if (!node) return;
        node.textContent = bankList[index]?.account || contentDefaults.gift.bankList[index]?.account || node.textContent;
    });

    accountNameNodes.forEach((node, index) => {
        if (!node) return;
        node.textContent = bankList[index]?.name || contentDefaults.gift.bankList[index]?.name || node.textContent;
    });

    const copyContentNodes = root.querySelectorAll(".elementor-widget-weddingpress-copy-text .copy-content");
    copyContentNodes.forEach((node, index) => {
        node.textContent = bankList[index]?.account || contentDefaults.gift.bankList[index]?.account || "";
    });

    const shippingContainer = root.querySelector(".elementor-element-56567941 .elementor-widget-container");
    if (shippingContainer) {
        const shipping = invitationData?.gift?.shipping || contentDefaults?.gift?.shipping || {};
        shippingContainer.innerHTML = `<p>Nama Penerima : ${escapeHtml(shipping.recipient || groom?.nameFull || "-")}</p><p>No. HP : ${escapeHtml(shipping.phone || "-")}</p><p>${escapeHtml(shipping.address || event?.akad?.address || "-")}</p>`;
    }

    const closingTextNode = root.querySelector(".elementor-element-4aa43d55 .elementor-widget-container p");
    if (closingTextNode && copy?.closingText) closingTextNode.textContent = copy.closingText;

    const closingLabelNode = root.querySelector(".elementor-element-4a27013d .elementor-widget-container p");
    if (closingLabelNode && copy?.closingLabel) closingLabelNode.textContent = copy.closingLabel;

    const supportNode = root.querySelector(".elementor-element-6472b47b .elementor-widget-container");
    if (supportNode && copy?.supportText) {
        supportNode.textContent = copy.supportText;
    }

    const wishTitleNode = root.querySelector(".elementor-element-17a21c21 .elementor-heading-title");
    const wishTitle = invitationData?.wishes?.title || contentDefaults?.wishes?.title;
    if (wishTitleNode && wishTitle) {
        wishTitleNode.textContent = wishTitle;
    }
}

function renderWishList(listElement, wishes) {
    if (!listElement) return;
    listElement.innerHTML = "";

    const items = Array.isArray(wishes) ? wishes : [];
    items.forEach((wish) => {
        const item = document.createElement("li");
        item.className = "cui-item-comment";
        const meta = [formatWishRelativeTime(wish?.createdAt), wish?.attendance].filter((part) => normalizeText(part));

        item.innerHTML = `
      <div class="cui-comment-content">
        <div class="cui-comment-info">
          <a class="cui-commenter-name">${escapeHtml(wish?.author || "Tamu")}</a>
          <span class="cui-comment-time">${escapeHtml(meta.join(", ") || "Baru saja")}</span>
        </div>
        <div class="cui-comment-text"><p>${escapeHtml(wish?.comment || "")}</p></div>
      </div>
    `;

        listElement.appendChild(item);
    });
}

function updateAttendanceCounts(root, wishes) {
    const summary = (Array.isArray(wishes) ? wishes : []).reduce(
        (acc, item) => {
            const attendance = normalizeText(item?.attendance || "").toLowerCase();
            if (attendance.includes("tidak")) acc.tidakHadir += 1;
            else if (attendance.includes("hadir") || attendance.includes("datang")) acc.hadir += 1;
            return acc;
        },
        { hadir: 0, tidakHadir: 0 }
    );

    const hadirNode = root.querySelector(".cui_card-hadir span:first-child");
    const tidakHadirNode = root.querySelector(".cui_card-tidak_hadir span:first-child");
    if (hadirNode) hadirNode.textContent = String(summary.hadir);
    if (tidakHadirNode) tidakHadirNode.textContent = String(summary.tidakHadir);

    const commentsCounter = root.querySelector("#cui-link-14805 span");
    if (commentsCounter) commentsCounter.textContent = String(Array.isArray(wishes) ? wishes.length : 0);
}

function collectWishesFromDom(root) {
    return Array.from(root.querySelectorAll("#cui-container-comment-14805 .cui-item-comment")).map((node) => {
        const metaText = normalizeText(node.querySelector(".cui-comment-time")?.textContent || "Baru saja");
        const metaParts = metaText
            .split(",")
            .map((part) => normalizeText(part))
            .filter(Boolean);

        let attendance = "-";
        let createdAt = "Baru saja";

        if (metaParts.length === 1) {
            if (/(tidak|hadir|datang|absen)/i.test(metaParts[0])) {
                attendance = metaParts[0];
            } else {
                createdAt = metaParts[0];
            }
        } else if (metaParts.length >= 2) {
            const attendanceIndex = metaParts.findIndex((part) => /(tidak|hadir|datang|absen)/i.test(part));
            if (attendanceIndex >= 0) {
                attendance = metaParts[attendanceIndex];
                const remaining = metaParts.filter((_, index) => index !== attendanceIndex).join(", ");
                createdAt = remaining || createdAt;
            } else {
                createdAt = metaParts.join(", ");
            }
        }

        return {
            author: normalizeText(node.querySelector(".cui-commenter-name")?.textContent || "Tamu"),
            comment: normalizeText(node.querySelector(".cui-comment-text")?.textContent || ""),
            attendance,
            createdAt,
        };
    });
}

function loadScriptOnce(src, id) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-noir-script='${id}']`);
        if (existing) {
            if (existing.getAttribute("data-loaded") === "1") {
                resolve();
                return;
            }

            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.setAttribute("data-noir-script", id);
        script.addEventListener("load", () => {
            script.setAttribute("data-loaded", "1");
            resolve();
        });
        script.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)));
        document.body.appendChild(script);
    });
}

function ensureElementorFallbackBackgrounds(root) {
    root.querySelectorAll("[data-settings]").forEach((node) => {
        const settings = safeParseJson(node.getAttribute("data-settings") || "");
        if (!settings || typeof settings !== "object") return;

        const slideshow = settings.background_slideshow_gallery;
        if (Array.isArray(slideshow) && slideshow.length > 0) {
            const firstUrl = resolveAssetUrl(slideshow[0]?.url || "");
            if (firstUrl) {
                node.style.backgroundImage = `url("${firstUrl}")`;
                if (!node.style.backgroundSize) node.style.backgroundSize = "cover";
                if (!node.style.backgroundPosition) node.style.backgroundPosition = "top center";
            }
        }
    });

    root.querySelectorAll(".e-gallery-image[data-thumbnail]").forEach((node) => {
        const thumbnail = resolveAssetUrl(node.getAttribute("data-thumbnail") || "");
        if (!thumbnail) return;
        node.style.backgroundImage = `url("${thumbnail}")`;
        node.style.backgroundSize = "cover";
        node.style.backgroundPosition = "center center";
    });
}

function buildGalleryFallbackLayout(root) {
    const containers = root.querySelectorAll(".elementor-gallery__container");
    const columns = window.innerWidth <= 520 ? 2 : 3;

    containers.forEach((container) => {
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
                zIndex: tokens.zIndex.lightbox,
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

export default function NavyBlossomTemplate({
    data: externalData,
    invitationSlug = "navy-blossom",
    mode = "live",
    onSubmitWish,
    onFetchWishes,
}) {
    const isStaticDemoMode = mode === "demo";
    const { data: fetchedData } = useInvitationData(invitationSlug, {
        fallbackSlug: "navy-blossom",
        skipFetch: Boolean(externalData) || isStaticDemoMode,
    });

    const [opened, setOpened] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxSlides, setLightboxSlides] = useState([]);

    const rootRef = useRef(null);
    const audioRef = useRef(null);
    const wasPlayingOnHiddenRef = useRef(false);

    const sourceArtifacts = useMemo(() => parseSourceArtifacts(sourceHtml), []);

    const mergedData = useMemo(() => {
        const incoming = externalData || fetchedData || contentDefaults;
        return mergeInvitationData(defaultSchema, incoming);
    }, [externalData, fetchedData]);

    const behavior = useMemo(() => {
        return {
            ...behaviorDefaults,
            ...(mergedData?.behavior || {}),
            particles: {
                ...behaviorDefaults.particles,
                ...(mergedData?.behavior?.particles || {}),
            },
            lottie: {
                ...behaviorDefaults.lottie,
                ...(mergedData?.behavior?.lottie || {}),
            },
            audio: {
                ...behaviorDefaults.audio,
                ...(mergedData?.behavior?.audio || {}),
            },
            countdown: {
                ...behaviorDefaults.countdown,
                ...(mergedData?.behavior?.countdown || {}),
            },
            cover: {
                ...behaviorDefaults.cover,
                ...(mergedData?.behavior?.cover || {}),
            },
            gift: {
                ...behaviorDefaults.gift,
                ...(mergedData?.behavior?.gift || {}),
            },
            copy: {
                ...behaviorDefaults.copy,
                ...(mergedData?.behavior?.copy || {}),
            },
            lightbox: {
                ...behaviorDefaults.lightbox,
                ...(mergedData?.behavior?.lightbox || {}),
            },
            motionText: {
                ...behaviorDefaults.motionText,
                ...(mergedData?.behavior?.motionText || {}),
            },
            viewportVh: {
                ...behaviorDefaults.viewportVh,
                ...(mergedData?.behavior?.viewportVh || {}),
            },
            wishes: {
                ...behaviorDefaults.wishes,
                ...(mergedData?.behavior?.wishes || {}),
            },
        };
    }, [mergedData]);

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
                const href = resolveAssetUrl(entry.href || "");
                if (!href) return;

                const link = document.createElement("link");
                link.setAttribute("rel", "stylesheet");
                link.setAttribute("href", href);
                link.setAttribute("data-noir-style", "1");
                document.head.appendChild(link);
                nodes.push(link);
                return;
            }

            const style = document.createElement("style");
            style.setAttribute("data-noir-inline-style", "1");
            style.textContent = rewriteCssAssetUrls(entry.css || "");
            document.head.appendChild(style);
            nodes.push(style);
        });

        return () => {
            nodes.forEach((node) => {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });
        };
    }, [sourceArtifacts.styleSequence]);

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
        if (!root) return undefined;

        setOpened(false);
        setAudioPlaying(false);
        root.innerHTML = sourceArtifacts.markup;

        root.querySelectorAll(".elementor-invisible").forEach((node) => {
            node.classList.remove("elementor-invisible");
        });

        root.querySelectorAll(".e-con.e-parent").forEach((node) => {
            node.classList.add("e-lazyloaded");
        });

        root.querySelectorAll("[src], [href], [poster], [data-thumbnail], [srcset], [style], [data-settings]").forEach((node) => {
            ["src", "href", "poster", "data-thumbnail"].forEach((attribute) => {
                if (!node.hasAttribute(attribute)) return;
                const value = node.getAttribute(attribute);
                const nextValue = resolveAssetUrl(value || "");
                if (nextValue && nextValue !== value) {
                    node.setAttribute(attribute, nextValue);
                }
            });

            if (node.hasAttribute("srcset")) {
                node.setAttribute("srcset", rewriteSrcsetValue(node.getAttribute("srcset") || ""));
            }

            if (node.hasAttribute("style")) {
                node.setAttribute("style", rewriteInlineStyleValue(node.getAttribute("style") || ""));
            }

            if (node.hasAttribute("data-settings")) {
                node.setAttribute("data-settings", rewriteDataSettings(node.getAttribute("data-settings") || ""));
            }
        });

        ensureElementorFallbackBackgrounds(root);
        buildGalleryFallbackLayout(root);
        applyInvitationData(root, mergedData, {
            disableLockedBasicSections: mode !== "preview",
        });

        root.querySelectorAll(".elementor-counter-number[data-to-value]").forEach((node) => {
            node.textContent = node.getAttribute("data-to-value") || node.textContent;
        });

        const runtimeStyle = document.createElement("style");
        runtimeStyle.textContent = `
          .navy-blossom-template .elementor-element-2b12c6e2,
          .navy-blossom-template .elementor-element-1c388121,
          .navy-blossom-template .elementor-element-5cd149e9,
          .navy-blossom-template .elementor-element-773ba8ff,
          .navy-blossom-template .elementor-element-1ccf6a53,
          .navy-blossom-template .elementor-element-17a21c21,
          .navy-blossom-template .elementor-element-3076e97c {
            width: 100% !important;
            max-width: 100% !important;
            align-self: center !important;
            margin-left: auto !important;
            margin-right: auto !important;
            text-align: center !important;
          }
          .navy-blossom-template .elementor-element-2b12c6e2 > .elementor-widget-container,
          .navy-blossom-template .elementor-element-1c388121 > .elementor-widget-container,
          .navy-blossom-template .elementor-element-5cd149e9 > .elementor-widget-container,
          .navy-blossom-template .elementor-element-773ba8ff > .elementor-widget-container,
          .navy-blossom-template .elementor-element-1ccf6a53 > .elementor-widget-container,
          .navy-blossom-template .elementor-element-17a21c21 > .elementor-widget-container,
          .navy-blossom-template .elementor-element-3076e97c > .elementor-widget-container,
          .navy-blossom-template .elementor-element-2b12c6e2 .elementor-heading-title,
          .navy-blossom-template .elementor-element-1c388121 .elementor-heading-title,
          .navy-blossom-template .elementor-element-5cd149e9 .elementor-heading-title,
          .navy-blossom-template .elementor-element-773ba8ff .elementor-heading-title,
          .navy-blossom-template .elementor-element-1ccf6a53 .elementor-heading-title,
          .navy-blossom-template .elementor-element-17a21c21 .elementor-heading-title,
          .navy-blossom-template .elementor-element-3076e97c .elementor-heading-title {
            width: 100% !important;
            text-align: center !important;
          }
          @media (min-width: 681px) and (max-width: 767px) {
            .navy-blossom-template .elementor-element-46e3d068 {
              --content-width: 470px !important;
              padding-left: 18px !important;
              padding-right: 18px !important;
            }
            .navy-blossom-template .elementor-element-7b458cc6 {
              width: 100% !important;
              max-width: 470px !important;
              margin-left: auto !important;
              margin-right: auto !important;
              background-position: center top !important;
              background-size: cover !important;
              overflow: hidden !important;
            }
          }
          .navy-blossom-template .elementor-element-35ddbcb5 {
            position: fixed !important;
            right: 14px !important;
            bottom: 88px !important;
            z-index: ${tokens.zIndex.floatingAudio} !important;
            margin: 0 !important;
            width: auto !important;
            max-width: none !important;
          }
          .navy-blossom-template #audio-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 999px;
            background: #4a5d67;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
            cursor: pointer;
          }
          .navy-blossom-template #audio-container .elementor-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: transparent !important;
            color: #ffffff !important;
            fill: #ffffff !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .navy-blossom-template #audio-container .elementor-icon:hover,
          .navy-blossom-template #audio-container .elementor-icon:focus {
            background: transparent !important;
            color: #ffffff !important;
            fill: #ffffff !important;
          }
          .navy-blossom-template #audio-container .elementor-icon i,
          .navy-blossom-template #audio-container .elementor-icon svg {
            color: inherit !important;
            fill: currentColor !important;
          }
          .navy-blossom-template #cui-wrap-commnent-14805 {
            display: block;
          }
          .navy-blossom-template #cui-box {
            display: block !important;
          }
          .navy-blossom-template #commentform-14805 .form-submit {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .navy-blossom-template #commentform-14805.is-submitting .navy-wish-submit-spinner {
            display: inline-flex;
          }
          .navy-blossom-template #commentform-14805 .navy-wish-submit-spinner {
            display: none;
            width: 16px;
            height: 16px;
            border-radius: 999px;
            border: 2px solid rgba(13, 7, 52, 0.18);
            border-top-color: #0d0734;
            animation: navy-wish-spinner 0.7s linear infinite;
            flex: 0 0 auto;
          }
          .navy-blossom-template #commentform-14805.is-submitting input[type="submit"],
          .navy-blossom-template #commentform-14805.is-submitting input[type="button"],
          .navy-blossom-template #commentform-14805.is-submitting input[type="text"],
          .navy-blossom-template #commentform-14805.is-submitting textarea,
          .navy-blossom-template #commentform-14805.is-submitting select {
            opacity: 0.68;
            cursor: not-allowed !important;
          }
          .navy-blossom-template #commentform-14805.is-submitting textarea,
          .navy-blossom-template #commentform-14805.is-submitting select,
          .navy-blossom-template #commentform-14805.is-submitting input[type="text"] {
            background-color: rgba(255, 255, 255, 0.82);
          }
          @keyframes navy-wish-spinner {
            to {
              transform: rotate(360deg);
            }
          }
        `;
        root.appendChild(runtimeStyle);

        const cleanups = [];
        const timers = [];
        const intervals = [];
        const lottieInstances = [];

        const addCleanup = (fn) => {
            cleanups.push(fn);
        };

        let isOpened = false;
        let isAudioPlaying = false;
        let bodyLocked = false;

        const previousBodyStyles = {
            position: document.body.style.position,
            height: document.body.style.height,
            left: document.body.style.left,
            right: document.body.style.right,
            overflowY: document.body.style.overflowY,
            overflowX: document.body.style.overflowX,
        };

        const setDynamicVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);
        };

        if (behavior.viewportVh.enabled) {
            setDynamicVh();
            window.addEventListener("resize", setDynamicVh);
            addCleanup(() => window.removeEventListener("resize", setDynamicVh));
        }

        const updateGalleryLayout = () => buildGalleryFallbackLayout(root);
        window.addEventListener("resize", updateGalleryLayout);
        addCleanup(() => window.removeEventListener("resize", updateGalleryLayout));

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
        if (behavior.cover.lockScrollUntilOpen && sec) {
            lockBody();
        }

        const song = root.querySelector("#song");
        audioRef.current = song || null;

        if (song) {
            const sourceNode = song.querySelector("source");
            if (sourceNode) {
                sourceNode.setAttribute("src", resolveAssetUrl(mergedData?.audio?.src || contentDefaults.audio.src));
                song.load();
            }
            song.loop = mergedData?.audio?.loop !== false;
        }

        const muteSound = root.querySelector("#mute-sound");
        const unmuteSound = root.querySelector("#unmute-sound");
        const audioContainer = root.querySelector("#audio-container");

        const syncAudioIcons = () => {
            if (!muteSound || !unmuteSound) return;
            if (!isOpened) {
                muteSound.style.display = "none";
                unmuteSound.style.display = "none";
                return;
            }

            if (isAudioPlaying) {
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
            syncAudioIcons();
        };

        const pauseAudio = () => {
            if (!song) return;
            song.pause();
            isAudioPlaying = false;
            setAudioPlaying(false);
            syncAudioIcons();
        };

        const toggleAudio = async (event) => {
            event.preventDefault();
            if (!song || !isOpened) return;

            if (song.paused) {
                await playAudio();
                return;
            }

            pauseAudio();
        };

        if (audioContainer) {
            audioContainer.addEventListener("click", toggleAudio);
            addCleanup(() => audioContainer.removeEventListener("click", toggleAudio));
        }

        const calendarButtonConfigs = [
            {
                widgetSelector: ".elementor-element-1975556c",
                eventName: "Akad",
                detail: mergedData?.event?.akad,
                fallbackDetail: contentDefaults?.event?.akad,
            },
            {
                widgetSelector: ".elementor-element-1ba44a3a",
                eventName: "Resepsi",
                detail: mergedData?.event?.resepsi,
                fallbackDetail: contentDefaults?.event?.resepsi,
            },
        ];

        if (mergedData?.features?.saveTheDateEnabled) {
            calendarButtonConfigs.forEach(({ widgetSelector, eventName, detail, fallbackDetail }) => {
                const existingWidget = root.querySelector(widgetSelector);
                if (!existingWidget) return;

                const calendarWidget = existingWidget.cloneNode(true);
                calendarWidget.setAttribute("data-calendar-widget-for", widgetSelector);

                const calendarButton = calendarWidget.querySelector(".elementor-button");
                if (!calendarButton) {
                    calendarWidget.remove();
                    return;
                }

                calendarButton.removeAttribute("href");
                calendarButton.removeAttribute("target");
                calendarButton.removeAttribute("rel");
                calendarButton.setAttribute("role", "button");

                const textNode = calendarButton.querySelector(".elementor-button-text");
                if (textNode) {
                    textNode.textContent = "Tambah ke Kalender";
                }

                const eventStart = parseEventDateTime(
                    detail?.date,
                    detail?.time,
                    mergedData?.event?.dateISO || fallbackDetail?.date || contentDefaults?.event?.dateISO,
                ) || parseEventDateTime(
                    mergedData?.event?.dateISO,
                    detail?.time || fallbackDetail?.time,
                    contentDefaults?.event?.dateISO,
                );

                const locationText = [
                    normalizeText(detail?.venueName || ""),
                    normalizeText(detail?.address || fallbackDetail?.address || ""),
                ]
                    .filter(Boolean)
                    .join(", ");

                const reminderTitle = [
                    "Pernikahan",
                    normalizeText(mergedData?.couple?.groom?.nickName || contentDefaults?.couple?.groom?.nickName || ""),
                    "&",
                    normalizeText(mergedData?.couple?.bride?.nickName || contentDefaults?.couple?.bride?.nickName || ""),
                    "-",
                    eventName,
                ]
                    .filter(Boolean)
                    .join(" ");

                const handleCalendarClick = (event) => {
                    event.preventDefault();
                    downloadCalendarReminder({
                        title: reminderTitle,
                        startDate: eventStart,
                        location: locationText,
                        description: mergedData?.copy?.openingText || contentDefaults?.copy?.openingText || "",
                        fileName: `${eventName.toLowerCase()}-navy-blossom.ics`,
                    });
                };

                calendarButton.addEventListener("click", handleCalendarClick);
                addCleanup(() => calendarButton.removeEventListener("click", handleCalendarClick));

                existingWidget.insertAdjacentElement("afterend", calendarWidget);
            });
        }

        const activateMotionText = () => {
            if (!behavior.motionText.enabled) return;
            const motionTexts = root.querySelectorAll(".motion-text");
            motionTexts.forEach((textNode, index) => {
                const timer = window.setTimeout(() => {
                    textNode.classList.add("active");
                }, index * behavior.motionText.staggerMs);
                timers.push(timer);
            });
        };

        const openTrigger = root.querySelector("#open");
        const coverColumn = root.querySelector("#sec #kolom");

        const handleOpenInvitation = (event) => {
            event.preventDefault();
            if (isOpened) return;

            isOpened = true;
            setOpened(true);
            activateMotionText();
            root.querySelectorAll(".aw").forEach((node) => {
                node.style.display = "block";
            });

            if (behavior.audio.autoplayOnOpen) {
                playAudio();
            }

            if (coverColumn) {
                coverColumn.style.transform = "translateY(-100%)";
                coverColumn.style.transition = "transform 1.5s ease-in-out";
            }

            if (sec) {
                sec.style.opacity = "0";
                sec.style.transition = "opacity 1.5s ease-in-out";
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

            syncAudioIcons();
        };

        if (openTrigger) {
            openTrigger.addEventListener("click", handleOpenInvitation);
            addCleanup(() => openTrigger.removeEventListener("click", handleOpenInvitation));
        }

        const handleVisibilityChange = () => {
            if (!behavior.audio.pauseOnHidden || !song) return;

            if (document.visibilityState === "hidden") {
                wasPlayingOnHiddenRef.current = !song.paused;
                if (!song.paused) {
                    song.pause();
                    isAudioPlaying = false;
                    setAudioPlaying(false);
                    syncAudioIcons();
                }
                return;
            }

            if (document.visibilityState === "visible" && wasPlayingOnHiddenRef.current && isOpened) {
                song
                    .play()
                    .then(() => {
                        isAudioPlaying = true;
                        setAudioPlaying(true);
                        syncAudioIcons();
                    })
                    .catch(() => {
                        isAudioPlaying = false;
                        setAudioPlaying(false);
                        syncAudioIcons();
                    });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        addCleanup(() => document.removeEventListener("visibilitychange", handleVisibilityChange));

        const acaraAnchors = root.querySelectorAll('a[href="#acara"]');
        const acaraSection = root.querySelector("#acara");
        if (acaraAnchors.length > 0 && acaraSection) {
            const handleAcaraScroll = (event) => {
                event.preventDefault();

                const top = window.scrollY + acaraSection.getBoundingClientRect().top - 24;
                window.scrollTo({
                    top: Math.max(top, 0),
                    behavior: "smooth",
                });
            };

            acaraAnchors.forEach((anchor) => {
                anchor.addEventListener("click", handleAcaraScroll);
                addCleanup(() => anchor.removeEventListener("click", handleAcaraScroll));
            });
        }

        if (behavior.countdown.enabled) {
            const targetDate = normalizeCountdownTarget(mergedData?.event, contentDefaults?.event);
            const countdownNodes = root.querySelectorAll("ul.wpkoi-elements-countdown-items");
            countdownNodes.forEach((node) => {
                node.setAttribute("data-date", targetDate);
                updateCountdownNode(node, targetDate);
            });

            const interval = window.setInterval(() => {
                countdownNodes.forEach((node) => updateCountdownNode(node, targetDate));
            }, 1000);

            intervals.push(interval);
        }

        const giftButton = root.querySelector("#klik");
        const giftPanel = root.querySelector("#amplop");
        if (giftButton && giftPanel && behavior.gift.toggleEnabled) {
            giftPanel.style.display = behavior.gift.startHidden ? "none" : giftPanel.classList.contains("e-con") ? "flex" : "block";

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

        if (behavior.copy.enabled) {
            const copyButtons = root.querySelectorAll(".elementor-widget-weddingpress-copy-text .elementor-button");
            copyButtons.forEach((button) => {
                button.removeAttribute("onclick");
                const handleCopy = async (event) => {
                    event.preventDefault();

                    const widget = button.closest(".elementor-widget-weddingpress-copy-text");
                    const copyContent = widget?.querySelector(".copy-content");
                    const accountText = normalizeText(copyContent?.textContent || "");

                    if (!accountText) return;

                    const fallbackCopy = () => {
                        const textarea = document.createElement("textarea");
                        textarea.value = accountText;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textarea);
                    };

                    if (navigator.clipboard?.writeText) {
                        try {
                            await navigator.clipboard.writeText(accountText);
                        } catch {
                            fallbackCopy();
                        }
                    } else {
                        fallbackCopy();
                    }

                    const textNode = button.querySelector(".elementor-button-text");
                    const originalText = textNode?.textContent || "Copy";
                    const feedbackText = button.getAttribute("data-message") || "berhasil disalin";
                    if (textNode) {
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
        }

        if (behavior.reveal) {
            root.querySelectorAll(".af").forEach((node) => node.classList.add("active"));

            const revealSelector = ".ef, .reveal, .revealin, .revealkanan, .revealkiri, .revealatas, .revealr, .af";
            const revealNodes = root.querySelectorAll(revealSelector);

            const observer = new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add("active");
                        obs.unobserve(entry.target);
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
                    const selector = `a[data-elementor-open-lightbox='yes'][data-elementor-lightbox-slideshow='${group}']`;
                    const groupAnchors = Array.from(root.querySelectorAll(selector));
                    const slides = groupAnchors.map((item) => ({ src: item.getAttribute("href") || "" }));
                    const index = Math.max(groupAnchors.indexOf(anchor), 0);

                    setLightboxSlides(slides);
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                };

                anchor.addEventListener("click", handleLightboxClick);
                addCleanup(() => anchor.removeEventListener("click", handleLightboxClick));
            });
        }

        if (behavior.wishes.enabled) {
            const wishesLink = root.querySelector("#cui-link-14805");
            const wishesWrap = root.querySelector("#cui-wrap-commnent-14805");
            const wishesBox = root.querySelector("#cui-box");
            const wishesList = root.querySelector("#cui-container-comment-14805");
            const wishForm = root.querySelector("#commentform-14805");

            if (wishesWrap) wishesWrap.style.display = "block";
            if (wishesBox) wishesBox.style.display = "block";
            if (wishesList) wishesList.style.display = "block";
            if (wishesLink) wishesLink.setAttribute("href", "#ucapan");

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

            const initialWishes = mergedData?.wishes?.initial || contentDefaults?.wishes?.initial || [];
            renderWishList(wishesList, initialWishes);
            updateAttendanceCounts(root, initialWishes);

            if (typeof onFetchWishes === "function") {
                Promise.resolve(onFetchWishes())
                    .then((items) => {
                        if (!Array.isArray(items)) return;
                        renderWishList(wishesList, items);
                        updateAttendanceCounts(root, items);
                    })
                    .catch(() => { });
            }

            if (wishForm) {
                const authorInput = wishForm.querySelector("#author");
                const submitButton = wishForm.querySelector("input[type='submit']");
                const submitRow = wishForm.querySelector(".form-submit");
                const formControls = Array.from(wishForm.querySelectorAll("input, textarea, select, button"));

                if (submitRow && !submitRow.querySelector(".navy-wish-submit-spinner")) {
                    const spinner = document.createElement("span");
                    spinner.className = "navy-wish-submit-spinner";
                    spinner.setAttribute("aria-hidden", "true");
                    submitRow.appendChild(spinner);
                }

                const setWishFormSubmitting = (isSubmitting) => {
                    wishForm.classList.toggle("is-submitting", isSubmitting);
                    wishForm.setAttribute("aria-busy", isSubmitting ? "true" : "false");
                    formControls.forEach((control) => {
                        if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement || control instanceof HTMLButtonElement)) {
                            return;
                        }
                        control.disabled = isSubmitting;
                    });
                    if (submitButton) {
                        submitButton.value = "Kirim";
                    }
                };

                if (authorInput) {
                    authorInput.removeAttribute("readonly");
                    authorInput.removeAttribute("nofocus");
                    if (mode === "preview") {
                        authorInput.value = mergedData?.guest?.name || "";
                    }
                }

                const errorInfoName = wishForm.querySelector(".cui-error-info-name");
                if (errorInfoName) {
                    errorInfoName.style.display = "none";
                }

                const handleWishSubmit = async (event) => {
                    event.preventDefault();
                    if (wishForm.classList.contains("is-submitting")) return;

                    const formData = new FormData(wishForm);
                    const activeInvitationSlug =
                        invitationSlug ||
                        mergedData?.invitation?.slug ||
                        mergedData?.invitationSlug ||
                        "navy-blossom";
                    const payload = {
                        invitationSlug: activeInvitationSlug,
                        invitation_slug: activeInvitationSlug,
                        orderId:
                            mergedData?.invitation?.orderId ||
                            mergedData?.invitation?.order_id ||
                            mergedData?.orderId ||
                            mergedData?.order_id ||
                            mergedData?.order?.orderId ||
                            mergedData?.order?.order_id ||
                            mergedData?.order?.id ||
                            null,
                        order_id:
                            mergedData?.invitation?.orderId ||
                            mergedData?.invitation?.order_id ||
                            mergedData?.orderId ||
                            mergedData?.order_id ||
                            mergedData?.order?.orderId ||
                            mergedData?.order?.order_id ||
                            mergedData?.order?.id ||
                            null,
                        author: normalizeText(formData.get("author") || mergedData?.guest?.name || "Tamu"),
                        comment: normalizeText(formData.get("comment") || ""),
                        attendance: normalizeText(formData.get("konfirmasi") || "-"),
                        createdAt: "Baru saja",
                    };

                    if (!payload.comment) return;

                    setWishFormSubmitting(true);
                    let savedWish = null;
                    try {
                        const response = await postInvitationWish(activeInvitationSlug, payload);
                        savedWish = response?.data && typeof response.data === "object"
                            ? {
                                invitationSlug: response.data.invitationSlug || payload.invitationSlug || null,
                                orderId: response.data.orderId || payload.orderId || null,
                                author: normalizeText(response.data.author || response.data.name || payload.author || "Tamu"),
                                comment: normalizeText(response.data.comment || response.data.message || payload.comment || ""),
                                attendance: normalizeText(response.data.attendance || payload.attendance || "-"),
                                createdAt: response.data.createdAt || payload.createdAt || "Baru saja",
                            }
                            : null;
                    } catch {
                        // keep optimistic local render
                    } finally {
                        setWishFormSubmitting(false);
                    }

                    const currentWishes = collectWishesFromDom(root);
                    const nextWishes = [savedWish || payload, ...currentWishes];
                    renderWishList(wishesList, nextWishes);
                    updateAttendanceCounts(root, nextWishes);

                    wishForm.reset();
                    if (authorInput && mode === "preview") {
                        authorInput.value = mergedData?.guest?.name || "";
                    }
                };

                wishForm.addEventListener("submit", handleWishSubmit);
                addCleanup(() => wishForm.removeEventListener("submit", handleWishSubmit));
            }
        }

        if (behavior.particles.enabled) {
            loadScriptOnce(resolveAssetUrl("assets/vendor/particles.min.js"), "particles")
                .then(() => {
                    if (typeof window.particlesJS !== "function") return;

                    const coverParticlesTarget = root.querySelector("#sec #kolom");
                    const heroParticlesTarget = root.querySelector("#particles-js");

                    if (coverParticlesTarget) {
                        coverParticlesTarget.querySelectorAll(".particles-js-canvas-el").forEach((node) => node.remove());
                        window.particlesJS("kolom", PARTICLES_KOLOM_CONFIG);
                    }

                    if (heroParticlesTarget) {
                        heroParticlesTarget.querySelectorAll(".particles-js-canvas-el").forEach((node) => node.remove());
                        window.particlesJS("particles-js", PARTICLES_HERO_CONFIG);
                    }
                })
                .catch(() => { });
        }

        if (behavior.lottie.enabled) {
            loadScriptOnce(resolveAssetUrl("assets/js/lottie.min.js"), "lottie")
                .then(() => {
                    if (!window.lottie || typeof window.lottie.loadAnimation !== "function") return;

                    const widgets = root.querySelectorAll(".elementor-widget-lottie");
                    widgets.forEach((widget) => {
                        const animNode = widget.querySelector(".e-lottie__animation") || widget.querySelector(".e-lottie__container");
                        if (!animNode || animNode.getAttribute("data-lottie-initialized") === "1") return;

                        const settings = safeParseJson(widget.getAttribute("data-settings") || "{}") || {};
                        const sourceJson = settings?.source_json?.url || "";
                        const path = resolveAssetUrl(sourceJson);
                        if (!path) return;

                        animNode.setAttribute("data-lottie-initialized", "1");
                        const instance = window.lottie.loadAnimation({
                            container: animNode,
                            renderer: settings?.renderer || "svg",
                            loop: settings?.loop === true || settings?.loop === "yes",
                            autoplay: true,
                            path,
                        });

                        lottieInstances.push(instance);
                    });
                })
                .catch(() => { });
        }

        const refreshTimer = window.setTimeout(() => {
            if (behavior.aos) {
                AOS.refreshHard();
            }
        }, 400);
        timers.push(refreshTimer);

        syncAudioIcons();

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
            intervals.forEach((interval) => window.clearInterval(interval));
            cleanups.forEach((cleanup) => cleanup());
            lottieInstances.forEach((instance) => {
                if (instance && typeof instance.destroy === "function") {
                    instance.destroy();
                }
            });

            if (bodyLocked) {
                unlockBody();
            }

            audioRef.current = null;
        };
    }, [sourceArtifacts.markup, mergedData, behavior, mode, onFetchWishes, onSubmitWish]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const muteSound = root.querySelector("#mute-sound");
        const unmuteSound = root.querySelector("#unmute-sound");

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

    return (
        <>
            <div className="navy-blossom-template" ref={rootRef} />
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
