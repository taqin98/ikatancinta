import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { postInvitationWish } from "../../../services/wishesApi";
import { getPackageConfig } from "../../../data/packageCatalog";
import { upsertGuestQrSection } from "../../../utils/invitationGuestQr";
import rawBodyHtml from "./source-body.html?raw";
import schemaJson from "./schema/schema.json";
import defaultSchema from "./schema/invitationSchema";
import tokens from "./tokens";
import {
    PUBLIC_ASSET_PREFIX,
    PUBLIC_TEMPLATE_PREFIX,
    copyToClipboard,
    escapeHtml,
    formatAddressHtml,
    formatParentInfoHtml,
    formatWishRelativeTime,
    loadScriptOnce,
    normalizeText,
    parseDataSettings,
    resolveAssetUrl,
    rewriteSrcset,
    sanitizeTemplateHtml,
    setDynamicVh,
    slideToggleElement,
    toInstagramUrl,
    updateCountdownNode,
} from "./helper";

const BODY_CLASSES = [
    "wp-singular",
    "page-template-default",
    "page",
    "page-id-13544",
    "wp-embed-responsive",
    "wp-theme-hello-elementor",
    "hello-elementor-default",
    "elementor-default",
    "elementor-template-canvas",
    "elementor-kit-5",
    "elementor-page",
    "elementor-page-13544",
];

const STYLE_LINK_ID = "botanical-elegance-style";
const STYLE_HREF = `${PUBLIC_TEMPLATE_PREFIX}style.css?v=20260306-1`;
const LOTTIE_HREF = `${PUBLIC_ASSET_PREFIX}vendor/elementor-pro/assets/lib/lottie/lottie.min.js`;
const WISHES_STORAGE_KEY = "premium_01_ucapan_13544";
const DEFAULT_AUDIO_SRC = "assets/media/audio/Howl-s-Moving-FULL-CUT.mp3";
const DEFAULT_BCA_LOGO = "assets/media/uploads/2025/11/BCA_logo_Bank_Central_Asia-1-3-5-scaled.png";
const DEFAULT_DANA_LOGO = "assets/media/uploads/2025/11/1200px-Logo_dana_blue.svg-1-1-1.png";
const DEFAULT_BANK_CHIP = "assets/media/uploads/2025/11/chip-atm-1-2-4.png";

function mergeInvitationData(base, ...sources) {
    const output = JSON.parse(JSON.stringify(base || {}));

    sources.forEach((source) => {
        if (!source || typeof source !== "object") return;

        Object.keys(source).forEach((key) => {
            const value = source[key];
            if (Array.isArray(value)) {
                output[key] = [...value];
                return;
            }

            if (value && typeof value === "object") {
                const current = output[key] && typeof output[key] === "object" && !Array.isArray(output[key]) ? output[key] : {};
                output[key] = { ...current, ...value };
                return;
            }

            output[key] = value;
        });
    });

    output.guest = { ...(base?.guest || {}), ...(output.guest || {}) };
    output.groom = { ...(base?.groom || {}), ...(output.groom || {}) };
    output.bride = { ...(base?.bride || {}), ...(output.bride || {}) };
    output.event = { ...(base?.event || {}), ...(output.event || {}) };
    output.event.akad = { ...(base?.event?.akad || {}), ...(output.event?.akad || {}) };
    output.event.resepsi = { ...(base?.event?.resepsi || {}), ...(output.event?.resepsi || {}) };
    output.streaming = { ...(base?.streaming || {}), ...(output.streaming || {}) };
    output.gifts = { ...(base?.gifts || {}), ...(output.gifts || {}) };
    output.gifts.shipping = { ...(base?.gifts?.shipping || {}), ...(output.gifts?.shipping || {}) };
    output.gift = { ...(base?.gift || {}), ...(output.gift || {}) };
    output.gift.shipping = { ...(base?.gift?.shipping || {}), ...(output.gift?.shipping || {}) };
    output.copy = { ...(base?.copy || {}), ...(output.copy || {}) };
    output.features = { ...(base?.features || {}), ...(output.features || {}) };
    output.audio = { ...(base?.audio || {}), ...(output.audio || {}) };
    output.couple = { ...(base?.couple || {}), ...(output.couple || {}) };
    output.couple.groom = { ...(base?.couple?.groom || {}), ...(output.couple?.groom || {}) };
    output.couple.bride = { ...(base?.couple?.bride || {}), ...(output.couple?.bride || {}) };
    output.invitation = { ...(base?.invitation || {}), ...(output.invitation || {}) };
    output.order = { ...(base?.order || {}), ...(output.order || {}) };

    return output;
}

function pickText(...values) {
    for (const value of values) {
        if (value === null || value === undefined) continue;
        if (typeof value === "object") continue;
        const text = String(value).replace(/\s+/g, " ").trim();
        if (text) return text;
    }
    return "";
}

function getNameInitial(value) {
    const text = pickText(value);
    if (!text) return "";
    return text.charAt(0).toUpperCase();
}

function pickAsset(...values) {
    for (const value of values) {
        if (!value) continue;
        if (typeof value === "string") {
            const text = pickText(value);
            if (text) return text;
            continue;
        }
        if (typeof value === "object") {
            const text = pickText(value.url, value.src, value.image, value.photo, value.imageUrl, value.fileUrl, value.dataUrl);
            if (text) return text;
        }
    }
    return "";
}

function resolveInvitationSlug(data, fallback = "") {
    return pickText(data?.invitation?.slug, data?.invitationSlug, data?.invitation_slug, data?.slug, fallback);
}

function resolveOrderId(data, fallback = "") {
    return pickText(
        data?.invitation?.orderId,
        data?.invitation?.order_id,
        data?.invitation?.id,
        data?.orderId,
        data?.order_id,
        data?.order?.orderId,
        data?.order?.order_id,
        data?.order?.id,
        data?.data?.orderId,
        data?.data?.order_id,
        data?.data?.order?.orderId,
        data?.data?.order?.order_id,
        data?.data?.order?.id,
        fallback
    );
}

function resolvePackageTier(data, fallback = "") {
    return pickText(
        data?.selectedPackage?.tier,
        data?.packageTier,
        data?.selectedTheme?.packageTier,
        data?.theme?.packageTier,
        data?.order?.packageTier,
        data?.data?.packageTier,
        fallback
    );
}

function resolveLivestreamCapability(data) {
    if (typeof data?.selectedPackage?.capabilities?.livestream === "boolean") {
        return data.selectedPackage.capabilities.livestream;
    }

    if (typeof data?.order?.selectedPackage?.capabilities?.livestream === "boolean") {
        return data.order.selectedPackage.capabilities.livestream;
    }

    const packageTier = resolvePackageTier(data);
    if (!packageTier) return false;

    return Boolean(getPackageConfig(packageTier)?.capabilities?.livestream);
}

function formatDateID(value) {
    const text = pickText(value);
    if (!text) return "";
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return text;
    return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatCompactDateInput(...values) {
    for (const value of values) {
        const text = pickText(value);
        if (!text) continue;

        const isoDateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoDateMatch) {
            return `${isoDateMatch[3]}. ${isoDateMatch[2]}. ${isoDateMatch[1]}`;
        }

        const date = new Date(text);
        if (!Number.isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = String(date.getFullYear());
            return `${day}. ${month}. ${year}`;
        }
    }

    return "";
}

function formatTimeRange(start, end) {
    const startText = pickText(start);
    const endText = pickText(end);
    if (!startText) return "";
    if (/(pukul|wib|selesai)/i.test(startText)) return startText;

    const normalizedStart = startText.replace(":", ".");
    if (!endText) return `Pukul ${normalizedStart} WIB`;

    const normalizedEnd = endText.replace(":", ".");
    return `Pukul ${normalizedStart} WIB s/d ${normalizedEnd} WIB`;
}

