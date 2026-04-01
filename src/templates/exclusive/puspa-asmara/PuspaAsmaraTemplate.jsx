import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { postInvitationWish } from "../../../services/wishesApi";
import { getPackageConfig } from "../../../data/packageCatalog";
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
  "page-id-13735",
  "wp-embed-responsive",
  "wp-theme-hello-elementor",
  "hello-elementor-default",
  "elementor-default",
  "elementor-template-canvas",
  "elementor-kit-5",
  "elementor-page",
  "elementor-page-13735",
];

const STYLE_LINK_ID = "puspa-asmara-style";
const STYLE_HREF = `${PUBLIC_TEMPLATE_PREFIX}style.css?v=20260326-1`;
const LOTTIE_HREF = `${PUBLIC_ASSET_PREFIX}js/lottie.min.js`;
const WISHES_STORAGE_KEY = "premium_02_ucapan_13735";
const DEMO_DESKTOP_COVER_IMAGE = "assets/images/SUJA-24SK1173-PII-9-1-e1730097922583.jpg";
const DEMO_MOBILE_COVER_IMAGE = "assets/images/P2G-FALLBACK-PII.webp";
const DEMO_COUPLE_SECTION_IMAGE = "assets/images/PRE-VINT-02-COUPLE2-PII.webp";
const DUMMY_WISHES = [
  {
    author: "Ayu",
    comment: "Selamat menempuh hidup baru. Semoga sakinah mawaddah warahmah.",
    attendance: "Hadir",
    createdAt: "Baru saja",
  },
  {
    author: "Rizky",
    comment: "Doa terbaik untuk kedua mempelai.",
    attendance: "Tidak Hadir",
    createdAt: "2 menit lalu",
  },
];

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

  output.invitation = { ...(base?.invitation || {}), ...(output.invitation || {}) };
  output.couple = { ...(base?.couple || {}), ...(output.couple || {}) };
  output.couple.groom = { ...(base?.couple?.groom || {}), ...(output.couple?.groom || {}) };
  output.couple.bride = { ...(base?.couple?.bride || {}), ...(output.couple?.bride || {}) };
  output.guest = { ...(base?.guest || {}), ...(output.guest || {}) };
  output.groom = { ...(base?.groom || {}), ...(output.groom || {}) };
  output.bride = { ...(base?.bride || {}), ...(output.bride || {}) };
  output.event = { ...(base?.event || {}), ...(output.event || {}) };
  output.event.akad = { ...(base?.event?.akad || {}), ...(output.event?.akad || {}) };
  output.event.resepsi = { ...(base?.event?.resepsi || {}), ...(output.event?.resepsi || {}) };
  output.streaming = { ...(base?.streaming || {}), ...(output.streaming || {}) };
  output.gifts = { ...(base?.gifts || {}), ...(output.gifts || {}) };
  output.gifts.shipping = { ...(base?.gifts?.shipping || {}), ...(output.gifts?.shipping || {}) };
  output.copy = { ...(base?.copy || {}), ...(output.copy || {}) };
  output.media = { ...(base?.media || {}), ...(output.media || {}) };
  output.features = { ...(base?.features || {}), ...(output.features || {}) };
  output.order = { ...(base?.order || {}), ...(output.order || {}) };

  return output;
}

