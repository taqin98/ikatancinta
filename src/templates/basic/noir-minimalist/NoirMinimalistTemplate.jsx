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
    "page-id-5749",
    "wp-embed-responsive",
    "wp-theme-hello-elementor",
    "hello-elementor-default",
    "elementor-default",
    "elementor-template-canvas",
    "elementor-kit-5",
    "elementor-page",
    "elementor-page-5749",
];

const APP_BASE_URL = import.meta.env.BASE_URL || "/";
const normalizedBaseUrl = APP_BASE_URL.endsWith("/") ? APP_BASE_URL : `${APP_BASE_URL}/`;
const PUBLIC_ASSET_PREFIX = `${normalizedBaseUrl}templates/basic/noir-minimalist/assets/`;

const REMOTE_UPLOADS_REGEX = /https?:\/\/inv\.rumahundangan\.id\/wp-content\/uploads\/\d{4}\/\d{2}\/([^/?#"')]+)/i;
const GENERIC_UPLOADS_REGEX = /https?:\/\/[^/]+\/wp-content\/uploads\/\d{4}\/\d{2}\/([^/?#"')]+)/i;

const PARTICLES_CONFIG = {
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
        return `${PUBLIC_ASSET_PREFIX}images/${remoteMatch[1]}`;
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
        behavior: {
            ...behaviorDefaults,
            ...(incomingData.behavior || {}),
        },
        lovestory: Array.isArray(incomingData.lovestory) ? incomingData.lovestory : baseSchema.lovestory,
        gallery: Array.isArray(incomingData.gallery) ? incomingData.gallery : [],
    };
}

function formatHeroDate(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "30 . 03 . 2025";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} . ${month} . ${year}`;
}

function formatEventDateParts(dateInput) {
    const date = new Date(dateInput);
    if (!Number.isNaN(date.getTime())) {
        const dayName = date.toLocaleDateString("id-ID", { weekday: "long" });
        const month = date.toLocaleDateString("id-ID", { month: "long" });
        const year = date.getFullYear();
        return {
            dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            month: month.charAt(0).toUpperCase() + month.slice(1),
            year: String(year),
        };
    }

    const text = normalizeText(dateInput);
    const match = text.match(/([A-Za-zÀ-ÿ]+),?\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
    if (match) {
        return {
            dayName: match[1],
            month: match[3],
            year: match[4],
        };
    }

    return { dayName: "Minggu", month: "Maret", year: "2025" };
}

function toParagraphsHtml(value) {
    const lines = String(value || "")
        .split("\n")
        .map((line) => normalizeText(line))
        .filter(Boolean);

    if (lines.length === 0) return "";
    return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
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

function applyPlainBackground(node, backgroundColor = "#FFFFFF") {
    if (!node) return;

    node.style.backgroundImage = "none";
    node.style.backgroundColor = backgroundColor;
    node.style.backgroundSize = "auto";
    node.style.backgroundPosition = "center center";
    node.style.backgroundRepeat = "no-repeat";

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

function applyInvitationData(root, invitationData) {
    const guest = invitationData?.guest || defaultSchema.guest;
    const bride = invitationData?.couple?.bride || defaultSchema.couple.bride;
    const groom = invitationData?.couple?.groom || defaultSchema.couple.groom;
    const event = invitationData?.event || defaultSchema.event;
    const copy = invitationData?.copy || defaultSchema.copy;
    const features = invitationData?.features || defaultSchema.features;
    const heroPhoto = invitationData?.couple?.heroPhoto || bride?.photo || groom?.photo || "";
    const bridePhoto = bride?.photo || heroPhoto;
    const groomPhoto = groom?.photo || heroPhoto;
    const closingBackgroundPhoto = copy?.closingBackgroundPhoto || heroPhoto;
    const story = Array.isArray(invitationData?.lovestory) ? invitationData.lovestory : [];

    const replaceExactText = (selector, fromText, toText) => {
        const fromNormalized = normalizeText(fromText);
        root.querySelectorAll(selector).forEach((node) => {
            if (normalizeText(node.textContent) === fromNormalized) {
                node.textContent = toText;
            }
        });
    };

    const textSelector = ".elementor-widget-container p, .elementor-heading-title";
    const livestreamSection = root.querySelector(".elementor-element-3454b083");
    const loveStorySection = root.querySelector(".elementor-element-45557bd0");
    const weddingGiftSection = root.querySelector(".elementor-element-66660311");

    if (livestreamSection) {
        if (!features?.livestreamEnabled || !event?.livestream?.url) {
            livestreamSection.style.display = "none";
        } else {
            livestreamSection.style.removeProperty("display");
        }
    }

    if (loveStorySection) {
        if (story.length === 0) {
            loveStorySection.style.display = "none";
        } else {
            loveStorySection.style.removeProperty("display");
        }
    }

    if (weddingGiftSection) {
        if (!features?.digitalEnvelopeEnabled) {
            weddingGiftSection.style.display = "none";
        } else {
            weddingGiftSection.style.removeProperty("display");
        }
    }

    applyClassicBackground(root.querySelector(".elementor-element-ccde1df"), heroPhoto, "center center");
    applyClassicBackground(root.querySelector(".elementor-element-5e20c489"), heroPhoto, "top center");
    applyPlainBackground(root.querySelector(".elementor-element-60c0aa66"));
    applyClassicBackground(root.querySelector(".elementor-element-5e9a05f9"), bridePhoto, "center top");
    applyClassicBackground(root.querySelector(".elementor-element-d09adc4"), groomPhoto, "center top");
    applySlideshowBackground(root.querySelector(".elementor-element-6473a34e"), [event?.akad?.coverPhoto || heroPhoto], "center center");
    applySlideshowBackground(
        root.querySelector(".elementor-element-3753b014"),
        [event?.resepsi?.coverPhoto || event?.akad?.coverPhoto || heroPhoto],
        "center center",
    );
    applyClassicBackground(root.querySelector(".elementor-element-2d9b9ee9"), closingBackgroundPhoto, "center center");

    replaceExactText(textSelector, "Nama Tamu", guest?.name || "Nama Tamu");
    replaceExactText(textSelector, "DEAR", guest?.greetingLabel || "DEAR");

    const coupleUpper = `${(groom?.nickName || "").toUpperCase()} & ${(bride?.nickName || "").toUpperCase()}`;
    const coupleMixed = `${groom?.nickName || ""} & ${bride?.nickName || ""}`;
    const coupleCover = `${(bride?.nickName || "").toUpperCase()} &\n${(groom?.nickName || "").toUpperCase()}`;

    replaceExactText(textSelector, "HABIB & ADIBA", coupleUpper);
    replaceExactText(textSelector, "Habib & Adiba", coupleMixed);
    replaceExactText(textSelector, "ADIBA & HABIB", coupleCover.replace("\n", " "));

    const coverNameNode = root.querySelector(".elementor-element-5684b07c .elementor-widget-container p");
    if (coverNameNode) {
        coverNameNode.innerHTML = `${escapeHtml((bride?.nickName || "").toUpperCase())} &<br>${escapeHtml((groom?.nickName || "").toUpperCase())}`;
    }

    const heroDateNode = root.querySelector(".elementor-element-4132155d .elementor-heading-title");
    if (heroDateNode) {
        heroDateNode.textContent = formatHeroDate(event?.dateISO || contentDefaults.event.dateISO);
    }

    const openingTitleNodes = root.querySelectorAll(".elementor-element-7418af33 .elementor-heading-title, .elementor-element-6ce9d9b2 .elementor-heading-title");
    openingTitleNodes.forEach((node) => {
        node.textContent = copy?.openingGreeting || contentDefaults.copy.openingGreeting;
    });

    const heroCoupleNode = root.querySelector(".elementor-element-49774995 .elementor-widget-container p");
    if (heroCoupleNode) {
        heroCoupleNode.textContent = coupleUpper;
    }

    const closingCoupleNode = root.querySelector(".elementor-element-4d59d626 .elementor-widget-container p");
    if (closingCoupleNode) {
        closingCoupleNode.textContent = coupleMixed;
    }

    const brideNameNode = root.querySelector(".elementor-element-3691123a .elementor-widget-container p");
    if (brideNameNode) brideNameNode.textContent = bride?.nameFull || contentDefaults.couple.bride.nameFull;

    const groomNameNode = root.querySelector(".elementor-element-76957541 .elementor-widget-container p");
    if (groomNameNode) groomNameNode.textContent = groom?.nameFull || contentDefaults.couple.groom.nameFull;

    const brideParentNode = root.querySelector(".elementor-element-54ea39aa .elementor-widget-container");
    if (brideParentNode) {
        brideParentNode.innerHTML = toParagraphsHtml(bride?.parentInfo || contentDefaults.couple.bride.parentInfo);
    }

    const groomParentNode = root.querySelector(".elementor-element-b6ae9c5 .elementor-widget-container");
    if (groomParentNode) {
        groomParentNode.innerHTML = toParagraphsHtml(groom?.parentInfo || contentDefaults.couple.groom.parentInfo);
    }

    const initialLeftNode = root.querySelector(".elementor-element-ed50e46 .elementor-widget-container p");
    if (initialLeftNode) initialLeftNode.textContent = (groom?.nickName || "H").slice(0, 1).toUpperCase();

    const initialRightNode = root.querySelector(".elementor-element-792ec40e .elementor-widget-container p");
    if (initialRightNode) initialRightNode.textContent = (bride?.nickName || "A").slice(0, 1).toUpperCase();

    const quoteNode = root.querySelector(".elementor-element-30e0cda1 .elementor-widget-container p");
    if (quoteNode && copy?.quote) quoteNode.textContent = `“${copy.quote}”`;

    const quoteSourceNode = root.querySelector(".elementor-element-26c4c5c2 .elementor-widget-container p");
    if (quoteSourceNode && copy?.quoteSource) quoteSourceNode.textContent = copy.quoteSource;

    const closingTextNode = root.querySelector(".elementor-element-1ad39f7d .elementor-widget-container");
    if (closingTextNode && copy?.closingText) closingTextNode.textContent = copy.closingText;

    const closingLabelNode = root.querySelector(".elementor-element-522da8cf .elementor-widget-container p");
    if (closingLabelNode && contentDefaults?.copy?.closingLabel) {
        closingLabelNode.textContent = contentDefaults.copy.closingLabel;
    }

    const instagramNodes = root.querySelectorAll(".elementor-social-icon-instagram");
    if (instagramNodes[0]) {
        instagramNodes[0].setAttribute("href", toInstagramUrl(bride?.instagram || contentDefaults.couple.bride.instagram));
    }
    if (instagramNodes[1]) {
        instagramNodes[1].setAttribute("href", toInstagramUrl(groom?.instagram || contentDefaults.couple.groom.instagram));
    }

    const akadParts = formatEventDateParts(event?.akad?.date || event?.dateISO);
    const resepsiParts = formatEventDateParts(event?.resepsi?.date || event?.dateISO);

    const akadDateNode = root.querySelector(".elementor-element-8b397ef .elementor-widget-container");
    if (akadDateNode) {
        akadDateNode.innerHTML = `<p><strong>${escapeHtml(akadParts.dayName)}</strong></p><p>${escapeHtml(akadParts.month)}</p><p>${escapeHtml(akadParts.year)}</p>`;
    }

    const resepsiDateNode = root.querySelector(".elementor-element-46644125 .elementor-widget-container");
    if (resepsiDateNode) {
        resepsiDateNode.innerHTML = `<p><strong>${escapeHtml(resepsiParts.dayName)}</strong></p><p>${escapeHtml(resepsiParts.month)}</p><p>${escapeHtml(resepsiParts.year)}</p>`;
    }

    const akadTimeNode = root.querySelector(".elementor-element-13c0ee27 .elementor-button-text");
    if (akadTimeNode) akadTimeNode.textContent = event?.akad?.time || contentDefaults.event.akad.time;

    const resepsiTimeNode = root.querySelector(".elementor-element-5f1d1df .elementor-button-text");
    if (resepsiTimeNode) resepsiTimeNode.textContent = event?.resepsi?.time || contentDefaults.event.resepsi.time;

    const akadLocationNode = root.querySelector(".elementor-element-670a9ebc .elementor-widget-container p");
    if (akadLocationNode) {
        akadLocationNode.innerHTML = escapeHtml(event?.akad?.address || contentDefaults.event.akad.address).replace(/,\s*/g, "<br>");
    }

    const resepsiLocationNode = root.querySelector(".elementor-element-1439661e .elementor-widget-container p");
    if (resepsiLocationNode) {
        resepsiLocationNode.innerHTML = escapeHtml(event?.resepsi?.address || contentDefaults.event.resepsi.address).replace(/,\s*/g, "<br>");
    }

    const mapsButtons = root.querySelectorAll(".elementor-element-69f16928 .elementor-button, .elementor-element-6a78504b .elementor-button");
    mapsButtons.forEach((button, index) => {
        const url = index === 0
            ? event?.akad?.mapsUrl || contentDefaults.event.akad.mapsUrl
            : event?.resepsi?.mapsUrl || contentDefaults.event.resepsi.mapsUrl;
        button.setAttribute("href", url);
        button.setAttribute("target", "_blank");
        button.setAttribute("rel", "noreferrer");
    });

    const livestreamButton = root.querySelector(".elementor-element-7880b5a .elementor-button");
    if (livestreamButton) {
        livestreamButton.setAttribute("href", event?.livestream?.url || contentDefaults.event.livestream.url);
        livestreamButton.setAttribute("target", "_blank");
        livestreamButton.setAttribute("rel", "noreferrer");
    }

    const storyDateSelectors = [
        ".elementor-element-625c7140 .elementor-widget-container p",
        ".elementor-element-4d9f19bd .elementor-widget-container p",
        ".elementor-element-5f1039e7 .elementor-widget-container p",
    ];

    const storyTextSelectors = [
        ".elementor-element-26d19f73 .elementor-widget-container p",
        ".elementor-element-10a0badf .elementor-widget-container p",
        ".elementor-element-5158299e .elementor-widget-container p",
    ];

    storyDateSelectors.forEach((selector, index) => {
        const node = root.querySelector(selector);
        if (node) {
            node.textContent = story[index]?.title || node.textContent;
        }
    });

    storyTextSelectors.forEach((selector, index) => {
        const node = root.querySelector(selector);
        if (node) {
            node.textContent = story[index]?.text || node.textContent;
        }
    });

    const galleryItems = Array.isArray(invitationData?.gallery)
        ? invitationData.gallery.filter(Boolean)
        : [];

    const galleryAnchors = root.querySelectorAll(".elementor-element-de5b844 .e-gallery-item");
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

    const bankList = features?.digitalEnvelopeInfo?.bankList || contentDefaults?.gift?.bankList || [];

    const accountNodes = [
        root.querySelector(".elementor-element-7b1e080b .elementor-heading-title"),
        root.querySelector(".elementor-element-41f3afb6 .elementor-heading-title"),
    ];

    const accountNameNodes = [
        root.querySelector(".elementor-element-482f7813 .elementor-heading-title"),
        root.querySelector(".elementor-element-2c10eab3 .elementor-heading-title"),
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

    const shippingContainer = root.querySelector(".elementor-element-559e5fe7 .elementor-widget-container");
    if (shippingContainer) {
        const shipping = contentDefaults?.gift?.shipping || {};
        shippingContainer.innerHTML = `<p>Nama Penerima : ${escapeHtml(shipping.recipient || groom?.nameFull || "-")}</p><p>No. HP : ${escapeHtml(shipping.phone || "-")}</p><p>${escapeHtml(shipping.address || event?.akad?.address || "-")}</p>`;
    }

    const wishesTitleNode = root.querySelector(".elementor-element-4f6ec03e .elementor-widget-container p");
    if (wishesTitleNode && contentDefaults?.wishes?.title) {
        wishesTitleNode.textContent = contentDefaults.wishes.title;
    }
}

function renderWishList(listElement, wishes) {
    if (!listElement) return;
    listElement.innerHTML = "";

    const items = Array.isArray(wishes) ? wishes : [];
    items.forEach((wish) => {
        const item = document.createElement("li");
        item.className = "cui-item-comment";
        const meta = [wish?.createdAt, wish?.attendance].filter((part) => normalizeText(part));

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
            if (item?.attendance === "Hadir") acc.hadir += 1;
            if (item?.attendance === "Tidak Hadir") acc.tidakHadir += 1;
            return acc;
        },
        { hadir: 0, tidakHadir: 0 }
    );

    const hadirNode = root.querySelector(".cui_card-hadir span:first-child");
    const tidakHadirNode = root.querySelector(".cui_card-tidak_hadir span:first-child");
    if (hadirNode) hadirNode.textContent = String(summary.hadir);
    if (tidakHadirNode) tidakHadirNode.textContent = String(summary.tidakHadir);

    const commentsCounter = root.querySelector("#cui-link-5749 span");
    if (commentsCounter) commentsCounter.textContent = String(Array.isArray(wishes) ? wishes.length : 0);
}

function collectWishesFromDom(root) {
    return Array.from(root.querySelectorAll("#cui-container-comment-5749 .cui-item-comment")).map((node) => ({
        author: normalizeText(node.querySelector(".cui-commenter-name")?.textContent || "Tamu"),
        comment: normalizeText(node.querySelector(".cui-comment-text")?.textContent || ""),
        attendance: "-",
        createdAt: normalizeText(node.querySelector(".cui-comment-time")?.textContent || "Baru saja"),
    }));
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

    containers.forEach((container) => {
        const visibleItems = Array.from(container.querySelectorAll(".e-gallery-item")).filter(
            (item) => window.getComputedStyle(item).display !== "none"
        );
        const columns = Math.min(3, Math.max(1, visibleItems.length || 1));

        container.style.display = "grid";
        container.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
        container.style.width = "100%";
        container.style.maxWidth = "100%";
        container.style.gap = "10px";
        container.style.paddingBottom = "0";
        container.style.position = "relative";
        container.style.justifyItems = "stretch";
        container.style.alignItems = "stretch";
    });

    root.querySelectorAll(".elementor-gallery__container .e-gallery-item").forEach((item) => {
        item.style.position = "relative";
        item.style.width = "100%";
        item.style.maxWidth = "100%";
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

export default function NoirMinimalistTemplate({
    data: externalData,
    invitationSlug = "noir-minimalist",
    mode = "live",
    onSubmitWish,
    onFetchWishes,
}) {
    const { data: fetchedData } = useInvitationData(invitationSlug, {
        fallbackSlug: "noir-minimalist",
        skipFetch: Boolean(externalData),
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
        applyInvitationData(root, mergedData);
        buildGalleryFallbackLayout(root);

        root.querySelectorAll(".elementor-counter-number[data-to-value]").forEach((node) => {
            node.textContent = node.getAttribute("data-to-value") || node.textContent;
        });

        const runtimeStyle = document.createElement("style");
        runtimeStyle.textContent = `
          .noir-minimalist-template .elementor-element-60c0aa66,
          .noir-minimalist-template .elementor-element-60c0aa66 > .elementor-motion-effects-container > .elementor-motion-effects-layer {
            background-image: none !important;
            background-color: #ffffff !important;
            background-size: auto !important;
            background-position: center center !important;
          }
          .noir-minimalist-template .elementor-element-60c0aa66::before,
          .noir-minimalist-template .elementor-element-60c0aa66 > .elementor-background-video-container::before,
          .noir-minimalist-template .elementor-element-60c0aa66 > .e-con-inner > .elementor-background-video-container::before,
          .noir-minimalist-template .elementor-element-60c0aa66 > .elementor-background-slideshow::before,
          .noir-minimalist-template .elementor-element-60c0aa66 > .e-con-inner > .elementor-background-slideshow::before,
          .noir-minimalist-template .elementor-element-60c0aa66 > .elementor-motion-effects-container > .elementor-motion-effects-layer::before {
            background-image: none !important;
            background-color: transparent !important;
          }
          
          .noir-minimalist-template .elementor-element-66fba9cb {
            position: fixed !important;
            right: 14px !important;
            bottom: 88px !important;
            z-index: ${tokens.zIndex.floatingAudio} !important;
            margin: 0 !important;
            width: auto !important;
            max-width: none !important;
          }
          .noir-minimalist-template #audio-container {
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
          .noir-minimalist-template #audio-container .elementor-icon {
            color: #ffffff !important;
          }
          .noir-minimalist-template #cui-wrap-commnent-5749 {
            display: block;
          }
          .noir-minimalist-template #cui-box {
            display: block !important;
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

        const missingFiles = ["Picture5-1.webp", "bg-bank.webp", "p-1.jpg", "p-2.jpg"];
        // Keep this warning visible until user supplies original files for strict parity.
        console.warn("[noir-minimalist] Missing source assets:", missingFiles.join(", "));

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
        const coverColumn = root.querySelector("#kolom");

        const handleOpenInvitation = (event) => {
            event.preventDefault();
            if (isOpened) return;

            isOpened = true;
            setOpened(true);
            activateMotionText();

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

        if (behavior.countdown.enabled) {
            const targetDate = mergedData?.event?.dateISO || contentDefaults?.event?.dateISO;
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
            const revealSelector = ".ef, .reveal, .revealin, .revealkanan, .revealkiri, .revealatas, .revealr";
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
                    const groupAnchors = Array.from(root.querySelectorAll(selector)).filter(
                        (item) => window.getComputedStyle(item).display !== "none"
                    );
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
            const wishesLink = root.querySelector("#cui-link-5749");
            const wishesWrap = root.querySelector("#cui-wrap-commnent-5749");
            const wishesBox = root.querySelector("#cui-box");
            const wishesList = root.querySelector("#cui-container-comment-5749");
            const wishForm = root.querySelector("#commentform-5749");

            if (wishesWrap) wishesWrap.style.display = "block";
            if (wishesBox) wishesBox.style.display = "block";
            if (wishesList) wishesList.style.display = "block";

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

            const initialWishes = contentDefaults?.wishes?.initial || [];
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

                    const formData = new FormData(wishForm);
                    const payload = {
                        author: normalizeText(formData.get("author") || mergedData?.guest?.name || "Tamu"),
                        comment: normalizeText(formData.get("comment") || ""),
                        attendance: normalizeText(formData.get("konfirmasi") || "-"),
                        createdAt: "Baru saja",
                    };

                    if (!payload.comment) return;

                    try {
                        await postInvitationWish("noir-minimalist", payload);
                    } catch {
                        // keep optimistic local render
                    }

                    const currentWishes = collectWishesFromDom(root);
                    const nextWishes = [payload, ...currentWishes];
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
            const particlesTarget = root.querySelector("#particles-js");
            if (particlesTarget) {
                loadScriptOnce(resolveAssetUrl("assets/vendor/particles.min.js"), "particles")
                    .then(() => {
                        if (typeof window.particlesJS !== "function") return;
                        particlesTarget.querySelectorAll(".particles-js-canvas-el").forEach((node) => node.remove());
                        window.particlesJS("particles-js", PARTICLES_CONFIG);
                    })
                    .catch(() => { });
            }
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
            <div className="noir-minimalist-template" ref={rootRef} />
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