function buildDateISO(dateValue, timeValue, fallback = "") {
    const dateText = pickText(dateValue);
    if (!dateText) return pickText(fallback);

    if (/^\d{4}-\d{2}-\d{2}T/i.test(dateText)) {
        return dateText;
    }

    const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
        const timeMatch = pickText(timeValue).match(/(\d{1,2})[:.](\d{2})/);
        const hour = String(timeMatch ? Number(timeMatch[1]) : 9).padStart(2, "0");
        const minute = timeMatch ? timeMatch[2] : "00";
        return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${hour}:${minute}:00+07:00`;
    }

    const parsed = new Date(dateText);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    return pickText(fallback);
}

function inferStreamingLabel(url, fallback = "") {
    const raw = String(url || "").trim().toLowerCase();
    if (!raw) return pickText(fallback, "Live Streaming");
    if (raw.includes("youtube.com") || raw.includes("youtu.be")) return "YouTube Live";
    if (raw.includes("instagram.com")) return "Instagram Live";
    if (raw.includes("zoom.us")) return "Zoom Meeting";
    if (raw.includes("tiktok.com")) return "TikTok Live";
    return pickText(fallback, "Live Streaming");
}

function normalizeRuntimeStory(item) {
    if (typeof item === "string") {
        const text = pickText(item);
        return text ? { title: "", description: text, text } : null;
    }
    if (!item || typeof item !== "object") return null;

    const title = pickText(item.title, item.storyTitle, item.story_title, item.heading, item.headline, item.judul, item.name, item.label);
    const description = pickText(item.description, item.text, item.story, item.storyText, item.story_text, item.content, item.body);
    const date = pickText(item.date, item.year, item.period, item.momentDate, item.moment_date);

    if (!title && !description && !date) return null;

    return {
        title,
        description,
        text: description,
        date,
    };
}

function normalizeGalleryItem(item) {
    if (typeof item === "string") return pickText(item);
    if (!item || typeof item !== "object") return "";
    return pickAsset(item.url, item.src, item.image, item.photo, item.imageUrl);
}

function normalizeBankAccount(item) {
    if (!item || typeof item !== "object") return null;

    const bankName = pickText(item.bankName, item.bank, item.provider, item.title);
    const accountNumber = pickText(item.accountNumber, item.account, item.number);
    const accountHolder = pickText(item.accountHolder, item.accountName, item.name);
    const normalizedBankName = bankName.toLowerCase();
    const logo = pickAsset(item.logo, item.image, normalizedBankName.includes("bca") ? DEFAULT_BCA_LOGO : "", normalizedBankName.includes("dana") ? DEFAULT_DANA_LOGO : "");
    const chip = pickAsset(item.chip, normalizedBankName.includes("dana") ? "" : DEFAULT_BANK_CHIP);

    if (!bankName && !accountNumber && !accountHolder && !logo) return null;

    return {
        bankName,
        accountNumber,
        accountHolder,
        logo,
        chip,
    };
}

function pickStreamingSource(...candidates) {
    const normalizedCandidates = candidates.filter((candidate) => candidate && typeof candidate === "object");
    for (const candidate of normalizedCandidates) {
        const hasUrl = Boolean(pickText(candidate.url, candidate.link));
        const hasLabel = Boolean(pickText(candidate.label, candidate.platformLabel));
        const hasDate = Boolean(pickText(candidate.date));
        const hasTime = Boolean(pickText(candidate.time));
        const isEnabled = candidate.enabled === true;
        if (hasUrl || hasLabel || hasDate || hasTime || isEnabled) {
            return candidate;
        }
    }
    return normalizedCandidates[0] || {};
}

function buildRuntimeInvitationData(incomingData, baseSchema) {
    if (!incomingData || typeof incomingData !== "object") return {};

    const orderPayload =
        incomingData.order?.payload ||
        incomingData.payload ||
        incomingData.data?.payload ||
        incomingData.orderPayload ||
        {};

    const hasRawPayload = Boolean(
        incomingData.groom ||
            incomingData.bride ||
            incomingData.akad ||
            incomingData.resepsi ||
            incomingData.frontCoverImage ||
            incomingData.coverImage ||
            incomingData.galleryImages ||
            incomingData.gallery ||
            incomingData.stories ||
            incomingData.lovestory ||
            incomingData.loveStory ||
            incomingData.streaming ||
            incomingData.livestream ||
            incomingData.gift ||
            incomingData.gifts ||
            incomingData.giftInfo ||
            incomingData.quote ||
            incomingData.quoteSource ||
            orderPayload.groom ||
            orderPayload.bride ||
            orderPayload.akad ||
            orderPayload.resepsi ||
            orderPayload.frontCoverImage ||
            orderPayload.coverImage ||
            orderPayload.galleryImages ||
            orderPayload.gallery ||
            orderPayload.stories ||
            orderPayload.lovestory ||
            orderPayload.loveStory ||
            orderPayload.streaming ||
            orderPayload.livestream ||
            orderPayload.gift ||
            orderPayload.gifts ||
            orderPayload.giftInfo ||
            orderPayload.quote ||
            orderPayload.quoteSource
    );

    if (!hasRawPayload) return {};

    const groom = orderPayload.groom || incomingData.groom || {};
    const bride = orderPayload.bride || incomingData.bride || {};
    const akad = orderPayload.akad || incomingData.akad || {};
    const resepsi = orderPayload.resepsi || incomingData.resepsi || {};
    const rawStories = Array.isArray(orderPayload.stories)
        ? orderPayload.stories
        : Array.isArray(orderPayload.loveStory)
          ? orderPayload.loveStory
          : Array.isArray(orderPayload.lovestory)
            ? orderPayload.lovestory
            : Array.isArray(incomingData.stories)
              ? incomingData.stories
              : Array.isArray(incomingData.loveStory)
                ? incomingData.loveStory
                : Array.isArray(incomingData.lovestory)
                  ? incomingData.lovestory
                  : [];
    const runtimeStories = rawStories.map(normalizeRuntimeStory).filter(Boolean);
    const rawGallery = Array.isArray(orderPayload.galleryImages)
        ? orderPayload.galleryImages
        : Array.isArray(orderPayload.gallery)
          ? orderPayload.gallery
          : Array.isArray(incomingData.galleryImages)
            ? incomingData.galleryImages
            : Array.isArray(incomingData.gallery)
              ? incomingData.gallery
              : [];
    const runtimeGallery = rawGallery.map(normalizeGalleryItem).filter(Boolean);
    const rawStreaming = pickStreamingSource(
        orderPayload.livestream,
        orderPayload.streaming,
        orderPayload.event?.livestream,
        incomingData.livestream,
        incomingData.event?.livestream,
        incomingData.streaming
    );
    const runtimeStreamingUrl = pickText(rawStreaming.url, rawStreaming.link);
    const rawGift =
        orderPayload.gift ||
        orderPayload.giftInfo ||
        orderPayload.gifts ||
        incomingData.gift ||
        incomingData.giftInfo ||
        incomingData.gifts ||
        {};
    const runtimeFeatures = {
        ...(incomingData.features || {}),
        ...(orderPayload.features || {}),
    };
    const runtimeLivestreamEnabled =
        orderPayload.features?.livestreamEnabled ??
        incomingData.features?.livestreamEnabled;
    const runtimeLivestreamCapability = resolveLivestreamCapability({
        ...incomingData,
        selectedPackage: incomingData?.selectedPackage || orderPayload?.selectedPackage,
        packageTier: resolvePackageTier(incomingData, pickText(orderPayload?.packageTier, orderPayload?.selectedTheme?.packageTier)),
    });
    const runtimeBankList = Array.isArray(rawGift.bankList)
        ? rawGift.bankList
        : Array.isArray(rawGift.bankAccounts)
          ? rawGift.bankAccounts
          : [];
    const runtimeDateISO = buildDateISO(akad.date, akad.startTime || akad.time, pickText(incomingData?.event?.dateISO, baseSchema?.event?.dateISO));
    const runtimeInvitationSlug = resolveInvitationSlug(incomingData, resolveInvitationSlug(baseSchema));
    const runtimeOrderId = resolveOrderId(incomingData, resolveOrderId(baseSchema));

    return {
        invitation: {
            ...(incomingData.invitation || {}),
            slug: runtimeInvitationSlug,
            orderId: runtimeOrderId,
        },
        orderId: runtimeOrderId,
        guest: {
            ...(orderPayload.guest || incomingData.guest || {}),
        },
        groom: {
            fullName: pickText(groom.fullname, groom.fullName, groom.nameFull),
            nickName: pickText(groom.nickname, groom.nickName, groom.fullname?.split?.(" ")[0]),
            parentInfo: pickText(groom.parents, groom.parentInfo),
            instagram: pickText(groom.instagram),
            image: pickAsset(groom.photo, groom.image),
            photo: pickAsset(groom.photo, groom.image),
        },
        bride: {
            fullName: pickText(bride.fullname, bride.fullName, bride.nameFull),
            nickName: pickText(bride.nickname, bride.nickName, bride.fullname?.split?.(" ")[0]),
            parentInfo: pickText(bride.parents, bride.parentInfo),
            instagram: pickText(bride.instagram),
            image: pickAsset(bride.photo, bride.image),
            photo: pickAsset(bride.photo, bride.image),
        },
        couple: {
            groom: {
                nameFull: pickText(groom.fullname, groom.fullName, groom.nameFull),
                nickName: pickText(groom.nickname, groom.nickName, groom.fullname?.split?.(" ")[0]),
                parentInfo: pickText(groom.parents, groom.parentInfo),
                instagram: pickText(groom.instagram),
                photo: pickAsset(groom.photo, groom.image),
            },
            bride: {
                nameFull: pickText(bride.fullname, bride.fullName, bride.nameFull),
                nickName: pickText(bride.nickname, bride.nickName, bride.fullname?.split?.(" ")[0]),
                parentInfo: pickText(bride.parents, bride.parentInfo),
                instagram: pickText(bride.instagram),
                photo: pickAsset(bride.photo, bride.image),
            },
            frontCoverPhoto: pickAsset(orderPayload.frontCoverImage, incomingData.frontCoverImage, orderPayload.coverImage, incomingData.coverImage),
        },
        frontCoverImage: pickAsset(orderPayload.frontCoverImage, incomingData.frontCoverImage),
        coverImage: pickAsset(orderPayload.coverImage, incomingData.coverImage),
        gallery: runtimeGallery,
        loveStory: runtimeStories,
        lovestory: runtimeStories,
        stories: runtimeStories,
        streaming: {
            ...(incomingData.streaming || {}),
            url: runtimeStreamingUrl,
            label: inferStreamingLabel(runtimeStreamingUrl, pickText(rawStreaming.label, rawStreaming.platformLabel, baseSchema?.streaming?.label)),
            date: pickText(rawStreaming.date, formatDateID(akad.date), baseSchema?.streaming?.date),
            time: pickText(rawStreaming.time, formatTimeRange(akad.startTime, akad.endTime), akad.time, baseSchema?.streaming?.time),
        },
        gift: {
            ...(incomingData.gift || {}),
            bankList: runtimeBankList,
            shipping: {
                ...(rawGift.shipping || {}),
            },
        },
        gifts: {
            ...(incomingData.gifts || {}),
            bankAccounts: runtimeBankList,
            shipping: {
                ...(rawGift.shipping || {}),
            },
        },
        audio: {
            ...(incomingData.audio || {}),
            src: pickAsset(orderPayload.audio?.src, incomingData.audio?.src, orderPayload.music?.src, incomingData.music?.src),
        },
        features: {
            ...runtimeFeatures,
            livestreamEnabled: runtimeLivestreamEnabled ?? (runtimeLivestreamCapability || Boolean(runtimeStreamingUrl)),
        },
        copy: {
            ...(incomingData.copy || {}),
            quote: pickText(orderPayload.quote, incomingData.quote, incomingData.copy?.quote, baseSchema?.copy?.quote),
            quoteSource: pickText(orderPayload.quoteSource, incomingData.quoteSource, incomingData.copy?.quoteSource, baseSchema?.copy?.quoteSource),
            openingGreeting: pickText(orderPayload.copy?.openingGreeting, incomingData.copy?.openingGreeting, baseSchema?.copy?.openingGreeting),
            openingText: pickText(orderPayload.copy?.openingText, incomingData.copy?.openingText, baseSchema?.copy?.openingText),
            saveTheDateTitle: pickText(orderPayload.copy?.saveTheDateTitle, incomingData.copy?.saveTheDateTitle, baseSchema?.copy?.saveTheDateTitle),
            saveTheDateText: pickText(orderPayload.copy?.saveTheDateText, incomingData.copy?.saveTheDateText, baseSchema?.copy?.saveTheDateText),
            galleryTitle: pickText(orderPayload.copy?.galleryTitle, incomingData.copy?.galleryTitle, baseSchema?.copy?.galleryTitle),
            giftTitle: pickText(orderPayload.copy?.giftTitle, incomingData.copy?.giftTitle, baseSchema?.copy?.giftTitle),
            giftIntro: pickText(orderPayload.copy?.giftIntro, incomingData.copy?.giftIntro, baseSchema?.copy?.giftIntro),
            wishesTitle: pickText(orderPayload.copy?.wishesTitle, incomingData.copy?.wishesTitle, baseSchema?.copy?.wishesTitle),
            wishesIntro: pickText(orderPayload.copy?.wishesIntro, incomingData.copy?.wishesIntro, baseSchema?.copy?.wishesIntro),
            closingText: pickText(orderPayload.copy?.closingText, incomingData.copy?.closingText, baseSchema?.copy?.closingText),
            creditText: pickText(orderPayload.copy?.creditText, incomingData.copy?.creditText, baseSchema?.copy?.creditText),
            closingBackgroundPhoto: pickAsset(orderPayload.closingBackgroundImage, incomingData.closingBackgroundImage, incomingData.copy?.closingBackgroundPhoto),
        },
        event: {
            ...(incomingData.event || {}),
            dateISO: runtimeDateISO,
            displayDate: pickText(
                formatCompactDateInput(runtimeDateISO, akad.date, resepsi.date),
                incomingData?.event?.displayDate,
                baseSchema?.event?.displayDate
            ),
            heroImage: pickAsset(
                orderPayload.frontCoverImage,
                incomingData.frontCoverImage,
                orderPayload.coverImage,
                incomingData.coverImage,
                incomingData.event?.heroImage
            ),
            frameImage: pickAsset(orderPayload.frameImage, incomingData.frameImage, incomingData.event?.frameImage),
            dividerImage: pickAsset(orderPayload.dividerImage, incomingData.dividerImage, incomingData.event?.dividerImage),
            livestream: {
                ...(incomingData?.event?.livestream || {}),
                url: runtimeStreamingUrl,
                label: inferStreamingLabel(runtimeStreamingUrl, pickText(rawStreaming.label, rawStreaming.platformLabel, baseSchema?.streaming?.label)),
                date: pickText(rawStreaming.date, formatDateID(akad.date), baseSchema?.streaming?.date),
                time: pickText(rawStreaming.time, formatTimeRange(akad.startTime, akad.endTime), akad.time, baseSchema?.streaming?.time),
            },
            akad: {
                ...(incomingData.event?.akad || {}),
                title: pickText(akad.title, baseSchema?.event?.akad?.title),
                date: pickText(formatDateID(akad.date), akad.date, baseSchema?.event?.akad?.date),
                time: pickText(akad.time, formatTimeRange(akad.startTime, akad.endTime), baseSchema?.event?.akad?.time),
                addressName: pickText(akad.addressName, akad.venueName, akad.venue, baseSchema?.event?.akad?.addressName),
                address: pickText(akad.address, baseSchema?.event?.akad?.address),
                mapsUrl: pickText(akad.mapsLink, akad.mapsUrl, baseSchema?.event?.akad?.mapsUrl),
            },
            resepsi: {
                ...(incomingData.event?.resepsi || {}),
                title: pickText(resepsi.title, baseSchema?.event?.resepsi?.title),
                date: pickText(formatDateID(resepsi.date), resepsi.date, baseSchema?.event?.resepsi?.date),
                time: pickText(resepsi.time, formatTimeRange(resepsi.startTime, resepsi.endTime), baseSchema?.event?.resepsi?.time),
                addressName: pickText(resepsi.addressName, resepsi.venueName, resepsi.venue, baseSchema?.event?.resepsi?.addressName),
                address: pickText(resepsi.address, baseSchema?.event?.resepsi?.address),
                mapsUrl: pickText(resepsi.mapsLink, resepsi.mapsUrl, baseSchema?.event?.resepsi?.mapsUrl),
            },
        },
    };
}

function normalizeWishItem(item) {
    const author = normalizeText(item?.author || item?.name || item?.guest || "");
    const comment = normalizeText(item?.comment || item?.message || item?.wish || "");
    const attendance = normalizeText(item?.attendance || item?.konfirmasi || item?.status || "Hadir");
    const createdAt = normalizeText(item?.createdAt || item?.time || item?.date || "Baru saja");
    if (!author || !comment) return null;
    return { author, comment, attendance, createdAt };
}

function readStoredWishes() {
    try {
        const raw = window.localStorage.getItem(WISHES_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const normalized = Array.isArray(parsed) ? parsed.map(normalizeWishItem).filter(Boolean) : [];
        return normalized.length > 0 ? normalized : null;
    } catch {
        return null;
    }
}

function writeStoredWishes(entries) {
    try {
        window.localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // ignore storage failures
    }
}

export default function BotanicalEleganceTemplate({ data: propData, invitationSlug = "botanical-elegance", mode = "live" }) {
    const isStaticDemoMode = mode === "demo";
    const { data: fetchedData } = useInvitationData(invitationSlug, {
        fallbackSlug: "botanical-elegance",
        skipFetch: Boolean(propData) || isStaticDemoMode,
    });
    const mergedData = useMemo(() => {
        if (isStaticDemoMode) {
            return mergeInvitationData(defaultSchema, schemaJson);
        }

        const fetchedRuntimeData = buildRuntimeInvitationData(fetchedData, defaultSchema);
        const propRuntimeData = buildRuntimeInvitationData(propData, defaultSchema);
        const merged = mergeInvitationData(defaultSchema, schemaJson, fetchedData, propData, fetchedRuntimeData, propRuntimeData);
        const resolvedInvitationSlug = resolveInvitationSlug(merged, invitationSlug || "botanical-elegance");
        const resolvedOrderId = resolveOrderId(merged);

        return {
            ...merged,
            orderId: resolvedOrderId,
            invitation: {
                ...(merged.invitation || {}),
                slug: resolvedInvitationSlug,
                orderId: resolvedOrderId,
            },
        };
    }, [fetchedData, invitationSlug, isStaticDemoMode, propData]);
    const markup = useMemo(() => sanitizeTemplateHtml(rawBodyHtml), []);
    const fallbackWishes = useMemo(
        () => (Array.isArray(defaultSchema.wishes) ? defaultSchema.wishes : []).map(normalizeWishItem).filter(Boolean),
        []
    );

    const rootRef = useRef(null);
    const lottieInstancesRef = useRef([]);
    const audioRef = useRef(null);
    const unlockTimerRef = useRef(null);
    const [opened, setOpened] = useState(false);
    const [scrollUnlocked, setScrollUnlocked] = useState(false);
    const [lightboxImage, setLightboxImage] = useState("");
    const [wishes, setWishes] = useState(() => fallbackWishes);

    useEffect(() => {
        let styleNode = document.getElementById(STYLE_LINK_ID);
        let createdByTemplate = false;

        if (!styleNode) {
            const link = document.createElement("link");
            link.id = STYLE_LINK_ID;
            link.rel = "stylesheet";
            link.href = STYLE_HREF;
            link.setAttribute("data-template-style", "botanical-elegance");
            document.head.appendChild(link);
            styleNode = link;
            createdByTemplate = true;
        }

        return () => {
            if (createdByTemplate && styleNode?.parentNode) {
                styleNode.parentNode.removeChild(styleNode);
            }
        };
    }, []);

    useEffect(() => {
        const previousBodyClasses = BODY_CLASSES.filter((name) => document.body.classList.contains(name));
        BODY_CLASSES.forEach((name) => document.body.classList.add(name));

        setDynamicVh();
        const onResize = () => setDynamicVh();
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            document.body.classList.remove("be-lock-scroll");
            BODY_CLASSES.forEach((name) => document.body.classList.remove(name));
            previousBodyClasses.forEach((name) => document.body.classList.add(name));
        };
    }, []);

    useEffect(() => {
        AOS.init({
            once: tokens.aos.once,
            mirror: tokens.aos.mirror,
            debounceDelay: tokens.aos.debounceDelay,
            duration: 1200,
            offset: 40,
        });
    }, []);

    useEffect(() => {
        const stored = typeof window !== "undefined" ? readStoredWishes() : null;
        if (stored?.length) {
            setWishes(stored);
            return;
        }
        const next = Array.isArray(mergedData?.wishes) ? mergedData.wishes.map(normalizeWishItem).filter(Boolean) : [];
        setWishes(next.length > 0 ? next : fallbackWishes);
    }, [mergedData, fallbackWishes]);

    useEffect(
        () => () => {
            if (unlockTimerRef.current) {
                window.clearTimeout(unlockTimerRef.current);
            }
        },
        []
    );

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;

        const revealAnimatedNodes = () => {
            root.querySelectorAll(".af").forEach((node) => node.classList.add("active"));
        };

        const runReveal = () => {
            ["ef", "reveal", "revealin", "revealkanan", "revealkiri", "revealatas", "revealr"].forEach((className) => {
                root.querySelectorAll(`.${className}`).forEach((node) => {
                    const elementTop = node.getBoundingClientRect().top;
                    const visible = className === "ef" ? 100 : 150;
                    if (elementTop < window.innerHeight - visible) {
                        node.classList.add("active");
                    } else {
                        node.classList.remove("active");
                    }
                });
            });
        };

        root.querySelectorAll("[src]").forEach((node) => {
            const value = node.getAttribute("src") || "";
            const next = resolveAssetUrl(value);
            if (next && next !== value) node.setAttribute("src", next);
        });

        root.querySelectorAll("[srcset]").forEach((node) => {
            const value = node.getAttribute("srcset") || "";
            const next = rewriteSrcset(value);
            if (next && next !== value) node.setAttribute("srcset", next);
        });

        root.querySelectorAll("[data-thumbnail]").forEach((node) => {
            const value = node.getAttribute("data-thumbnail") || "";
            const next = resolveAssetUrl(value);
            if (next && next !== value) node.setAttribute("data-thumbnail", next);
        });

        root.querySelectorAll("a[href]").forEach((node) => {
            const href = node.getAttribute("href") || "";
            if (href.startsWith("?post_id=")) return;
            const next = resolveAssetUrl(href);
            if (next && next !== href) node.setAttribute("href", next);
        });

        const dateAnchorTarget = root.querySelector(".elementor-element-ee42620");
        if (dateAnchorTarget && !dateAnchorTarget.id) {
            dateAnchorTarget.id = "date";
        }

        const copy = mergedData?.copy || {};
        const groom = {
            nickName: pickText(mergedData?.groom?.nickName, mergedData?.couple?.groom?.nickName, mergedData?.couple?.groom?.nameFull?.split?.(" ")[0], "Habib"),
            fullName: pickText(mergedData?.groom?.fullName, mergedData?.groom?.nameFull, mergedData?.couple?.groom?.nameFull, "Habib Yulianto"),
            parentInfo: pickText(mergedData?.groom?.parentInfo, mergedData?.couple?.groom?.parentInfo, schemaJson.groom.parentInfo),
            instagram: pickText(mergedData?.groom?.instagram, mergedData?.couple?.groom?.instagram, "https://www.instagram.com/"),
            image: pickAsset(mergedData?.groom?.image, mergedData?.groom?.photo, mergedData?.couple?.groom?.photo, schemaJson.groom.image),
        };

        const bride = {
            nickName: pickText(mergedData?.bride?.nickName, mergedData?.couple?.bride?.nickName, mergedData?.couple?.bride?.nameFull?.split?.(" ")[0], "Adiba"),
            fullName: pickText(mergedData?.bride?.fullName, mergedData?.bride?.nameFull, mergedData?.couple?.bride?.nameFull, "Adiba Putri Syakila"),
            parentInfo: pickText(mergedData?.bride?.parentInfo, mergedData?.couple?.bride?.parentInfo, schemaJson.bride.parentInfo),
            instagram: pickText(mergedData?.bride?.instagram, mergedData?.couple?.bride?.instagram, "https://www.instagram.com/"),
            image: pickAsset(mergedData?.bride?.image, mergedData?.bride?.photo, mergedData?.couple?.bride?.photo, schemaJson.bride.image),
        };

        const guestName = pickText(mergedData?.guest?.name, schemaJson.guest?.name);
        const guestGreeting = pickText(mergedData?.guest?.greetingLabel, copy?.coverDear, "DEAR");
        const coupleDisplay = `${groom.nickName} & ${bride.nickName}`;
        const displayDate = pickText(
            mergedData?.event?.displayDate,
            formatCompactDateInput(mergedData?.event?.dateISO, mergedData?.event?.akad?.date, mergedData?.event?.resepsi?.date),
            schemaJson.event.displayDate,
            "28. 12. 2025"
        );
        const quote = pickText(copy?.quote, schemaJson.copy.quote);
        const quoteSource = pickText(copy?.quoteSource, schemaJson.copy.quoteSource);
        const openingGreeting = (() => {
            const resolved = pickText(copy?.openingGreeting, schemaJson.copy.openingGreeting, "The Wedding Of");
            return resolved.trim().toLowerCase() === "botanical elegance" ? "The Wedding Of" : resolved;
        })();
        const coupleInitial = `${getNameInitial(groom.nickName || groom.fullName)}${getNameInitial(bride.nickName || bride.fullName)}`;
        const frontCoverImage = pickAsset(
            mergedData?.frontCoverImage,
            mergedData?.couple?.frontCoverPhoto,
            schemaJson.event.heroImage
        );
        const desktopSideCoverImage = pickAsset(
            mergedData?.coverImage,
            mergedData?.event?.heroImage,
            mergedData?.frontCoverImage,
            mergedData?.couple?.frontCoverPhoto,
            schemaJson.event.heroImage
        );
        const closingImage = pickAsset(copy?.closingBackgroundPhoto, mergedData?.closingBackgroundImage, desktopSideCoverImage, frontCoverImage);
        const frameImage = pickAsset(mergedData?.event?.frameImage, schemaJson.event.frameImage);
        const dividerImage = pickAsset(mergedData?.event?.dividerImage, schemaJson.event.dividerImage);
        const akad = mergedData?.event?.akad || {};
        const resepsi = mergedData?.event?.resepsi || {};
        const streaming = {
            ...(mergedData?.streaming || {}),
            ...(mergedData?.event?.livestream || {}),
        };
        const legacyGift = mergedData?.gifts || {};
        const genericGift = mergedData?.gift || {};
        const digitalEnvelopeInfo = mergedData?.features?.digitalEnvelopeInfo || {};
        const rawBankList = [
            ...(Array.isArray(legacyGift?.bankAccounts) ? legacyGift.bankAccounts : []),
            ...(Array.isArray(genericGift?.bankList) ? genericGift.bankList : []),
            ...(Array.isArray(digitalEnvelopeInfo?.bankList) ? digitalEnvelopeInfo.bankList : []),
        ];
        const bankList = rawBankList.map(normalizeBankAccount).filter(Boolean);
        const rawShipping = {
            ...(legacyGift?.shipping || {}),
            ...(genericGift?.shipping || {}),
            ...(digitalEnvelopeInfo?.shipping || {}),
        };
        const gallery = (Array.isArray(mergedData?.gallery) ? mergedData.gallery : []).map(normalizeGalleryItem).filter(Boolean);
        const stories = (
            Array.isArray(mergedData?.loveStory)
                ? mergedData.loveStory
                : Array.isArray(mergedData?.lovestory)
                  ? mergedData.lovestory
                  : Array.isArray(mergedData?.stories)
                    ? mergedData.stories
                    : []
        )
            .map(normalizeRuntimeStory)
            .filter(Boolean);
        const hasStreaming =
            (mergedData?.features?.livestreamEnabled ?? false) ||
            resolveLivestreamCapability(mergedData) ||
            Boolean(pickText(streaming?.url));
        const hasGallery = gallery.length > 0;
        const hasStories = (mergedData?.features?.loveStory ?? true) && stories.length > 0;
        const hasShippingData = Boolean(pickText(rawShipping?.recipient, rawShipping?.phone, rawShipping?.address));
        const hasGiftSection = (mergedData?.features?.digitalEnvelopeEnabled ?? true) && (bankList.length > 0 || hasShippingData);
        const wishesEnabled = mergedData?.features?.wishesEnabled ?? true;

        const setText = (selector, value) => {
            const node = root.querySelector(selector);
            if (!node) return;
            node.textContent = value;
        };

        const setHtml = (selector, value) => {
            const node = root.querySelector(selector);
            if (!node) return;
            node.innerHTML = value;
        };

        const setLink = (selector, value) => {
            const node = root.querySelector(selector);
            if (!node || !value) return;
            node.setAttribute("href", value);
        };

        const setBackgroundImage = (selector, value) => {
            const node = root.querySelector(selector);
            if (!node || !value) return;
            const resolved = resolveAssetUrl(value);
            node.style.backgroundImage = `url("${resolved}")`;
            node.style.backgroundPosition = "center center";
            node.style.backgroundSize = "cover";
            node.style.backgroundRepeat = "no-repeat";
        };

        const updateImage = (selector, value) => {
            const node = root.querySelector(selector);
            if (!node || !value) return;
            const resolved = resolveAssetUrl(value);
            node.setAttribute("src", resolved);
            node.removeAttribute("srcset");
            node.removeAttribute("sizes");
        };

        const setNodeVisible = (selector, visible) => {
            root.querySelectorAll(selector).forEach((node) => {
                node.style.display = visible ? "" : "none";
            });
        };

        setText(".elementor-element-2ce5632b .elementor-heading-title", openingGreeting);
        setText(".elementor-element-1b5d33d9 .elementor-heading-title", guestGreeting);
        setText(".elementor-element-39cf54fb .elementor-button-text", pickText(copy.openButton, "Buka Undangan"));
        setText(".elementor-element-203a05d1 .elementor-heading-title", coupleDisplay);
        setText(".elementor-element-18357ad8 .elementor-heading-title", guestName);
        setText(".elementor-element-57b9f40b .elementor-heading-title", openingGreeting);
        setText(".elementor-element-4b0afbb5 .elementor-heading-title", coupleDisplay);
        setText(".elementor-element-131f2246 .elementor-heading-title", displayDate);
        setHtml(".elementor-element-11c363cd .elementor-widget-container", `<p>${escapeHtml(groom.nickName)} &amp;</p><p>${escapeHtml(bride.nickName)}</p>`);
        setText(".elementor-element-74b466e3 .elementor-heading-title", displayDate);
        setText(".elementor-element-222efa8f .elementor-button-text", pickText(copy.saveTheDate, copy.saveTheDateTitle, "Save The Date"));
        setHtml(
            ".elementor-element-553c0b1 .elementor-heading-title",
            `${escapeHtml(quote)}<br><br><b>${escapeHtml(quoteSource)}</b>`
        );
        setText(".elementor-element-532f42e1 .elementor-heading-title", pickText(copy.openingText, schemaJson.copy.openingText));
        setText(".elementor-element-54c012bc .elementor-heading-title", groom.fullName);
        setText(".elementor-element-54e979d1 .elementor-heading-title", bride.fullName);
        setHtml(".elementor-element-a05b88c .elementor-widget-container", formatParentInfoHtml(groom.parentInfo));
        setHtml(".elementor-element-2c8f05cb .elementor-widget-container", formatParentInfoHtml(bride.parentInfo));
        setLink(".elementor-element-4ee7e879 a", toInstagramUrl(groom.instagram));
        setLink(".elementor-element-4592ba4d a", toInstagramUrl(bride.instagram));
        setBackgroundImage("#desk_cov", desktopSideCoverImage);
        updateImage(".elementor-element-468a5ec img", frameImage);
        updateImage(".elementor-element-5eec50c8 img", frontCoverImage);
        updateImage(".elementor-element-7bb1f0bc img", closingImage);
        updateImage(".elementor-element-7a06c7ac img", groom.image);
        updateImage(".elementor-element-750ddc6b img", bride.image);

        setText(".elementor-element-32ac9cf0 .elementor-heading-title", pickText(copy.saveTheDateTitle, schemaJson.copy.saveTheDateTitle, "Save The Date"));
        setText(".elementor-element-6d698700 .elementor-heading-title", pickText(copy.saveTheDateText, schemaJson.copy.saveTheDateText));
        setText(".elementor-element-597af492 .elementor-heading-title", pickText(coupleInitial, "HA"));
        setText(".elementor-element-1407887 .elementor-heading-title", pickText(akad.title, schemaJson.event.akad.title, "Akad Nikah"));
        updateImage(".elementor-element-6ea233df img", dividerImage);
        setText(".elementor-element-2e7e88b2 .elementor-heading-title", pickText(akad.date, schemaJson.event.akad.date));
        setText(".elementor-element-618e783 p", pickText(akad.time, schemaJson.event.akad.time));
        setHtml(".elementor-element-1d0f5bf0 .elementor-widget-container", formatAddressHtml(akad.addressName, akad.address));

        setText(".elementor-element-1da13497 .elementor-heading-title", pickText(resepsi.title, schemaJson.event.resepsi.title, "Resepsi"));
        updateImage(".elementor-element-3ccfcca0 img", dividerImage);
        setText(".elementor-element-38a25917 .elementor-heading-title", pickText(resepsi.date, schemaJson.event.resepsi.date));
        setText(".elementor-element-4f4f30c1 p", pickText(resepsi.time, schemaJson.event.resepsi.time));
        setHtml(".elementor-element-226a4d35 .elementor-widget-container", formatAddressHtml(resepsi.addressName, resepsi.address));
        setLink(".elementor-element-d620ac1 a", pickText(resepsi.mapsUrl, akad.mapsUrl, mergedData?.event?.mapUrl, schemaJson.event.mapUrl));

        setText(".elementor-element-6c290bd6 .elementor-heading-title", pickText(copy.livestreamTitle, schemaJson.streaming.title, "Live Streaming"));
        setText(".elementor-element-3ecdf1ab .elementor-heading-title", pickText(copy.livestreamIntro, schemaJson.streaming.text));
        setText(".elementor-element-47e4b7d9 .elementor-heading-title", pickText(streaming.date, schemaJson.streaming.date));
        setText(".elementor-element-15210c7b p", pickText(streaming.time, schemaJson.streaming.time));
        setLink(".elementor-element-183e05ef a", pickText(streaming.url, schemaJson.streaming.url));
        setText(".elementor-element-183e05ef .elementor-button-text", pickText(streaming.label, schemaJson.streaming.label));
        setNodeVisible(".elementor-element-68da415", hasStreaming);

        setText(".elementor-element-2fbc9448 .elementor-heading-title", pickText(copy.loveStoryTitle, "Love Story"));
        [
            {
                titleSelector: ".elementor-element-76ffe19e",
                descSelector: ".elementor-element-59509e18",
            },
            {
                titleSelector: ".elementor-element-57f65ff",
                descSelector: ".elementor-element-2e3f62ef",
            },
            {
                titleSelector: ".elementor-element-6fdc1dc2",
                descSelector: ".elementor-element-14578bea",
            },
        ].forEach(({ titleSelector, descSelector }, index) => {
            const story = stories[index];
            const hasStory = Boolean(story?.title || story?.description || story?.text || story?.date);
            setNodeVisible(titleSelector, hasStory);
            setNodeVisible(descSelector, hasStory);
            if (!hasStory) return;
            setText(`${titleSelector} p`, pickText(story?.title, story?.date));
            setText(`${descSelector} p`, pickText(story?.description, story?.text));
        });
        setNodeVisible(".elementor-element-56ac709b", hasStories);

        const galleryContainer = root.querySelector(".elementor-element-1a3a1608 .elementor-gallery__container");
        if (galleryContainer) galleryContainer.classList.add("be-gallery-fallback");
        setText(".elementor-element-e9f1334 .elementor-heading-title", pickText(copy.galleryTitle, schemaJson.copy.galleryTitle, "Galeri Foto"));
        if (galleryContainer) {
            galleryContainer.querySelectorAll("[data-be-gallery-clone='true']").forEach((node) => node.remove());
            const baseGalleryNode = galleryContainer.querySelector(".e-gallery-item");
            if (baseGalleryNode && gallery.length > 1) {
                const existingCount = galleryContainer.querySelectorAll(".e-gallery-item").length;
                for (let index = existingCount; index < gallery.length; index += 1) {
                    const clone = baseGalleryNode.cloneNode(true);
                    clone.setAttribute("data-be-gallery-clone", "true");
                    galleryContainer.appendChild(clone);
                }
            }
        }
        const galleryNodes = Array.from(root.querySelectorAll(".elementor-element-1a3a1608 .e-gallery-item"));
        galleryNodes.forEach((node, index) => {
            const imageUrl = resolveAssetUrl(gallery[index] || "");
            if (!imageUrl) {
                node.style.display = "none";
                return;
            }
            node.style.display = "";
            node.setAttribute("href", imageUrl);
            const imageNode = node.querySelector(".e-gallery-image");
            if (imageNode) {
                imageNode.setAttribute("data-thumbnail", imageUrl);
                imageNode.style.backgroundImage = `url("${imageUrl}")`;
                imageNode.style.backgroundPosition = "center center";
                imageNode.style.backgroundSize = "cover";
                imageNode.style.backgroundRepeat = "no-repeat";
            }
        });
        setNodeVisible(".elementor-element-30beb4ec", hasGallery);

        const bank1 = bankList[0] || {};
        const bank2 = bankList[1] || bank1;
        setText(".elementor-element-50abaf91 .elementor-heading-title", pickText(copy.giftTitle, schemaJson.copy.giftTitle, "Wedding Gift"));
        setText(".elementor-element-16ea9bf6 .elementor-heading-title", pickText(copy.giftIntro, schemaJson.copy.giftIntro));
        setText(".elementor-element-46bb9df6 .elementor-button-text", pickText(copy.giftToggleLabel, "Klik di sini"));
        setText(".elementor-element-1de686fb .elementor-heading-title", pickText(bank1.accountNumber, "1234 5678 90"));
        setText(".elementor-element-14c8f643 .elementor-heading-title", pickText(bank1.accountHolder, groom.nickName));
        setText(".elementor-element-797e0dc4 .elementor-heading-title", pickText(bank2.accountNumber, bank1.accountNumber, "1234 5678 90"));
        setText(".elementor-element-4f515712 .elementor-heading-title", pickText(bank2.accountHolder, bank1.accountHolder, groom.nickName));
        updateImage(".elementor-element-5c5857df img", bank1.logo);
        updateImage(".elementor-element-5b5cab78 img", bank1.chip);
        updateImage(".elementor-element-1918ee75 img", bank2.logo);
        setHtml(
            ".elementor-element-45529c48 .elementor-widget-container",
            `<p>Nama Penerima : ${escapeHtml(pickText(rawShipping?.recipient, schemaJson.gifts.shipping.recipient, groom.fullName))}</p><p>No. HP : <b>${escapeHtml(
                pickText(rawShipping?.phone, schemaJson.gifts.shipping.phone, "-")
            )}</b></p><p>${escapeHtml(pickText(rawShipping?.address, schemaJson.gifts.shipping.address, akad.addressName, "-"))}</p>`
        );
        setNodeVisible(".elementor-element-8a04f5b", hasGiftSection);

        root.querySelectorAll(".elementor-widget-weddingpress-copy-text").forEach((node, index) => {
            const copyContent = node.querySelector(".copy-content");
            const button = node.querySelector(".elementor-button");
            const account = index === 0 ? bank1.accountNumber : bank2.accountNumber || bank1.accountNumber;
            if (copyContent) copyContent.innerHTML = escapeHtml(pickText(account || ""));
            if (button) button.classList.add("be-copy-trigger");
        });

        setText(".elementor-element-266fb557 .elementor-heading-title", pickText(copy.wishesTitle, schemaJson.copy.wishesTitle, "Ucapkan Sesuatu"));
        setText(".elementor-element-19d02f9a .elementor-heading-title", pickText(copy.wishesIntro, schemaJson.copy.wishesIntro));
        setNodeVisible(".elementor-element-58efe146", wishesEnabled);
        setText(".elementor-element-7b0cf99f .elementor-heading-title", coupleDisplay);
        setHtml(".elementor-element-861c1f4 .elementor-widget-container", `<p>${escapeHtml(pickText(copy.closingText, schemaJson.copy.closingText))}</p>`);
        setText(".elementor-element-24c59066 .elementor-widget-container", pickText(copy.creditText, schemaJson.copy.creditText));

        upsertGuestQrSection({
            root,
            guestName,
            beforeNode: root.querySelector(".elementor-element-58efe146"),
            markerAttribute: "data-be-guest-qr-section",
        });

        const countdownNode = root.querySelector("#wpkoi-elements-countdown-4884d460");
        const countdownTarget = pickText(mergedData?.event?.dateISO, schemaJson.event.dateISO);
        if (countdownNode) {
            countdownNode.setAttribute("data-date", countdownTarget);
            updateCountdownNode(countdownNode, countdownTarget);
        }
        const countdownInterval = window.setInterval(() => updateCountdownNode(countdownNode, countdownTarget), 1000);

        const sec = root.querySelector("#sec");
        const kolom = root.querySelector("#kolom");
        const awElements = root.querySelectorAll(".aw");
        awElements.forEach((node) => {
            node.style.display = opened ? "block" : "none";
        });
        if (!scrollUnlocked) {
            document.body.classList.add("be-lock-scroll");
        } else {
            document.body.classList.remove("be-lock-scroll");
        }
        if (opened && sec) {
            sec.style.opacity = "0";
            sec.style.visibility = "hidden";
        }

        const audioWidget = root.querySelector(".elementor-element-acead8b");
        if (audioWidget) {
            audioWidget.classList.toggle("is-visible", opened);
        }

        const audioElement = root.querySelector("#song");
        if (audioElement) {
            const resolvedAudioSrc = resolveAssetUrl(pickAsset(mergedData?.audio?.src, DEFAULT_AUDIO_SRC));
            const sourceNode = audioElement.querySelector("source");
            if (sourceNode) {
                sourceNode.setAttribute("src", resolvedAudioSrc);
            }
            audioElement.setAttribute("src", resolvedAudioSrc);
            audioElement.setAttribute("preload", "auto");
            audioElement.setAttribute("playsinline", "true");
            audioElement.setAttribute("webkit-playsinline", "true");
            audioElement.loop = mergedData?.audio?.loop !== false;
            audioElement.load();
            audioRef.current = audioElement;
        }

        const audioContainer = root.querySelector("#audio-container");
        if (audioContainer) {
            audioContainer.setAttribute("role", "button");
            audioContainer.setAttribute("tabindex", "0");
        }

        const updateAudioIcons = () => {
            const audio = audioRef.current;
            const mute = root.querySelector("#mute-sound");
            const unmute = root.querySelector("#unmute-sound");
            if (!mute || !unmute || !audioContainer) return;

            const isPlaying = Boolean(audio && !audio.paused);
            mute.style.display = isPlaying ? "flex" : "none";
            unmute.style.display = isPlaying ? "none" : "flex";
            audioContainer.setAttribute("data-state", isPlaying ? "playing" : "paused");
            audioContainer.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
        };

        const playAudio = async () => {
            const audio = audioRef.current;
            if (!audio) return false;
            try {
                await audio.play();
                updateAudioIcons();
                return true;
            } catch {
                updateAudioIcons();
                return false;
            }
        };

        const pauseAudio = () => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.pause();
            updateAudioIcons();
        };

        audioElement?.addEventListener("play", updateAudioIcons);
        audioElement?.addEventListener("pause", updateAudioIcons);
        audioElement?.addEventListener("ended", updateAudioIcons);
        updateAudioIcons();

        const openButton = root.querySelector("#open");
        const onOpen = async (event) => {
            event.preventDefault();
            if (opened) return;

            awElements.forEach((node) => {
                node.style.display = "block";
            });
            root.querySelectorAll(".elementor-invisible").forEach((node) => node.classList.remove("elementor-invisible"));

            if (kolom) {
                kolom.style.transform = "translateY(-100%)";
                kolom.style.transition = `transform ${tokens.motion.gateDurationMs}ms ease-in-out`;
            }
            if (sec) {
                sec.style.opacity = "0";
                sec.style.transition = `opacity ${tokens.motion.gateDurationMs}ms ease-in-out`;
                window.setTimeout(() => {
                    sec.style.visibility = "hidden";
                }, tokens.motion.gateDurationMs);
            }

            setOpened(true);
            audioWidget?.classList.add("is-visible");
            if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
            unlockTimerRef.current = window.setTimeout(() => {
                document.body.classList.remove("be-lock-scroll");
                setScrollUnlocked(true);
            }, tokens.motion.gateDurationMs);

            await playAudio();

            runReveal();
            AOS.refreshHard();
        };
        openButton?.addEventListener("click", onOpen);

        const giftContainer = root.querySelector("#amplop");
        if (giftContainer && !giftContainer.classList.contains("be-open")) {
            giftContainer.style.display = "none";
            giftContainer.style.maxHeight = "0px";
            giftContainer.style.opacity = "0";
        }
        const giftButton = root.querySelector("#klik");
        const onGiftToggle = (event) => {
            event.preventDefault();
            slideToggleElement(giftContainer, tokens.motion.giftToggleMs);
        };
        giftButton?.addEventListener("click", onGiftToggle);

        const onAudioToggle = async (event) => {
            event.preventDefault();
            if (!opened) return;
            const audio = audioRef.current;
            if (!audio) return;
            if (audio.paused) {
                await playAudio();
            } else {
                pauseAudio();
            }
        };
        audioContainer?.addEventListener("click", onAudioToggle);

        const onAudioToggleKeydown = async (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            await onAudioToggle(event);
        };
        audioContainer?.addEventListener("keydown", onAudioToggleKeydown);

        const onVisibilityChange = () => {
            const audio = audioRef.current;
            if (!audio) return;
            if (document.visibilityState === "hidden") {
                pauseAudio();
            } else if (opened) {
                playAudio().catch(() => undefined);
            }
            updateAudioIcons();
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        const renderWishes = (entries) => {
            const list = root.querySelector("#cui-container-comment-13544");
            const countLink = root.querySelector("#cui-link-13544");
            const attendanceWrap = root.querySelector("#invitation-count-13544");
            if (!list || !countLink || !attendanceWrap) return;

            const hadirCount = entries.filter((item) => /hadir/i.test(item.attendance)).length;
            const tidakHadirCount = entries.filter((item) => /tidak/i.test(item.attendance)).length;

            if (!entries.length) {
                list.innerHTML =
                    "<li class='cui-item-comment cui-item-comment-empty'><div class='cui-comment-content'><div class='cui-comment-text'><p>Belum ada ucapan. Jadilah yang pertama mengirim ucapan.</p></div></div></li>";
            } else {
                list.innerHTML = entries
                    .map(
                        (entry) =>
                            `<li class="cui-item-comment"><div class="cui-comment-content"><div class="cui-comment-info"><a href="#" class="cui-commenter-name" onclick="return false;">${escapeHtml(
                                entry.author
                            )}</a><span class="cui-post-author">${escapeHtml(entry.attendance)}</span><span class="cui-comment-time">${escapeHtml(
                                formatWishRelativeTime(entry.createdAt)
                            )}</span></div><div class="cui-comment-text"><p>${escapeHtml(entry.comment)}</p></div></div></li>`
                    )
                    .join("");
            }

            countLink.innerHTML = `<span>${entries.length}</span> Comments`;
            countLink.setAttribute("title", `${entries.length} Comments`);
            const countCards = attendanceWrap.querySelectorAll(".cui_comment_count_card span:first-child");
            if (countCards.length >= 2) {
                countCards[0].textContent = String(hadirCount);
                countCards[1].textContent = String(tidakHadirCount);
            }
        };
        renderWishes(wishes);

        const commentStatus = root.querySelector("#cui-comment-status-13544");
        const form = root.querySelector("#commentform-13544");
        const countLink = root.querySelector("#cui-link-13544");
        const onCountLinkClick = (event) => {
            event.preventDefault();
            const target = root.querySelector(".elementor-element-58efe146");
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        countLink?.addEventListener("click", onCountLinkClick);

        const onWishSubmit = async (event) => {
            event.preventDefault();
            const author = form?.querySelector("#author");
            const comment = form?.querySelector("#comment");
            const attendance = form?.querySelector("#attendance-13544");
            const submitBtn = form?.querySelector("input[type='submit']");
            if (!author || !comment || !attendance) return;
            if (!author.reportValidity() || !comment.reportValidity() || !attendance.reportValidity()) return;

            const payload = {
                author: author.value,
                comment: comment.value,
                attendance: attendance.value,
                createdAt: new Date().toISOString(),
            };
            const nextEntry = normalizeWishItem(payload);
            if (!nextEntry) return;

            // --- Start Loading ---
            form.classList.add("is-submitting");
            const formElements = form.querySelectorAll("input, textarea, select, button");
            formElements.forEach((el) => {
                el.disabled = true;
            });

            let originalSubmitValue = "";
            if (submitBtn) {
                originalSubmitValue = submitBtn.value;
                submitBtn.value = "Mengirim...";
            }

            try {
                const activeInvitationSlug = resolveInvitationSlug(mergedData, invitationSlug || "botanical-elegance");
                const activeOrderId = resolveOrderId(mergedData);
                await postInvitationWish(activeInvitationSlug, {
                    invitationSlug: activeInvitationSlug,
                    orderId: activeOrderId,
                    ...nextEntry,
                });
            } catch {
                // Keep optimistic local render
            } finally {
                // --- Stop Loading ---
                form.classList.remove("is-submitting");
                formElements.forEach((el) => {
                    el.disabled = false;
                });
                if (submitBtn) {
                    submitBtn.value = originalSubmitValue;
                }
            }

            const next = [nextEntry, ...wishes];
            setWishes(next);
            writeStoredWishes(next);
            form.reset();

            if (commentStatus) {
                commentStatus.textContent = "Ucapan berhasil dikirim.";
                commentStatus.style.display = "block";
                window.setTimeout(() => {
                    commentStatus.textContent = "";
                    commentStatus.style.display = "";
                }, 2500);
            }
        };
        form?.addEventListener("submit", onWishSubmit);

        const onCopyClick = async (event) => {
            const trigger = event.target.closest(".be-copy-trigger");
            if (!trigger) return;
            event.preventDefault();
            const wrapper = trigger.closest(".elementor-button-wrapper");
            const content = wrapper?.querySelector(".copy-content");
            const copied = await copyToClipboard(content?.textContent || "");
            if (!copied) return;

            const original = trigger.innerHTML;
            trigger.textContent = trigger.getAttribute("data-message") || "berhasil disalin";
            window.setTimeout(() => {
                trigger.innerHTML = original;
            }, 500);
        };
        root.addEventListener("click", onCopyClick);

        const onAnchorClick = (event) => {
            const anchor = event.target.closest("a[href^='#']");
            if (!anchor) return;
            const href = anchor.getAttribute("href");
            if (!href || href === "#") {
                event.preventDefault();
                return;
            }
            const target = root.querySelector(href);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        root.addEventListener("click", onAnchorClick);

        const onGalleryClick = (event) => {
            const anchor = event.target.closest(".elementor-element-1a3a1608 .e-gallery-item");
            if (!anchor) return;
            event.preventDefault();
            setLightboxImage(resolveAssetUrl(anchor.getAttribute("href") || ""));
        };
        root.addEventListener("click", onGalleryClick);

        let cancelled = false;
        loadScriptOnce("be-lottie-script", LOTTIE_HREF)
            .then(() => {
                if (cancelled || !window.lottie) return;
                lottieInstancesRef.current.forEach((instance) => instance?.destroy?.());
                lottieInstancesRef.current = [];

                root.querySelectorAll(".elementor-widget-lottie").forEach((node) => {
                    const settings = parseDataSettings(node.getAttribute("data-settings"));
                    const container = node.querySelector(".e-lottie__animation");
                    const path = settings?.source_json?.url ? resolveAssetUrl(settings.source_json.url) : null;
                    if (!container || !path) return;

                    const instance = window.lottie.loadAnimation({
                        container,
                        renderer: settings?.renderer || "svg",
                        loop: settings?.loop === "yes" || settings?.loop === true,
                        autoplay: true,
                        path,
                    });
                    lottieInstancesRef.current.push(instance);
                });
            })
            .catch(() => undefined);

        const onScroll = () => runReveal();
        window.addEventListener("scroll", onScroll, { passive: true });
        revealAnimatedNodes();
        runReveal();

        return () => {
            cancelled = true;
            window.clearInterval(countdownInterval);
            window.removeEventListener("scroll", onScroll);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            openButton?.removeEventListener("click", onOpen);
            giftButton?.removeEventListener("click", onGiftToggle);
            audioContainer?.removeEventListener("click", onAudioToggle);
            audioContainer?.removeEventListener("keydown", onAudioToggleKeydown);
            audioElement?.removeEventListener("play", updateAudioIcons);
            audioElement?.removeEventListener("pause", updateAudioIcons);
            audioElement?.removeEventListener("ended", updateAudioIcons);
            form?.removeEventListener("submit", onWishSubmit);
            countLink?.removeEventListener("click", onCountLinkClick);
            root.removeEventListener("click", onCopyClick);
            root.removeEventListener("click", onAnchorClick);
            root.removeEventListener("click", onGalleryClick);
            lottieInstancesRef.current.forEach((instance) => instance?.destroy?.());
            lottieInstancesRef.current = [];
        };
    }, [invitationSlug, mergedData, opened, scrollUnlocked, wishes]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setLightboxImage("");
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <>
            <div ref={rootRef} className="be-template" dangerouslySetInnerHTML={{ __html: markup }} />
            {lightboxImage ? (
                <div className="be-lightbox" onClick={() => setLightboxImage("")} role="dialog" aria-modal="true">
                    <div className="be-lightbox__dialog" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="be-lightbox__close" aria-label="Tutup galeri" onClick={() => setLightboxImage("")}>
                            ×
                        </button>
                        <img className="be-lightbox__image" src={lightboxImage} alt="Galeri foto" />
                    </div>
                </div>
            ) : null}
        </>
    );
}