function normalizeRuntimeStory(item) {
  if (!item || typeof item !== "object") return null;

  const title = pickText(
    item.title,
    item.storyTitle,
    item.story_title,
    item.heading,
    item.headline,
    item.judul,
    item.name,
    item.label
  );
  const text = pickText(
    item.description,
    item.text,
    item.story,
    item.storyText,
    item.story_text,
    item.content,
    item.body
  );
  const date = pickText(item.date, item.year, item.period, item.momentDate, item.moment_date);
  const photo = pickAsset(item.photo?.url, item.photo, item.image?.url, item.image);

  if (!title && !text && !date && !photo) return null;

  return {
    title,
    description: text,
    text,
    date,
    photo,
  };
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
    data?.payload?.orderId,
    data?.payload?.order_id,
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
    incomingData.coverImage ||
    incomingData.openingThumbnailImage ||
    incomingData.frontCoverImage ||
    incomingData.stories ||
    incomingData.lovestory ||
    incomingData.loveStory ||
    incomingData.streaming ||
    incomingData.livestream ||
    incomingData.gift ||
    incomingData.gifts ||
    incomingData.giftInfo ||
    orderPayload.groom ||
    orderPayload.bride ||
    orderPayload.akad ||
    orderPayload.resepsi ||
    orderPayload.coverImage ||
    orderPayload.openingThumbnailImage ||
    orderPayload.frontCoverImage ||
    orderPayload.stories ||
    orderPayload.lovestory ||
    orderPayload.loveStory ||
    orderPayload.streaming ||
    orderPayload.livestream ||
    orderPayload.gift ||
    orderPayload.gifts ||
    orderPayload.giftInfo
  );

  if (!hasRawPayload) return {};

  const groom = orderPayload.groom || incomingData.groom || {};
  const bride = orderPayload.bride || incomingData.bride || {};
  const akad = orderPayload.akad || incomingData.akad || {};
  const resepsi = orderPayload.resepsi || incomingData.resepsi || {};
  const runtimeInvitationSlug = resolveInvitationSlug(
    {
      ...incomingData,
      invitationSlug: pickText(incomingData?.invitationSlug, incomingData?.invitation_slug, orderPayload?.invitationSlug, orderPayload?.invitation_slug),
    },
    resolveInvitationSlug(baseSchema)
  );
  const runtimeOrderId = resolveOrderId(
    {
      ...incomingData,
      orderId: pickText(incomingData?.orderId, incomingData?.order_id, orderPayload?.orderId, orderPayload?.order_id),
    },
    resolveOrderId(baseSchema)
  );
  const runtimeDate = parseEventDateTime(
    akad?.date,
    akad?.startTime || akad?.time,
    incomingData?.event?.dateISO || baseSchema?.event?.dateISO
  );
  const runtimeDateISO = runtimeDate?.toISOString?.() || pickText(incomingData?.event?.dateISO, baseSchema?.event?.dateISO);
  const runtimeDisplayDate = formatCompactDateInput(
    akad?.date,
    incomingData?.event?.displayDate,
    runtimeDateISO,
    baseSchema?.event?.displayDate
  );
  const rawStories = Array.isArray(orderPayload?.stories)
    ? orderPayload.stories
    : Array.isArray(orderPayload?.loveStory)
      ? orderPayload.loveStory
      : Array.isArray(orderPayload?.lovestory)
        ? orderPayload.lovestory
        : Array.isArray(incomingData?.stories)
          ? incomingData.stories
          : Array.isArray(incomingData?.loveStory)
            ? incomingData.loveStory
            : Array.isArray(incomingData?.lovestory)
              ? incomingData.lovestory
              : [];
  const runtimeStories = rawStories.map(normalizeRuntimeStory).filter(Boolean);
  const rawStreaming =
    orderPayload?.streaming ||
    orderPayload?.livestream ||
    incomingData?.streaming ||
    incomingData?.livestream ||
    incomingData?.event?.livestream ||
    {};
  const runtimeStreamingUrl = pickText(rawStreaming?.url, rawStreaming?.link);
  const runtimeStreaming = {
    ...(incomingData?.streaming || {}),
    url: runtimeStreamingUrl,
    label: inferStreamingLabel(runtimeStreamingUrl, pickText(rawStreaming?.label, rawStreaming?.platformLabel)),
    platformLabel: pickText(rawStreaming?.platformLabel, rawStreaming?.label),
    date: pickText(rawStreaming?.date, akad?.date),
    time: pickText(rawStreaming?.time, akad?.startTime || akad?.time),
  };
  const rawGift =
    orderPayload?.gift ||
    orderPayload?.giftInfo ||
    orderPayload?.gifts ||
    incomingData?.gift ||
    incomingData?.giftInfo ||
    incomingData?.gifts ||
    {};
  const runtimeFeatures = {
    ...(incomingData?.features || {}),
    ...(orderPayload?.features || {}),
  };
  const runtimeLivestreamEnabled =
    orderPayload?.features?.livestreamEnabled ??
    incomingData?.features?.livestreamEnabled;
  const runtimeLivestreamCapability = resolveLivestreamCapability({
    ...incomingData,
    selectedPackage: incomingData?.selectedPackage || orderPayload?.selectedPackage,
    packageTier: resolvePackageTier(incomingData, pickText(orderPayload?.packageTier, orderPayload?.selectedTheme?.packageTier)),
  });
  const runtimeBankList = Array.isArray(rawGift?.bankList)
    ? rawGift.bankList
    : Array.isArray(rawGift?.bankAccounts)
      ? rawGift.bankAccounts
      : [];
  const runtimeShipping = {
    ...(rawGift?.shipping || {}),
  };

  return {
    orderId: runtimeOrderId,
    invitation: {
      slug: runtimeInvitationSlug,
      orderId: runtimeOrderId,
    },
    guest: {
      ...(orderPayload.guest || incomingData.guest || {}),
    },
    groom: {
      fullName: pickText(groom.fullname, groom.fullName, groom.nameFull),
      nickName: pickText(groom.nickname, groom.nickName, groom.fullname?.split(" ")[0]),
      parentInfo: pickText(groom.parents, groom.parentInfo),
      instagram: pickText(groom.instagram),
      image: pickAsset(groom.photo, groom.image),
      photo: pickAsset(groom.photo, groom.image),
    },
    bride: {
      fullName: pickText(bride.fullname, bride.fullName, bride.nameFull),
      nickName: pickText(bride.nickname, bride.nickName, bride.fullname?.split(" ")[0]),
      parentInfo: pickText(bride.parents, bride.parentInfo),
      instagram: pickText(bride.instagram),
      image: pickAsset(bride.photo, bride.image),
      photo: pickAsset(bride.photo, bride.image),
    },
    couple: {
      groom: {
        nameFull: pickText(groom.fullname, groom.fullName, groom.nameFull),
        nickName: pickText(groom.nickname, groom.nickName, groom.fullname?.split(" ")[0]),
        parentInfo: pickText(groom.parents, groom.parentInfo),
        instagram: pickText(groom.instagram),
        photo: pickAsset(groom.photo, groom.image),
      },
      bride: {
        nameFull: pickText(bride.fullname, bride.fullName, bride.nameFull),
        nickName: pickText(bride.nickname, bride.nickName, bride.fullname?.split(" ")[0]),
        parentInfo: pickText(bride.parents, bride.parentInfo),
        instagram: pickText(bride.instagram),
        photo: pickAsset(bride.photo, bride.image),
      },
      frontCoverPhoto: pickAsset(
        orderPayload.frontCoverImage,
        incomingData.frontCoverImage,
        orderPayload.couple?.frontCoverPhoto,
        incomingData.couple?.frontCoverPhoto
      ),
      heroPhoto: pickAsset(
        orderPayload.openingThumbnailImage,
        incomingData.openingThumbnailImage,
        orderPayload.couple?.heroPhoto,
        incomingData.couple?.heroPhoto,
        orderPayload.coverImage,
        incomingData.coverImage
      ),
    },
    frontCoverImage: pickAsset(orderPayload.frontCoverImage, incomingData.frontCoverImage),
    coverImage: pickAsset(orderPayload.coverImage, incomingData.coverImage),
    openingThumbnailImage: pickAsset(orderPayload.openingThumbnailImage, incomingData.openingThumbnailImage),
    saveTheDateBackgroundImage: pickAsset(orderPayload.saveTheDateBackgroundImage, incomingData.saveTheDateBackgroundImage),
    loveStory: runtimeStories,
    lovestory: runtimeStories,
    stories: runtimeStories,
    streaming: runtimeStreaming,
    gift: {
      ...(incomingData?.gift || {}),
      bankList: runtimeBankList,
      shipping: runtimeShipping,
    },
    gifts: {
      ...(incomingData?.gifts || {}),
      bankAccounts: runtimeBankList,
      shipping: runtimeShipping,
    },
    features: {
      ...runtimeFeatures,
      livestreamEnabled: runtimeLivestreamEnabled ?? (runtimeLivestreamCapability || Boolean(runtimeStreamingUrl)),
    },
    event: {
      ...(incomingData.event || {}),
      dateISO: runtimeDateISO,
      displayDate: runtimeDisplayDate,
      livestream: {
        ...(incomingData?.event?.livestream || {}),
        ...runtimeStreaming,
      },
      akad: {
        ...(incomingData.event?.akad || {}),
        coverImage: pickAsset(akad.coverImage, akad.coverPhoto),
        coverPhoto: pickAsset(akad.coverImage, akad.coverPhoto),
      },
      resepsi: {
        ...(incomingData.event?.resepsi || {}),
        coverImage: pickAsset(resepsi.coverImage, resepsi.coverPhoto),
        coverPhoto: pickAsset(resepsi.coverImage, resepsi.coverPhoto),
      },
    },
    copy: {
      ...(incomingData.copy || {}),
      quote: pickText(orderPayload.quote, incomingData.quote, incomingData.copy?.quote),
      quoteSource: pickText(orderPayload.quoteSource, incomingData.quoteSource, incomingData.copy?.quoteSource),
      saveTheDateBackgroundPhoto: pickAsset(
        orderPayload.saveTheDateBackgroundImage,
        incomingData.saveTheDateBackgroundImage,
        incomingData.copy?.saveTheDateBackgroundPhoto
      ),
    },
  };
}

function normalizeWishItem(item) {
  const author = normalizeText(item?.author || item?.name || item?.guest || "");
  const comment = normalizeText(item?.comment || item?.message || item?.wish || "");
  const attendance = normalizeText(item?.attendance || item?.status || item?.konfirmasi || "Hadir");
  const createdAt = normalizeText(item?.createdAt || item?.date || "Baru saja");

  if (!author || !comment) return null;

  return {
    author,
    comment,
    attendance,
    createdAt,
  };
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

function buildWishKey(item) {
  const author = normalizeText(item?.author).toLowerCase();
  const comment = normalizeText(item?.comment).toLowerCase();
  const attendance = normalizeText(item?.attendance).toLowerCase();
  return `${author}::${comment}::${attendance}`;
}

function setText(root, selector, value) {
  const node = root.querySelector(selector);
  if (!node) return;
  node.textContent = String(value ?? "");
}

function setHtml(root, selector, value) {
  const node = root.querySelector(selector);
  if (!node) return;
  node.innerHTML = String(value ?? "");
}

function setLink(root, selector, value) {
  const node = root.querySelector(selector);
  if (!node || !value) return;
  node.setAttribute("href", value);
}

function setImage(root, selector, value, fallback = "") {
  const node = root.querySelector(selector);
  const resolved = resolveAssetUrl(value || fallback);
  if (!node || !resolved) return;
  node.setAttribute("src", resolved);
  node.removeAttribute("srcset");
  node.removeAttribute("sizes");
}

function setBackgroundImage(root, selector, value, options = {}) {
  if (!root || !selector || !value) return;
  const resolved = resolveAssetUrl(value);
  if (!resolved) return;

  const {
    position = "center center",
    size = "cover",
    repeat = "no-repeat",
    overlay,
  } = options;

  root.querySelectorAll(`${selector}, ${selector} > .elementor-motion-effects-container > .elementor-motion-effects-layer`).forEach((node) => {
    node.style.backgroundImage = overlay
      ? `linear-gradient(${overlay}, ${overlay}), url("${resolved}")`
      : `url("${resolved}")`;
    node.style.backgroundPosition = position;
    node.style.backgroundSize = size;
    node.style.backgroundRepeat = repeat;
  });
}

function clearBackgroundImage(root, selector) {
  if (!root || !selector) return;

  root.querySelectorAll(`${selector}, ${selector} > .elementor-motion-effects-container > .elementor-motion-effects-layer`).forEach((node) => {
    node.style.removeProperty("background-image");
    node.style.removeProperty("background-position");
    node.style.removeProperty("background-size");
    node.style.removeProperty("background-repeat");
  });
}

function setNodeVisible(root, selector, visible) {
  root.querySelectorAll(selector).forEach((node) => {
    node.style.display = visible ? "" : "none";
  });
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
      const text = pickText(value.url, value.src, value.image, value.photo, value.imageUrl, value.fileUrl, value.dataUrl);
      if (text) return text;
    }
  }
  return "";
}

function getNameInitial(value, fallback = "") {
  const text = pickText(value, fallback);
  return text ? text.charAt(0).toUpperCase() : "";
}

function formatQuoteHtml(text, source = "") {
  const normalizedText = pickText(text);
  const normalizedSource = pickText(source);
  if (!normalizedText && !normalizedSource) return "<p></p>";

  const paragraphs = [];
  if (normalizedText) paragraphs.push(`<p>${escapeHtml(normalizedText)}</p>`);
  if (normalizedSource) paragraphs.push(`<p>${escapeHtml(normalizedSource)}</p>`);
  return paragraphs.join("");
}

function normalizeBankAccount(item) {
  const bankName = pickText(item?.bankName, item?.bank, item?.provider, item?.title);
  const accountNumber = pickText(item?.accountNumber, item?.account, item?.number);
  const accountHolder = pickText(item?.accountHolder, item?.accountName, item?.name);
  const normalizedBankName = bankName.toLowerCase();
  const logo = pickAsset(
    item?.logo,
    item?.logoUrl,
    item?.image,
    normalizedBankName.includes("bca") ? "assets/images/BCA_logo_Bank_Central_Asia-1-3-5-2-1-scaled.png" : "",
    normalizedBankName.includes("dana") ? "assets/images/1200px-Logo_dana_blue.svg-1-1-1-1-1-2.png" : ""
  );
  const chip = pickAsset(
    item?.chip,
    item?.chipImage,
    normalizedBankName.includes("bca") ? "assets/images/chip-atm-1-2-4-3.png" : ""
  );

  if (!bankName && !accountNumber && !accountHolder && !logo && !chip) return null;

  return {
    bankName,
    accountNumber,
    accountHolder,
    logo,
    chip,
  };
}

function buildLocationText(detail = {}) {
  const venueName = pickText(detail?.venueName, detail?.venue, detail?.locationName, detail?.addressName);
  const address = pickText(detail?.address, detail?.locationAddress);
  return [venueName, address].filter(Boolean).join(", ");
}

function formatEventAddressHtml(detail = {}) {
  const venueName = pickText(detail?.addressName, detail?.venueName, detail?.venue, detail?.locationName);
  const address = pickText(detail?.address, detail?.locationAddress);

  if (venueName && address && venueName !== address) {
    return `<p><b>${escapeHtml(venueName)}</b></p><p>${escapeHtml(address)}</p>`;
  }

  return formatAddressHtml(venueName || address);
}

function parseEventDateTime(dateValue, timeValue, fallbackDateValue = "") {
  const directDate = new Date(dateValue || fallbackDateValue);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const text = pickText(dateValue, fallbackDateValue);
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
  const monthName = String(match[2] || "").trim().toLowerCase();
  const month = monthMap[monthName];
  const year = Number(match[3]);
  if (!Number.isFinite(day) || !Number.isFinite(year) || month === undefined) return null;

  const timeMatch = pickText(timeValue).match(/(\d{1,2})[.:](\d{2})/);
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;

  return new Date(year, month, day, hours, minutes, 0, 0);
}

function formatCompactDateInput(...values) {
  for (const value of values) {
    const text = pickText(value);
    if (!text) continue;

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      const parts = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).formatToParts(parsed);
      const day = parts.find((part) => part.type === "day")?.value;
      const month = parts.find((part) => part.type === "month")?.value;
      const year = parts.find((part) => part.type === "year")?.value;
      if (day && month && year) return `${day}. ${month}. ${year}`;
    }

    const normalized = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (normalized) {
      const [, day, month, year] = normalized;
      return `${String(day).padStart(2, "0")}. ${String(month).padStart(2, "0")}. ${year}`;
    }
  }

  return "";
}

function formatEventDate(dateValue, timeValue = "", fallbackDateValue = "") {
  const parsed = parseEventDateTime(dateValue, timeValue, fallbackDateValue);
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return pickText(dateValue, fallbackDateValue);
  }

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dayName = dayNames[parsed.getDay()];
  const day = parsed.getDate();
  const month = monthNames[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
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

function shouldUseIcsCalendar() {
  if (typeof navigator === "undefined") return false;
  const userAgent = String(navigator.userAgent || navigator.vendor || "").toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(userAgent);
}

function buildCalendarEventMeta(invitationData) {
  const startDate =
    parseEventDateTime(
      invitationData?.event?.akad?.date,
      invitationData?.event?.akad?.time,
      invitationData?.event?.dateISO
    ) || new Date(invitationData?.event?.dateISO || "");
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) return null;

  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const groomName = pickText(
    invitationData?.groom?.nickName,
    invitationData?.groom?.fullName,
    invitationData?.couple?.groom?.nickName,
    invitationData?.couple?.groom?.nameFull
  );
  const brideName = pickText(
    invitationData?.bride?.nickName,
    invitationData?.bride?.fullName,
    invitationData?.couple?.bride?.nickName,
    invitationData?.couple?.bride?.nameFull
  );
  const title = [groomName, brideName].filter(Boolean).join(" & ");
  const location = buildLocationText(invitationData?.event?.akad || invitationData?.event?.resepsi || {});
  const description = pickText(
    invitationData?.copy?.eventIntro,
    invitationData?.copy?.intro,
    invitationData?.copy?.closingText,
    invitationData?.copy?.quranText,
    invitationData?.copy?.quote
  );

  return {
    startDate,
    endDate,
    summary: title ? `Pernikahan ${title}` : "Save The Date",
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

function downloadCalendarFile(invitationData, slug = "puspa-asmara") {
  const eventMeta = buildCalendarEventMeta(invitationData);
  if (!eventMeta) return;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ikatan Cinta//Puspa Asmara//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${eventMeta.startDate.getTime()}-${slug}@ikatancinta`,
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
  link.download = `${String(slug || "save-the-date").replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "save-the-date"}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toYouTubeEmbedUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();
  const match = raw.match(/^.*((youtu\.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
  const videoId = match?.[7] || "";
  if (!videoId || videoId.length !== 11) return "";
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&playsinline=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${videoId}`;
}

export default function PuspaAsmaraTemplate({ data: propData, invitationSlug = "puspa-asmara", mode = "live" }) {
  const isStaticDemoMode = mode === "demo";
  const { data: fetchedData } = useInvitationData(invitationSlug, {
    fallbackSlug: "puspa-asmara",
    skipFetch: Boolean(propData) || isStaticDemoMode,
  });
  const mergedData = useMemo(() => {
    if (isStaticDemoMode) {
      return mergeInvitationData(defaultSchema, schemaJson);
    }

    const fetchedRuntimeData = buildRuntimeInvitationData(fetchedData, defaultSchema);
    const propRuntimeData = buildRuntimeInvitationData(propData, defaultSchema);
    const merged = mergeInvitationData(defaultSchema, schemaJson, fetchedData, propData, fetchedRuntimeData, propRuntimeData);
    const resolvedInvitationSlug = resolveInvitationSlug(merged, invitationSlug || "puspa-asmara");
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
  const fallbackWishes = useMemo(() => {
    const fromSchema = (Array.isArray(defaultSchema.wishes) ? defaultSchema.wishes : []).map(normalizeWishItem).filter(Boolean);
    if (fromSchema.length > 0) return fromSchema;
    return DUMMY_WISHES.map(normalizeWishItem).filter(Boolean);
  }, []);

  const rootRef = useRef(null);
  const lottieInstancesRef = useRef([]);
  const countdownTimerRef = useRef(null);
  const audioRef = useRef(null);
  const audioResumeRef = useRef(false);
  const unlockTimerRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState("");
  const [wishes, setWishes] = useState(() => fallbackWishes);
  const [isInvitationOpened, setIsInvitationOpened] = useState(false);

  useEffect(() => {
    let styleNode = document.getElementById(STYLE_LINK_ID);
    let createdByTemplate = false;

    if (!styleNode) {
      const link = document.createElement("link");
      link.id = STYLE_LINK_ID;
      link.rel = "stylesheet";
      link.href = STYLE_HREF;
      link.setAttribute("data-template-style", "puspa-asmara");
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
    if (!isInvitationOpened) {
      document.body.classList.add("pa-lock-scroll");
    } else {
      document.body.classList.remove("pa-lock-scroll");
      document.body.style.position = "";
      document.body.style.height = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflowY = "";
    }

    setDynamicVh();
    const onResize = () => setDynamicVh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      document.body.classList.remove("pa-lock-scroll");
      document.body.style.position = "";
      document.body.style.height = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflowY = "";
      BODY_CLASSES.forEach((name) => document.body.classList.remove(name));
      previousBodyClasses.forEach((name) => document.body.classList.add(name));
    };
  }, [isInvitationOpened]);

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
    const wishSeedSource = Array.isArray(mergedData?.wishes)
      ? mergedData.wishes
      : Array.isArray(mergedData?.wishes?.initial)
        ? mergedData.wishes.initial
        : [];
    const seeded = wishSeedSource.map(normalizeWishItem).filter(Boolean);
    const fallbackSeed = seeded.length > 0 ? seeded : fallbackWishes;
    const stored = typeof window !== "undefined" ? readStoredWishes() : null;
    if (stored?.length) {
      const seen = new Set(stored.map(buildWishKey));
      const merged = [...stored];
      fallbackSeed.forEach((entry) => {
        const key = buildWishKey(entry);
        if (!seen.has(key)) {
          merged.push(entry);
          seen.add(key);
        }
      });
      setWishes(merged);
      return;
    }
    setWishes(fallbackSeed);
  }, [mergedData, fallbackWishes]);

  useEffect(
    () => () => {
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current);
      }
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const cleanups = [];
    const registerCleanup = (fn) => cleanups.push(fn);

    const copy = mergedData?.copy || {};
    const guestName = pickText(mergedData?.guest?.name, schemaJson?.guest?.name);
    const guestGreeting = pickText(
      mergedData?.guest?.greetingLabel,
      copy.coverDear,
      defaultSchema?.guest?.greetingLabel,
      schemaJson?.copy?.coverDear,
      "Dear"
    );

    const groom = {
      nickName: pickText(mergedData?.groom?.nickName, mergedData?.couple?.groom?.nickName, mergedData?.couple?.groom?.nameFull?.split(" ")[0], "Habib"),
      fullName: pickText(mergedData?.groom?.fullName, mergedData?.groom?.nameFull, mergedData?.couple?.groom?.nameFull, "Habib Yulianto"),
      parentInfo: pickText(mergedData?.groom?.parentInfo, mergedData?.couple?.groom?.parentInfo, "Putra dari Bapak Putra & Ibu Putri"),
      instagram: pickText(mergedData?.groom?.instagram, mergedData?.couple?.groom?.instagram, "https://www.instagram.com/"),
      image: pickAsset(mergedData?.groom?.image, mergedData?.groom?.photo, mergedData?.couple?.groom?.photo, schemaJson?.groom?.image),
    };

    const bride = {
      nickName: pickText(mergedData?.bride?.nickName, mergedData?.couple?.bride?.nickName, mergedData?.couple?.bride?.nameFull?.split(" ")[0], "Adiba"),
      fullName: pickText(mergedData?.bride?.fullName, mergedData?.bride?.nameFull, mergedData?.couple?.bride?.nameFull, "Adiba Putri Syakila"),
      parentInfo: pickText(mergedData?.bride?.parentInfo, mergedData?.couple?.bride?.parentInfo, "Putri dari Bapak Putra & Ibu Putri"),
      instagram: pickText(mergedData?.bride?.instagram, mergedData?.couple?.bride?.instagram, "https://www.instagram.com/"),
      image: pickAsset(mergedData?.bride?.image, mergedData?.bride?.photo, mergedData?.couple?.bride?.photo, schemaJson?.bride?.image),
    };

    const coverPhoto = pickAsset(
      mergedData?.frontCoverImage,
      mergedData?.couple?.frontCoverPhoto,
      mergedData?.frontCoverPhoto,
      copy.coverBackgroundPhoto
    );
    const heroPhoto = pickAsset(
      mergedData?.openingThumbnailImage,
      mergedData?.coverImage,
      mergedData?.couple?.heroPhoto,
      mergedData?.heroPhoto,
      mergedData?.couple?.frontCoverPhoto,
      coverPhoto,
      "assets/images/SUJA-24SK1173-ALL-PII.webp"
    );
    const desktopCoverPhoto = isStaticDemoMode
      ? DEMO_DESKTOP_COVER_IMAGE
      : pickAsset(
        mergedData?.coverImage,
        mergedData?.saveTheDateBackgroundImage,
        copy.saveTheDateBackgroundPhoto,
        DEMO_DESKTOP_COVER_IMAGE
      );
    const mobileCoverPhoto = DEMO_MOBILE_COVER_IMAGE;
    const coupleSectionPhoto = DEMO_COUPLE_SECTION_IMAGE;

    const dynamicCoupleDisplay = [groom.nickName, bride.nickName].filter(Boolean).join(" & ");
    const coupleDisplay = pickText(dynamicCoupleDisplay, copy.heroCouple, `${groom.nickName} & ${bride.nickName}`);
    const akadSource = mergedData?.event?.akad || {};
    const resepsiSource = mergedData?.event?.resepsi || {};
    const livestreamSource = mergedData?.streaming || mergedData?.event?.livestream || {};
    const computedDateIso = parseEventDateTime(akadSource?.date, akadSource?.time, mergedData?.event?.dateISO)?.toISOString();
    const eventDateISO = pickText(mergedData?.event?.dateISO, computedDateIso, schemaJson?.event?.dateISO);
    const dynamicDisplayDate = formatCompactDateInput(
      mergedData?.event?.dateISO,
      akadSource?.date,
      resepsiSource?.date
    );
    const displayDate = pickText(
      dynamicDisplayDate,
      mergedData?.event?.displayDate,
      akadSource?.date,
      resepsiSource?.date,
      copy.heroDate,
      schemaJson?.event?.displayDate,
      "28. 12. 2025"
    );
    const quoteText = pickText(copy.quote, copy.quranText, schemaJson?.copy?.quranText);
    const quoteSource = pickText(copy.quoteSource, copy.quranSource, schemaJson?.copy?.quranSource);

    const akad = {
      title: pickText(akadSource?.title, "Akad Nikah"),
      date: pickText(
        formatEventDate(akadSource?.date, akadSource?.time, mergedData?.event?.dateISO),
        akadSource?.date,
        "Minggu, 28 Desember 2025"
      ),
      time: pickText(akadSource?.time, "Pukul : 09.00 WIB"),
      addressName: pickText(akadSource?.addressName, akadSource?.venueName, akadSource?.venue, akadSource?.address, "Kediaman Mempelai Wanita"),
      mapsUrl: pickText(akadSource?.mapsUrl, akadSource?.mapsLink, "https://maps.google.com/"),
      coverPhoto: pickAsset(akadSource?.coverPhoto, akadSource?.coverImage, mergedData?.akadCover),
    };

    const resepsi = {
      title: pickText(resepsiSource?.title, "Resepsi"),
      date: pickText(
        formatEventDate(resepsiSource?.date, resepsiSource?.time, akadSource?.date || mergedData?.event?.dateISO),
        resepsiSource?.date,
        akad.date,
        "Minggu, 28 Desember 2025"
      ),
      time: pickText(resepsiSource?.time, "Pukul : 09.00 WIB"),
      addressName: pickText(resepsiSource?.addressName, resepsiSource?.venueName, resepsiSource?.venue, resepsiSource?.address, akad.addressName),
      mapsUrl: pickText(resepsiSource?.mapsUrl, resepsiSource?.mapsLink, akad.mapsUrl),
      coverPhoto: pickAsset(resepsiSource?.coverPhoto, resepsiSource?.coverImage, mergedData?.resepsiCover, akad.coverPhoto),
    };

    const streaming = {
      label: pickText(livestreamSource?.label, livestreamSource?.platformLabel, "@Instagram"),
      date: pickText(livestreamSource?.date, akad.date),
      time: pickText(livestreamSource?.time, akad.time),
      url: pickText(livestreamSource?.url),
    };
    const hasStreaming =
      (mergedData?.features?.livestreamEnabled ?? false) ||
      resolveLivestreamCapability(mergedData) ||
      Boolean(streaming.url);

    const legacyGift = mergedData?.gifts || {};
    const genericGift = mergedData?.gift || {};
    const digitalEnvelopeInfo = mergedData?.features?.digitalEnvelopeInfo || {};
    const rawBankList = [
      ...(Array.isArray(legacyGift?.bankAccounts) ? legacyGift.bankAccounts : []),
      ...(Array.isArray(genericGift?.bankList) ? genericGift.bankList : []),
      ...(Array.isArray(digitalEnvelopeInfo?.bankList) ? digitalEnvelopeInfo.bankList : []),
    ];
    const bankList = rawBankList.map(normalizeBankAccount).filter(Boolean);
    const bank1 = bankList[0] || null;
    const bank2 = bankList[1] || null;
    const rawShipping = {
      ...(legacyGift?.shipping || {}),
      ...(genericGift?.shipping || {}),
      ...(digitalEnvelopeInfo?.shipping || {}),
    };
    const hasShippingData = Boolean(pickText(rawShipping?.recipient, rawShipping?.phone, rawShipping?.address));
    const shipping = {
      recipient: pickText(rawShipping?.recipient, groom.fullName),
      phone: pickText(rawShipping?.phone, "-"),
      address: pickText(rawShipping?.address, akad.addressName, "-"),
    };
    const hasGiftSection = (mergedData?.features?.digitalEnvelopeEnabled ?? true) && (bankList.length > 0 || hasShippingData);

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
      if (next) node.style.backgroundImage = `url("${next}")`;
      node.style.backgroundPosition = "center center";
      node.style.backgroundSize = "cover";
      node.style.backgroundRepeat = "no-repeat";
    });

    root.querySelectorAll("a[href]").forEach((node) => {
      const href = node.getAttribute("href") || "";
      if (!href || href.startsWith("#") || /^https?:\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)) return;
      const next = resolveAssetUrl(href);
      if (next && next !== href) node.setAttribute("href", next);
    });

    setText(root, ".elementor-element-4aed6964 .elementor-heading-title", copy.coverTitle || "The Wedding of");
    setHtml(root, ".elementor-element-7fec0abf .elementor-widget-container", `<p>${escapeHtml(coupleDisplay)}</p>`);
    setText(root, ".elementor-element-623c7507 .elementor-heading-title", guestGreeting);
    setText(root, ".elementor-element-6731e16c .elementor-heading-title", guestName);
    setText(root, ".elementor-element-4bdce91 .elementor-button-text", copy.openButton || "BUKA UNDANGAN");

    clearBackgroundImage(root, ".elementor-element-d967e9");
    setBackgroundImage(root, ".elementor-element-4478493a", desktopCoverPhoto, { position: "top center" });
    setBackgroundImage(root, ".elementor-element-359cf670", mobileCoverPhoto, { position: "bottom center" });
    setImage(root, ".elementor-element-dfc973f img", heroPhoto, "assets/images/SUJA-24SK1173-ALL-PII.webp");

    setText(root, ".elementor-element-3680e999 .elementor-heading-title", copy.heroTitle || "The Wedding Of");
    setText(root, ".elementor-element-606cba01 .elementor-heading-title", coupleDisplay);
    setText(root, ".elementor-element-63bc46cc .elementor-heading-title", displayDate);

    setText(root, ".elementor-element-535c83d9 .elementor-heading-title", copy.heroTitle || "The Wedding of");
    setText(root, ".elementor-element-78bd6e34 .elementor-heading-title", coupleDisplay);
    setText(root, ".elementor-element-69b16771 .elementor-heading-title", displayDate);
    setText(root, ".elementor-element-1f3c6efb .elementor-button-text", copy.saveTheDate || "Save The Date");

    setText(root, ".elementor-element-3eb65e48 p", getNameInitial(groom.nickName, "H"));
    setText(root, ".elementor-element-7989e60c p", getNameInitial(bride.nickName, "A"));
    setHtml(root, ".elementor-element-32613992 .elementor-widget-container", formatQuoteHtml(quoteText, quoteSource));

    setText(root, ".elementor-element-29fcde9 .elementor-heading-title", copy.coupleTitle || "Kedua Mempelai");
    setHtml(root, ".elementor-element-8dbd8be .elementor-widget-container", `<p>${escapeHtml(bride.nickName)}</p>`);
    setText(root, ".elementor-element-1b389f5a .elementor-heading-title", bride.fullName);
    setHtml(root, ".elementor-element-4dff81de .elementor-widget-container", formatParentInfoHtml(bride.parentInfo));

    setHtml(root, ".elementor-element-1c0c8223 .elementor-widget-container", `<p>${escapeHtml(groom.nickName)}</p>`);
    setText(root, ".elementor-element-63b29b3e .elementor-heading-title", groom.fullName);
    setHtml(root, ".elementor-element-36ad69f2 .elementor-widget-container", formatParentInfoHtml(groom.parentInfo));

    setLink(root, ".elementor-element-112b21bd a.elementor-social-icon-instagram", toInstagramUrl(bride.instagram));
    setLink(root, ".elementor-element-56372222 a.elementor-social-icon-instagram", toInstagramUrl(groom.instagram));

    setBackgroundImage(root, ".elementor-element-6b4db1f2", coupleSectionPhoto, { position: "top center" });
    setImage(root, ".elementor-element-1fdc8774 img", bride.image, schemaJson?.bride?.image);
    setImage(root, ".elementor-element-1c40500 img", groom.image, schemaJson?.groom?.image);

    setText(root, ".elementor-element-2cbc0e63 .elementor-heading-title", copy.countdownTitle || "MENUJU HARI BAHAGIA");

    const akadCard = root.querySelector(".elementor-element-4773c7fd");
    const resepsiCard = root.querySelector(".elementor-element-40607301");
    [akadCard, resepsiCard].forEach((node) => {
      if (!node) return;
      node.classList.add("pa-section-photo");
      node.style.minHeight = "unset";
      node.style.height = "auto";
    });
    setBackgroundImage(root, ".elementor-element-4773c7fd", akad.coverPhoto, {
      position: "center center",
      overlay: "rgba(0, 0, 0, 0.80)",
    });
    setBackgroundImage(root, ".elementor-element-40607301", resepsi.coverPhoto, {
      position: "center center",
      overlay: "rgba(0, 0, 0, 0.80)",
    });
    setNodeVisible(root, ".elementor-element-4c8dc35b", false);
    setNodeVisible(root, ".elementor-element-3ca78a72", false);

    setText(root, ".elementor-element-39c0b7c .elementor-heading-title", copy.eventIntro || schemaJson?.copy?.eventIntro || "");
    setText(root, ".elementor-element-421de45b .elementor-heading-title", akad.title);
    setText(root, ".elementor-element-3075ddd1 .elementor-heading-title", akad.date);
    setText(root, ".elementor-element-747dcb9 .elementor-heading-title", akad.time);
    setHtml(root, ".elementor-element-6583b60f .elementor-widget-container", formatEventAddressHtml(akadSource));
    setLink(root, ".elementor-element-49e9eabe a.elementor-button", akad.mapsUrl);

    setText(root, ".elementor-element-5cc8d2a8 .elementor-heading-title", resepsi.title);
    setText(root, ".elementor-element-25b9dde4 .elementor-heading-title", resepsi.date);
    setText(root, ".elementor-element-7ce43ba6 .elementor-heading-title", resepsi.time);
    setHtml(root, ".elementor-element-7a6eb763 .elementor-widget-container", formatEventAddressHtml(resepsiSource));
    setLink(root, ".elementor-element-56cb6222 a.elementor-button", resepsi.mapsUrl);

    setHtml(root, ".elementor-element-26ee4767 .elementor-widget-container", `<p>${escapeHtml(copy.livestreamTitle || "Live Streaming")}</p>`);
    setText(
      root,
      ".elementor-element-53c44360 .elementor-heading-title",
      copy.livestreamIntro ||
        "Kami mengundang Bapak/Ibu/Saudara/i untuk menyaksikan pernikahan kami secara virtual yang disiarkan langsung melalui media sosial di bawah ini:"
    );
    setText(root, ".elementor-element-3f9bf4f9 .elementor-heading-title", streaming.date);
    setText(root, ".elementor-element-386e8a79 .elementor-heading-title", streaming.time);
    setText(root, ".elementor-element-626a8ac3 .elementor-button-text", streaming.label);
    setLink(root, ".elementor-element-626a8ac3 a.elementor-button", streaming.url);
    setNodeVisible(root, ".elementor-element-65e24d22", hasStreaming);

    setHtml(root, ".elementor-element-6fb79463 .elementor-widget-container", `<p>${escapeHtml(copy.galleryTitle || "Our Gallery")}</p>`);

    const galleryItems = Array.isArray(mergedData?.gallery) ? mergedData.gallery.map(resolveAssetUrl).filter(Boolean) : [];
    const galleryContainer = root.querySelector(".elementor-element-663c198b .elementor-gallery__container");
    const galleryNodes = Array.from(root.querySelectorAll(".elementor-element-663c198b .e-gallery-item"));
    if (galleryContainer) galleryContainer.classList.add("pa-gallery-fallback");
    const activeGalleryItems = isStaticDemoMode
      ? galleryItems.length > 0
        ? galleryItems
        : galleryNodes
          .map((anchor) => resolveAssetUrl(anchor.getAttribute("href") || ""))
          .filter(Boolean)
      : galleryItems;

    if (galleryContainer) {
      const galleryTemplateNode = galleryNodes[0] || null;
      galleryContainer.innerHTML = "";

      activeGalleryItems.forEach((nextImage) => {
        const anchor = galleryTemplateNode ? galleryTemplateNode.cloneNode(true) : document.createElement("a");
        anchor.className = galleryTemplateNode?.className || "e-gallery-item elementor-gallery-item elementor-animated-content";
        anchor.style.display = "block";
        anchor.setAttribute("href", nextImage);
        anchor.setAttribute("data-elementor-open-lightbox", "yes");
        anchor.setAttribute("data-elementor-lightbox-slideshow", "663c198b");
        anchor.removeAttribute("data-e-action-hash");

        let imageNode = anchor.querySelector(".e-gallery-image");
        if (!imageNode) {
          imageNode = document.createElement("div");
          imageNode.className = "e-gallery-image elementor-gallery-item__image";
          anchor.appendChild(imageNode);
        }

        imageNode.setAttribute("data-thumbnail", nextImage);
        imageNode.style.backgroundImage = `url("${nextImage}")`;
        imageNode.style.backgroundPosition = "center center";
        imageNode.style.backgroundRepeat = "no-repeat";
        imageNode.style.backgroundSize = "cover";

        galleryContainer.appendChild(anchor);
      });
    }

    setNodeVisible(root, ".elementor-element-663c198b", activeGalleryItems.length > 0 || isStaticDemoMode);

    setHtml(root, ".elementor-element-238d1126 .elementor-widget-container", `<p>${escapeHtml(copy.loveStoryTitle || "Love Story")}</p>`);
    const rawStories = Array.isArray(mergedData?.loveStory)
      ? mergedData.loveStory
      : Array.isArray(mergedData?.lovestory)
        ? mergedData.lovestory
        : Array.isArray(mergedData?.stories)
          ? mergedData.stories
          : [];
    const stories = rawStories.map(normalizeRuntimeStory).filter(Boolean);
    const storyBindings = [
      {
        titleSelector: ".elementor-element-4d91d29d",
        bodySelector: ".elementor-element-2226599f",
      },
      {
        titleSelector: ".elementor-element-4b922a7d",
        bodySelector: ".elementor-element-27a54e7",
      },
      {
        titleSelector: ".elementor-element-696fc2cc",
        bodySelector: ".elementor-element-7879f7e9",
      },
    ];

    storyBindings.forEach(({ titleSelector, bodySelector }, index) => {
      const story = stories[index];
      const hasStory = Boolean(story?.title || story?.description || story?.text || story?.date);

      setNodeVisible(root, titleSelector, hasStory);
      setNodeVisible(root, bodySelector, hasStory);

      if (!hasStory) {
        setHtml(root, `${titleSelector} .elementor-widget-container`, "");
        setHtml(root, `${bodySelector} .elementor-widget-container`, "");
        return;
      }

      setHtml(root, `${titleSelector} .elementor-widget-container`, `<p>${escapeHtml(story?.title || "")}</p>`);
      setHtml(
        root,
        `${bodySelector} .elementor-widget-container`,
        `<p style="text-align: justify;">${escapeHtml(story?.description || story?.text || "")}</p>`
      );
    });

    setText(root, ".elementor-element-15be07d9 .elementor-heading-title", copy.giftTitle || "Wedding Gift");
    setHtml(root, ".elementor-element-141b6a99 .elementor-widget-container", `<p>${escapeHtml(copy.giftIntro || "")}</p>`);
    setText(root, ".elementor-element-4c42a555 .elementor-button-text", copy.giftToggleLabel || "Klik di sini");
    setNodeVisible(root, ".elementor-element-43104f45", hasGiftSection);

    setNodeVisible(root, ".elementor-element-47a1bba0", Boolean(bank1));
    setNodeVisible(root, ".elementor-element-4d7dbe7d", Boolean(bank2));
    setNodeVisible(root, ".elementor-element-6efe9a3d", hasShippingData);
    setNodeVisible(root, ".elementor-element-4e6e1333", Boolean(bank1?.logo));
    setNodeVisible(root, ".elementor-element-24f130ef", Boolean(bank1?.chip));
    setNodeVisible(root, ".elementor-element-1f4e8e34", Boolean(bank2?.logo));

    setImage(root, ".elementor-element-4e6e1333 img", bank1?.logo);
    setImage(root, ".elementor-element-24f130ef img", bank1?.chip);
    setImage(root, ".elementor-element-1f4e8e34 img", bank2?.logo);

    setHtml(root, ".elementor-element-124e0fdb .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank1?.accountNumber || "-")}</p>`);
    setHtml(root, ".elementor-element-15e9e282 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank1?.accountHolder || "-")}</p>`);
    setHtml(root, ".elementor-element-71a8e014 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank2?.accountNumber || "-")}</p>`);
    setHtml(root, ".elementor-element-16681b37 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank2?.accountHolder || "-")}</p>`);

    const copyBox1 = root.querySelector(".elementor-element-24d1d394 .copy-content");
    const copyBox2 = root.querySelector(".elementor-element-751d79fe .copy-content");
    if (copyBox1) copyBox1.textContent = pickText(bank1?.accountNumber);
    if (copyBox2) copyBox2.textContent = pickText(bank2?.accountNumber);

    setHtml(root, ".elementor-element-45da7c64 .elementor-widget-container", `<p>${escapeHtml(copy.shippingTitle || "Kirim Hadiah")}</p>`);
    setHtml(
      root,
      ".elementor-element-63cff63a .elementor-widget-container",
      `<p>Nama Penerima : ${escapeHtml(shipping.recipient)}</p><p>No. HP : ${escapeHtml(shipping.phone)}</p><p>${escapeHtml(shipping.address)}</p>`
    );

    setText(root, ".elementor-element-3437d66e .elementor-heading-title", copy.wishesTitle || "Wishes");
    setHtml(root, ".elementor-element-59922aab .elementor-widget-container", `<p>${escapeHtml(copy.wishesIntro || "")}</p>`);
    setNodeVisible(root, ".elementor-element-36ff6cc1", mergedData?.features?.wishesEnabled ?? true);

    const wishesWidget = root.querySelector(".elementor-element-44eea63b .cui-wrapper");
    if (wishesWidget) wishesWidget.classList.remove("cui-comments-closed");

    const wishesWrap = root.querySelector("#cui-wrap-commnent-13735");
    if (wishesWrap) wishesWrap.style.display = "block";

    const wishesFormContainer = root.querySelector("#cui-container-form-13735");
    if (wishesFormContainer && !wishesFormContainer.querySelector("#commentform-13735")) {
      wishesFormContainer.innerHTML = `
        <div class="respond">
          <form action="#" method="post" id="commentform-13735" class="comment-form pa-wish-form">
            <p class="comment-form-author cui-field-1">
              <input id="author" name="author" type="text" class="cui-input" maxlength="50" placeholder="Nama" autocomplete="name" required />
            </p>
            <div class="cui-wrap-textarea">
              <textarea id="comment" name="comment" class="cui-textarea" rows="4" placeholder="Ucapan" required></textarea>
            </div>
            <div class="cui-field-wrap">
              <select id="attendance-13735" name="attendance" class="cui-select" required>
                <option value="" selected disabled>Pilih Kehadiran</option>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
              </select>
            </div>
            <div class="cui-wrap-submit">
              <p class="form-submit">
                <input name="submit" type="submit" id="submit-13735" class="submit" value="Kirim" />
              </p>
            </div>
          </form>
        </div>
      `;
    }

    const countLink = root.querySelector("#cui-link-13735");
    const attendanceWrap = root.querySelector("#invitation-count-13735");
    const wishesBox = root.querySelector("#cui-box");
    const wishesList = root.querySelector("#cui-container-comment-13735");
    const renderWishes = (entries) => {
      if (!wishesList || !countLink || !attendanceWrap) return;
      const items = Array.isArray(entries) && entries.length > 0 ? entries : fallbackWishes;

      wishesList.style.display = "block";
      if (wishesBox) wishesBox.style.display = "block";

      const hadirCount = items.filter((entry) => /hadir/i.test(entry.attendance) && !/(tidak|absen)/i.test(entry.attendance)).length;
      const tidakHadirCount = items.filter((entry) => /(tidak|absen)/i.test(entry.attendance)).length;

      wishesList.innerHTML = items
        .map(
          (entry) =>
            `<li class="cui-item-comment"><div class="cui-comment-content"><div class="cui-comment-info"><a href="#" class="cui-commenter-name" onclick="return false;">${escapeHtml(
              entry.author
            )}</a><span class="cui-post-author">${escapeHtml(entry.attendance)}</span><span class="cui-comment-time">${escapeHtml(
              formatWishRelativeTime(entry.createdAt)
            )}</span></div><div class="cui-comment-text"><p>${escapeHtml(entry.comment)}</p></div></div></li>`
        )
        .join("");

      countLink.innerHTML = `<span>${items.length}</span> Comments`;
      countLink.setAttribute("title", `${items.length} Comments`);

      const countCards = attendanceWrap.querySelectorAll(".cui_comment_count_card span:first-child");
      if (countCards.length >= 2) {
        countCards[0].textContent = String(hadirCount);
        countCards[1].textContent = String(tidakHadirCount);
      }
    };
    renderWishes(wishes);

    const onCountLinkClick = (event) => {
      event.preventDefault();
      const target = root.querySelector(".elementor-element-44eea63b");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    countLink?.addEventListener("click", onCountLinkClick);
    registerCleanup(() => countLink?.removeEventListener("click", onCountLinkClick));

    const commentStatus = root.querySelector("#cui-comment-status-13735");
    const wishForm = root.querySelector("#commentform-13735");
    const onWishSubmit = async (event) => {
      event.preventDefault();

      const author = wishForm?.querySelector("#author");
      const comment = wishForm?.querySelector("#comment");
      const attendance = wishForm?.querySelector("#attendance-13735");
      const submitBtn = wishForm?.querySelector("input[type='submit']");
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
      wishForm.classList.add("is-submitting");
      const formElements = wishForm.querySelectorAll("input, textarea, select, button");
      formElements.forEach((el) => {
        el.disabled = true;
      });

      let originalSubmitValue = "";
      if (submitBtn) {
        originalSubmitValue = submitBtn.value;
        submitBtn.value = "Mengirim...";
      }

      try {
        const activeInvitationSlug = resolveInvitationSlug(mergedData, invitationSlug || "puspa-asmara");
        const activeOrderId = resolveOrderId(mergedData);
        await postInvitationWish(activeInvitationSlug, {
          invitationSlug: activeInvitationSlug,
          orderId: activeOrderId,
          author: nextEntry.author,
          comment: nextEntry.comment,
          attendance: nextEntry.attendance,
        });
      } catch {
        // Keep optimistic local render
      } finally {
        // --- Stop Loading ---
        wishForm.classList.remove("is-submitting");
        formElements.forEach((el) => {
          el.disabled = false;
        });
        if (submitBtn) {
          submitBtn.value = originalSubmitValue;
        }
      }

      setWishes((prev) => {
        const next = [nextEntry, ...prev];
        writeStoredWishes(next);
        return next;
      });
      wishForm.reset();

      if (commentStatus) {
        commentStatus.textContent = "Ucapan berhasil dikirim.";
        commentStatus.style.display = "block";
        window.setTimeout(() => {
          commentStatus.textContent = "";
          commentStatus.style.display = "";
        }, 2500);
      }
    };
    wishForm?.addEventListener("submit", onWishSubmit);
    registerCleanup(() => wishForm?.removeEventListener("submit", onWishSubmit));

    setHtml(root, ".elementor-element-5308cf9a .elementor-widget-container", `<p>${escapeHtml(copy.closingText || "")}</p>`);
    setText(root, ".elementor-element-189716e3 .elementor-heading-title", coupleDisplay);
    setText(root, ".elementor-element-3e99b45f p", getNameInitial(groom.nickName, "H"));
    setText(root, ".elementor-element-13c06846 p", getNameInitial(bride.nickName, "A"));

    setHtml(root, ".elementor-element-40dd7e2e .elementor-widget-container", `<p>${escapeHtml(copy.creditText || "")}</p>`);

    const closingPhoto = pickAsset(copy.closingBackgroundPhoto, resepsi.coverPhoto, akad.coverPhoto, heroPhoto, "assets/images/SUJA-24SK1173-PII-9-1-e1730097922583.jpg");
    setImage(root, ".elementor-element-32cb9456 img", closingPhoto, "assets/images/SUJA-24SK1173-PII-9-1-e1730097922583.jpg");

    const countdownNode = root.querySelector("#wpkoi-elements-countdown-627ba577");
    if (countdownNode) {
      countdownNode.setAttribute("data-date", eventDateISO);
      updateCountdownNode(countdownNode, eventDateISO);
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = window.setInterval(() => updateCountdownNode(countdownNode, eventDateISO), 1000);
    }

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

    revealAnimatedNodes();
    runReveal();
    const onScroll = () => runReveal();
    window.addEventListener("scroll", onScroll, { passive: true });
    registerCleanup(() => window.removeEventListener("scroll", onScroll));

    const coverNode = root.querySelector("#sec");
    const awNode = root.querySelector(".aw");
    const openButton = root.querySelector("#open");
    const saveDateButton = root.querySelector(".elementor-element-1f3c6efb a.elementor-button");

    if (saveDateButton) {
      const onSaveDateClick = (event) => {
        const eventMeta = buildCalendarEventMeta(mergedData);
        if (!eventMeta) return;
        event.preventDefault();

        if (shouldUseIcsCalendar()) {
          downloadCalendarFile(mergedData, invitationSlug || mergedData?.invitation?.slug || "puspa-asmara");
          return;
        }

        openGoogleCalendar(mergedData);
      };

      saveDateButton.addEventListener("click", onSaveDateClick);
      registerCleanup(() => saveDateButton.removeEventListener("click", onSaveDateClick));
    }

    const song = root.querySelector("#song");
    const songSource = root.querySelector("#song source");
    if (songSource && mergedData?.media?.audio) {
      songSource.setAttribute("src", resolveAssetUrl(mergedData.media.audio));
      song.load();
    }
    audioRef.current = song;

    const audioContainer = root.querySelector("#audio-container");
    const muteIcon = root.querySelector("#mute-sound");
    const unmuteIcon = root.querySelector("#unmute-sound");
    let audioActive = Boolean(mergedData?.features?.audioEnabled ?? true);
    if (muteIcon) muteIcon.style.display = audioActive ? "block" : "none";
    if (unmuteIcon) unmuteIcon.style.display = "none";

    const playAudio = () => {
      if (!audioActive || !audioRef.current) return;
      audioRef.current.play().catch(() => {
        // ignore autoplay restrictions
      });
    };

    const pauseAudio = () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
    };

    if (audioContainer) {
      const onAudioToggle = (event) => {
        event.preventDefault();
        if (!audioRef.current) return;

        if (audioActive) {
          pauseAudio();
          audioActive = false;
          if (muteIcon) muteIcon.style.display = "none";
          if (unmuteIcon) unmuteIcon.style.display = "block";
        } else {
          playAudio();
          audioActive = true;
          if (muteIcon) muteIcon.style.display = "block";
          if (unmuteIcon) unmuteIcon.style.display = "none";
        }
      };

      audioContainer.addEventListener("click", onAudioToggle);
      registerCleanup(() => audioContainer.removeEventListener("click", onAudioToggle));
    }

    const onVisibilityChange = () => {
      if (!audioRef.current) return;

      if (document.visibilityState === "hidden") {
        audioResumeRef.current = !audioRef.current.paused;
        pauseAudio();
        return;
      }

      if (document.visibilityState === "visible" && audioResumeRef.current) {
        playAudio();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    registerCleanup(() => document.removeEventListener("visibilitychange", onVisibilityChange));

    if (openButton) {
      const onOpen = (event) => {
        event.preventDefault();
        setIsInvitationOpened(true);
        document.body.classList.remove("pa-lock-scroll");
        document.body.style.position = "";
        document.body.style.height = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflowY = "";
        root.classList.add("pa-opened");

        root.querySelectorAll(".elementor-invisible").forEach((node) => {
          node.classList.remove("elementor-invisible");
          node.style.visibility = "visible";
          node.style.opacity = "";
          node.style.transform = "";
        });

        root.querySelectorAll(".aw").forEach((node) => {
          node.style.setProperty("display", "block", "important");
          node.classList.remove("elementor-invisible");
          node.querySelectorAll(".elementor-invisible").forEach((child) => child.classList.remove("elementor-invisible"));
        });

        if (awNode) {
          awNode.style.setProperty("display", "block", "important");
          awNode.classList.remove("elementor-invisible");
        }
        if (coverNode) {
          coverNode.style.opacity = "0";
          coverNode.style.transition = `opacity ${tokens.motion.gateDurationMs}ms ease-in-out`;
          coverNode.style.pointerEvents = "none";
          unlockTimerRef.current = window.setTimeout(() => {
            coverNode.style.visibility = "hidden";
          }, tokens.motion.gateDurationMs);
        }
        playAudio();
      };

      openButton.addEventListener("click", onOpen);
      registerCleanup(() => openButton.removeEventListener("click", onOpen));
    }

    const envelopeToggle = root.querySelector("#klik");
    const envelope = root.querySelector("#amplop");
    if (envelopeToggle && envelope) {
      const onToggleEnvelope = (event) => {
        event.preventDefault();
        slideToggleElement(envelope, tokens.motion.giftToggleMs);
      };

      envelopeToggle.addEventListener("click", onToggleEnvelope);
      registerCleanup(() => envelopeToggle.removeEventListener("click", onToggleEnvelope));
    }

    root.querySelectorAll(".elementor-widget-weddingpress-copy-text .elementor-button").forEach((button) => {
      const onCopy = async (event) => {
        event.preventDefault();
        const wrapper = button.closest(".elementor-widget-weddingpress-copy-text");
        const contentNode = wrapper?.querySelector(".copy-content");
        const textNode = button.querySelector(".elementor-button-text");
        const value = normalizeText(contentNode?.textContent || "");
        if (!value) return;

        const copied = await copyToClipboard(value);
        if (!textNode) return;

        const original = textNode.textContent;
        textNode.textContent = copied ? "berhasil disalin" : "gagal menyalin";
        window.setTimeout(() => {
          textNode.textContent = original;
        }, 900);
      };

      button.addEventListener("click", onCopy);
      registerCleanup(() => button.removeEventListener("click", onCopy));
    });

    root.querySelectorAll(".elementor-element-663c198b .e-gallery-item").forEach((anchor) => {
      const onOpenLightbox = (event) => {
        event.preventDefault();
        if (!(mergedData?.features?.lightboxEnabled ?? true)) return;
        const href = resolveAssetUrl(anchor.getAttribute("href") || "");
        if (href) setLightboxImage(href);
      };

      anchor.addEventListener("click", onOpenLightbox);
      registerCleanup(() => anchor.removeEventListener("click", onOpenLightbox));
    });

    const dateSection = root.querySelector("#date");
    const embedNode = dateSection?.querySelector(".elementor-background-video-embed");
    const dataSettings = parseDataSettings(dateSection?.getAttribute("data-settings") || "");
    const videoLink = normalizeText(dataSettings?.background_video_link || "");
    const embedUrl = toYouTubeEmbedUrl(videoLink);
    if (embedNode && embedUrl && !embedNode.querySelector("iframe")) {
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("frameborder", "0");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.position = "absolute";
      iframe.style.inset = "0";
      embedNode.appendChild(iframe);
    }

    const lottieFeatureEnabled = mergedData?.features?.lottieEnabled ?? true;
    if (lottieFeatureEnabled) {
      loadScriptOnce("pa-lottie-script", LOTTIE_HREF)
        .then(() => {
          const lottieApi = window.lottie;
          if (!lottieApi) return;

          lottieInstancesRef.current.forEach((instance) => {
            try {
              instance.destroy();
            } catch {
              // ignore
            }
          });
          lottieInstancesRef.current = [];

          root.querySelectorAll(".elementor-widget-lottie").forEach((widget) => {
            const animationNode = widget.querySelector(".e-lottie__animation");
            if (!animationNode) return;

            const settings = parseDataSettings(widget.getAttribute("data-settings") || "") || {};
            const jsonUrl =
              settings?.source_json?.url ||
              mergedData?.media?.lottieBird2 ||
              mergedData?.media?.lottieBird ||
              "assets/lottie/bird-hitam.json";

            const animation = lottieApi.loadAnimation({
              container: animationNode,
              renderer: settings?.renderer || "svg",
              loop: settings?.loop === "yes" || settings?.loop === true,
              autoplay: true,
              path: resolveAssetUrl(jsonUrl),
            });

            lottieInstancesRef.current.push(animation);
          });
        })
        .catch(() => {
          // ignore lottie load failures to keep template usable
        });
    }

    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
      lottieInstancesRef.current.forEach((instance) => {
        try {
          instance.destroy();
        } catch {
          // ignore
        }
      });
      lottieInstancesRef.current = [];
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
    };
  }, [fallbackWishes, invitationSlug, isStaticDemoMode, mergedData, wishes]);

  useEffect(() => {
    if (!lightboxImage) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setLightboxImage("");
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxImage]);

  return (
    <div className={`pa-template ${isStaticDemoMode ? "pa-demo" : "pa-live"}`} ref={rootRef}>
      <div dangerouslySetInnerHTML={{ __html: markup }} />

      {lightboxImage ? (
        <div className="pa-lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxImage("")}>
          <div className="pa-lightbox__dialog" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="pa-lightbox__close"
              aria-label="Tutup"
              onClick={() => setLightboxImage("")}
            >
              ×
            </button>
            <img className="pa-lightbox__image" src={lightboxImage} alt="Gallery" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
