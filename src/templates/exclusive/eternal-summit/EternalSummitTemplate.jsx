import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { postInvitationWish } from "../../../services/wishesApi";
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
  "page-id-13840",
  "wp-embed-responsive",
  "wp-theme-hello-elementor",
  "hello-elementor-default",
  "elementor-default",
  "elementor-template-canvas",
  "elementor-kit-5",
  "elementor-page",
  "elementor-page-13840",
];

const STYLE_LINK_ID = "eternal-summit-style";
const STYLE_HREF = `${PUBLIC_TEMPLATE_PREFIX}style.css?v=20260311-1`;
const LOTTIE_HREF = `${PUBLIC_ASSET_PREFIX}js/lottie.min.js`;
const WISHES_STORAGE_KEY = "exclusive_03_ucapan_13840";

const DUMMY_WISHES = [
  {
    author: "Ayu",
    comment: "Selamat menempuh hidup baru. Semoga sakinah mawaddah warahmah.",
    attendance: "Hadir",
    createdAt: "Baru saja",
  },
  {
    author: "Rizky",
    comment: "Turut berbahagia untuk kedua mempelai.",
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

  return output;
}

function normalizeWishItem(item) {
  const author = normalizeText(item?.author || item?.name || item?.guest || "");
  const comment = normalizeText(item?.comment || item?.message || item?.wish || "");
  const attendance = normalizeText(item?.attendance || item?.status || item?.konfirmasi || "Hadir");
  const createdAt = normalizeText(item?.createdAt || item?.date || "Baru saja");

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

function getOpenStateStorageKey(invitationSlug) {
  return `exclusive_03_open_${String(invitationSlug || "eternal-summit").trim().toLowerCase()}`;
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
  if (!node) return;
  node.setAttribute("href", normalizeText(value) || "#");
}

function parentInfoToHtml(parentInfo) {
  const text = normalizeText(parentInfo);
  if (!text) return "<p>-</p>";
  const parts = text.split(/\s*&\s*/).map((item) => item.trim()).filter(Boolean);
  if (parts.length <= 1) return `<p>${escapeHtml(text)}</p>`;
  return `<p>${escapeHtml(parts[0])}<br />&amp; ${escapeHtml(parts.slice(1).join(" & "))}</p>`;
}

function creditToHtml(text) {
  const raw = normalizeText(text);
  if (!raw) return "";
  const withEmoji = raw.replace(
    "❤",
    `<img decoding="async" class="emoji" role="img" draggable="false" src="${resolveAssetUrl("assets/images/2764.svg")}" alt="❤" />`
  );
  return `<p>${withEmoji}</p>`;
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
      return `${isoDateMatch[3]} . ${isoDateMatch[2]} . ${isoDateMatch[1]}`;
    }

    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear());
      return `${day} . ${month} . ${year}`;
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
  if (!endText) return `Pukul : ${normalizedStart} WIB`;

  const normalizedEnd = endText.replace(":", ".");
  return `Pukul : ${normalizedStart} WIB - ${normalizedEnd} WIB`;
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
  if (!raw) return pickText(fallback, "Klik Disini");
  if (raw.includes("youtube.com") || raw.includes("youtu.be")) return "YouTube Live";
  if (raw.includes("instagram.com")) return "Instagram Live";
  if (raw.includes("zoom.us")) return "Zoom Meeting";
  if (raw.includes("tiktok.com")) return "TikTok Live";
  if (raw.includes("facebook.com") || raw.includes("fb.watch")) return "Facebook Live";
  return pickText(fallback, "Klik Disini");
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
  const logo = pickAsset(item.logo, item.image);
  const chip = pickAsset(item.chip);

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
    const hasLabel = Boolean(pickText(candidate.label, candidate.platformLabel, candidate.title));
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
      incomingData.coverImage ||
      incomingData.frontCoverImage ||
      incomingData.galleryImages ||
      incomingData.gallery ||
      incomingData.stories ||
      incomingData.loveStory ||
      incomingData.lovestory ||
      incomingData.streaming ||
      incomingData.livestream ||
      incomingData.event?.livestream ||
      incomingData.gift ||
      incomingData.gifts ||
      incomingData.quote ||
      incomingData.quoteSource ||
      orderPayload.groom ||
      orderPayload.bride ||
      orderPayload.akad ||
      orderPayload.resepsi ||
      orderPayload.coverImage ||
      orderPayload.frontCoverImage ||
      orderPayload.galleryImages ||
      orderPayload.gallery ||
      orderPayload.stories ||
      orderPayload.loveStory ||
      orderPayload.lovestory ||
      orderPayload.streaming ||
      orderPayload.livestream ||
      orderPayload.gift ||
      orderPayload.gifts ||
      orderPayload.quote ||
      orderPayload.quoteSource
  );

  if (!hasRawPayload) return {};

  const groom = orderPayload.groom || incomingData.groom || {};
  const bride = orderPayload.bride || incomingData.bride || {};
  const akad = orderPayload.akad || incomingData.akad || incomingData.event?.akad || {};
  const resepsi = orderPayload.resepsi || incomingData.resepsi || incomingData.event?.resepsi || {};
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
  const runtimeBankList = Array.isArray(rawGift.bankList)
    ? rawGift.bankList
    : Array.isArray(rawGift.bankAccounts)
      ? rawGift.bankAccounts
      : Array.isArray(runtimeFeatures?.digitalEnvelopeInfo?.bankList)
        ? runtimeFeatures.digitalEnvelopeInfo.bankList
        : [];
  const runtimeShipping = {
    ...(runtimeFeatures?.digitalEnvelopeInfo?.shipping || {}),
    ...(rawGift.shipping || {}),
  };
  const runtimeDateISO = buildDateISO(
    akad.date,
    akad.startTime || akad.time,
    pickText(incomingData?.event?.dateISO, baseSchema?.event?.dateISO)
  );

  return {
    guest: {
      ...(orderPayload.guest || incomingData.guest || {}),
    },
    groom: {
      nickName: pickText(groom.nickname, groom.nickName, groom.fullname?.split?.(" ")[0], groom.nameFull),
      fullName: pickText(groom.fullname, groom.fullName, groom.nameFull),
      parentInfo: pickText(groom.parents, groom.parentInfo),
      instagram: pickText(groom.instagram),
      image: pickAsset(groom.photo, groom.image),
      photo: pickAsset(groom.photo, groom.image),
    },
    bride: {
      nickName: pickText(bride.nickname, bride.nickName, bride.fullname?.split?.(" ")[0], bride.nameFull),
      fullName: pickText(bride.fullname, bride.fullName, bride.nameFull),
      parentInfo: pickText(bride.parents, bride.parentInfo),
      instagram: pickText(bride.instagram),
      image: pickAsset(bride.photo, bride.image),
      photo: pickAsset(bride.photo, bride.image),
    },
    frontCoverImage: pickAsset(orderPayload.frontCoverImage, incomingData.frontCoverImage),
    coverImage: pickAsset(orderPayload.coverImage, incomingData.coverImage),
    openingThumbnailImage: pickAsset(orderPayload.openingThumbnailImage, incomingData.openingThumbnailImage),
    event: {
      ...(incomingData.event || {}),
      dateISO: runtimeDateISO,
      displayDate: pickText(
        formatCompactDateInput(runtimeDateISO, akad.date, resepsi.date),
        incomingData?.event?.displayDate,
        baseSchema?.event?.displayDate
      ),
      heroDate: pickText(
        formatDateID(akad.date),
        incomingData?.event?.heroDate,
        incomingData?.copy?.heroDate,
        baseSchema?.event?.heroDate
      ),
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
        date: pickText(formatDateID(resepsi.date), resepsi.date, formatDateID(akad.date), baseSchema?.event?.resepsi?.date),
        time: pickText(resepsi.time, formatTimeRange(resepsi.startTime, resepsi.endTime), baseSchema?.event?.resepsi?.time),
        addressName: pickText(resepsi.addressName, resepsi.venueName, resepsi.venue, baseSchema?.event?.resepsi?.addressName),
        address: pickText(resepsi.address, akad.address, baseSchema?.event?.resepsi?.address),
        mapsUrl: pickText(resepsi.mapsLink, resepsi.mapsUrl, akad.mapsLink, akad.mapsUrl, baseSchema?.event?.resepsi?.mapsUrl),
      },
      livestream: {
        ...(incomingData.event?.livestream || {}),
        title: pickText(rawStreaming.title, incomingData?.copy?.streamingTitle, baseSchema?.streaming?.title),
        intro: pickText(rawStreaming.intro, incomingData?.copy?.streamingIntro, baseSchema?.streaming?.intro),
        label: inferStreamingLabel(runtimeStreamingUrl, pickText(rawStreaming.label, rawStreaming.platformLabel, baseSchema?.streaming?.label)),
        date: pickText(rawStreaming.date, formatDateID(akad.date), baseSchema?.streaming?.date),
        time: pickText(rawStreaming.time, formatTimeRange(akad.startTime, akad.endTime), akad.time, baseSchema?.streaming?.time),
        url: runtimeStreamingUrl,
      },
    },
    streaming: {
      ...(incomingData.streaming || {}),
      title: pickText(rawStreaming.title, incomingData?.copy?.streamingTitle, baseSchema?.streaming?.title),
      intro: pickText(rawStreaming.intro, incomingData?.copy?.streamingIntro, baseSchema?.streaming?.intro),
      label: inferStreamingLabel(runtimeStreamingUrl, pickText(rawStreaming.label, rawStreaming.platformLabel, baseSchema?.streaming?.label)),
      date: pickText(rawStreaming.date, formatDateID(akad.date), baseSchema?.streaming?.date),
      time: pickText(rawStreaming.time, formatTimeRange(akad.startTime, akad.endTime), akad.time, baseSchema?.streaming?.time),
      url: runtimeStreamingUrl,
    },
    gallery: runtimeGallery,
    loveStory: runtimeStories,
    lovestory: runtimeStories,
    stories: runtimeStories,
    gifts: {
      ...(incomingData.gifts || {}),
      bankAccounts: runtimeBankList.map(normalizeBankAccount).filter(Boolean),
      shipping: runtimeShipping,
    },
    copy: {
      ...(incomingData.copy || {}),
      coverTitle: pickText(orderPayload.copy?.coverTitle, incomingData.copy?.coverTitle, baseSchema?.copy?.coverTitle),
      coverDear: pickText(orderPayload.copy?.coverDear, incomingData.copy?.coverDear, baseSchema?.copy?.coverDear),
      openButton: pickText(orderPayload.copy?.openButton, incomingData.copy?.openButton, baseSchema?.copy?.openButton),
      heroTitle: pickText(orderPayload.copy?.heroTitle, incomingData.copy?.heroTitle, baseSchema?.copy?.heroTitle),
      heroCouple: pickText(
        orderPayload.copy?.heroCouple,
        incomingData.copy?.heroCouple,
        `${pickText(groom.nickname, groom.nickName, groom.fullname?.split?.(" ")[0], groom.nameFull)} & ${pickText(
          bride.nickname,
          bride.nickName,
          bride.fullname?.split?.(" ")[0],
          bride.nameFull
        )}`,
        baseSchema?.copy?.heroCouple
      ),
      heroDate: pickText(orderPayload.copy?.heroDate, incomingData.copy?.heroDate, baseSchema?.copy?.heroDate),
      quote: pickText(orderPayload.quote, incomingData.quote, orderPayload.copy?.quote, incomingData.copy?.quote, baseSchema?.copy?.quote),
      quoteSource: pickText(orderPayload.quoteSource, incomingData.quoteSource, orderPayload.copy?.quoteSource, incomingData.copy?.quoteSource, baseSchema?.copy?.quoteSource),
      intro: pickText(orderPayload.copy?.intro, incomingData.copy?.intro, baseSchema?.copy?.intro),
      countdownTitle: pickText(orderPayload.copy?.countdownTitle, incomingData.copy?.countdownTitle, baseSchema?.copy?.countdownTitle),
      galleryTitle: pickText(orderPayload.copy?.galleryTitle, incomingData.copy?.galleryTitle, baseSchema?.copy?.galleryTitle),
      loveStoryTitle: pickText(orderPayload.copy?.loveStoryTitle, incomingData.copy?.loveStoryTitle, baseSchema?.copy?.loveStoryTitle),
      giftTitle: pickText(orderPayload.copy?.giftTitle, incomingData.copy?.giftTitle, baseSchema?.copy?.giftTitle),
      giftIntro: pickText(orderPayload.copy?.giftIntro, incomingData.copy?.giftIntro, baseSchema?.copy?.giftIntro),
      giftToggleLabel: pickText(orderPayload.copy?.giftToggleLabel, incomingData.copy?.giftToggleLabel, baseSchema?.copy?.giftToggleLabel),
      shippingTitle: pickText(orderPayload.copy?.shippingTitle, incomingData.copy?.shippingTitle, baseSchema?.copy?.shippingTitle),
      wishesTitle: pickText(orderPayload.copy?.wishesTitle, incomingData.copy?.wishesTitle, baseSchema?.copy?.wishesTitle),
      wishesIntro: pickText(orderPayload.copy?.wishesIntro, incomingData.copy?.wishesIntro, baseSchema?.copy?.wishesIntro),
      closingText: pickText(orderPayload.copy?.closingText, incomingData.copy?.closingText, baseSchema?.copy?.closingText),
      closingLead: pickText(orderPayload.copy?.closingLead, incomingData.copy?.closingLead, baseSchema?.copy?.closingLead),
      creditText: pickText(orderPayload.copy?.creditText, incomingData.copy?.creditText, baseSchema?.copy?.creditText),
      streamingTitle: pickText(orderPayload.copy?.streamingTitle, incomingData.copy?.streamingTitle, baseSchema?.streaming?.title),
      streamingIntro: pickText(orderPayload.copy?.streamingIntro, incomingData.copy?.streamingIntro, baseSchema?.streaming?.intro),
    },
    media: {
      ...(incomingData.media || {}),
      coverFrontImage: pickAsset(
        orderPayload.frontCoverImage,
        incomingData.frontCoverImage,
        incomingData.media?.coverFrontImage
      ),
      desktopCoverImage: pickAsset(
        orderPayload.coverImage,
        incomingData.coverImage,
        incomingData.media?.desktopCoverImage
      ),
      heroImage: pickAsset(
        orderPayload.openingThumbnailImage,
        incomingData.openingThumbnailImage,
        incomingData.media?.heroImage,
        incomingData.event?.heroImage,
        incomingData.couple?.heroPhoto
      ),
      closingImage: pickAsset(
        orderPayload.closingBackgroundImage,
        incomingData.closingBackgroundImage,
        incomingData.copy?.closingBackgroundPhoto,
        incomingData.media?.closingImage,
        orderPayload.openingThumbnailImage,
        incomingData.openingThumbnailImage,
        orderPayload.coverImage,
        incomingData.coverImage
      ),
      audio: pickAsset(
        orderPayload.music?.file,
        incomingData.audio?.src,
        incomingData.media?.audio,
        incomingData.music?.src,
        incomingData.music?.previewUrl
      ),
      lottiePrimary: pickText(incomingData.media?.lottiePrimary, baseSchema?.media?.lottiePrimary),
    },
    features: {
      ...runtimeFeatures,
      livestreamEnabled:
        orderPayload.features?.livestreamEnabled ??
        incomingData.features?.livestreamEnabled ??
        Boolean(runtimeStreamingUrl),
      digitalEnvelopeEnabled:
        orderPayload.features?.digitalEnvelopeEnabled ??
        incomingData.features?.digitalEnvelopeEnabled ??
        Boolean(runtimeBankList.length || pickText(runtimeShipping.recipient, runtimeShipping.phone, runtimeShipping.address)),
      wishesEnabled:
        orderPayload.features?.wishesEnabled ??
        incomingData.features?.wishesEnabled ??
        baseSchema?.features?.wishesEnabled,
      audioEnabled:
        orderPayload.features?.audioEnabled ??
        incomingData.features?.audioEnabled ??
        baseSchema?.features?.audioEnabled,
      lottieEnabled:
        orderPayload.features?.lottieEnabled ??
        incomingData.features?.lottieEnabled ??
        baseSchema?.features?.lottieEnabled,
      lightboxEnabled:
        orderPayload.features?.lightboxEnabled ??
        incomingData.features?.lightboxEnabled ??
        baseSchema?.features?.lightboxEnabled,
    },
  };
}

export default function EternalSummitTemplate({ data: propData, invitationSlug = "eternal-summit", mode = "live" }) {
  const isStaticDemoMode = mode === "demo";
  const openStateStorageKey = useMemo(() => getOpenStateStorageKey(invitationSlug), [invitationSlug]);
  const { data: fetchedData } = useInvitationData(invitationSlug, {
    fallbackSlug: "eternal-summit",
    skipFetch: Boolean(propData) || isStaticDemoMode,
  });
  const mergedData = useMemo(() => {
    if (isStaticDemoMode) {
      return mergeInvitationData(defaultSchema, schemaJson);
    }

    const fetchedRuntimeData = buildRuntimeInvitationData(fetchedData, defaultSchema);
    const propRuntimeData = buildRuntimeInvitationData(propData, defaultSchema);
    return mergeInvitationData(defaultSchema, schemaJson, fetchedData, propData, fetchedRuntimeData, propRuntimeData);
  }, [fetchedData, isStaticDemoMode, propData]);
  const liveOrderPayload = useMemo(
    () => mergedData?.order?.payload || fetchedData?.order?.payload || propData?.order?.payload || {},
    [mergedData, fetchedData, propData]
  );
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
  const [opened, setOpened] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(getOpenStateStorageKey(invitationSlug)) === "1";
    } catch {
      return false;
    }
  });
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
      link.setAttribute("data-template-style", "eternal-summit");
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
    if (!opened) {
      document.body.classList.add("es-lock-scroll");
    } else {
      document.body.classList.remove("es-lock-scroll");
    }

    setDynamicVh();
    const onResize = () => setDynamicVh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      document.body.classList.remove("es-lock-scroll");
      BODY_CLASSES.forEach((name) => document.body.classList.remove(name));
      previousBodyClasses.forEach((name) => document.body.classList.add(name));
    };
  }, [opened]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (opened) {
        window.sessionStorage.setItem(openStateStorageKey, "1");
      } else {
        window.sessionStorage.removeItem(openStateStorageKey);
      }
    } catch {
      // ignore storage failures
    }
  }, [openStateStorageKey, opened]);

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
    const seeded = Array.isArray(mergedData?.wishes) ? mergedData.wishes.map(normalizeWishItem).filter(Boolean) : [];
    const fallbackSeed = seeded.length > 0 ? seeded : fallbackWishes;
    const stored = typeof window !== "undefined" ? readStoredWishes() : null;
    setWishes(stored?.length ? stored : fallbackSeed);
  }, [mergedData, fallbackWishes]);

  useEffect(
    () => () => {
      if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    },
    []
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const cleanups = [];
    const registerCleanup = (fn) => cleanups.push(fn);

    const guestName = pickText(mergedData?.guest?.name, "Nama Tamu");
    const groom = {
      nickName: pickText(mergedData?.groom?.nickName, mergedData?.groom?.fullName, schemaJson.groom.nickName, "Habib"),
      fullName: pickText(mergedData?.groom?.fullName, mergedData?.groom?.nameFull, schemaJson.groom.fullName, "Habib Yulianto"),
      parentInfo: pickText(mergedData?.groom?.parentInfo, schemaJson.groom.parentInfo),
      instagram: pickText(mergedData?.groom?.instagram, "https://instagram.com/"),
      image: pickAsset(mergedData?.groom?.image, mergedData?.groom?.photo, schemaJson.groom.image),
    };
    const bride = {
      nickName: pickText(mergedData?.bride?.nickName, mergedData?.bride?.fullName, schemaJson.bride.nickName, "Adiba"),
      fullName: pickText(mergedData?.bride?.fullName, mergedData?.bride?.nameFull, schemaJson.bride.fullName, "Adiba Putri Syakilla"),
      parentInfo: pickText(mergedData?.bride?.parentInfo, schemaJson.bride.parentInfo),
      instagram: pickText(mergedData?.bride?.instagram, "https://instagram.com/"),
      image: pickAsset(mergedData?.bride?.image, mergedData?.bride?.photo, schemaJson.bride.image),
    };

    const copy = mergedData?.copy || {};
    const event = mergedData?.event || {};
    const coupleDisplay = pickText(`${groom.nickName} & ${bride.nickName}`, copy.heroCouple);
    const displayDate = pickText(event.displayDate, schemaJson.event.displayDate, "28 . 12. 2025");
    const heroDate = pickText(event.heroDate, copy.heroDate, schemaJson.event.heroDate, "Minggu, 28 Desember 2025");
    const countdownDateISO = pickText(event.dateISO, schemaJson.event.dateISO, "2026-02-04T10:00:00+07:00");
    const quoteText = pickText(copy.quote, mergedData?.quote, defaultSchema?.copy?.quote, schemaJson.copy.quote);
    const quoteSourceText = pickText(copy.quoteSource, mergedData?.quoteSource, defaultSchema?.copy?.quoteSource, schemaJson.copy.quoteSource);

    const orderPayload = liveOrderPayload;
    const akad = event.akad || {};
    const resepsi = event.resepsi || {};
    const streaming = {
      ...(mergedData?.streaming || {}),
      ...(mergedData?.event?.livestream || {}),
    };
    const hasStreaming = (orderPayload?.features?.livestreamEnabled ?? mergedData?.features?.livestreamEnabled ?? false) || Boolean(pickText(streaming?.url));
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
    const gifts = mergedData?.gifts || {};
    const bankList = (Array.isArray(gifts.bankAccounts) ? gifts.bankAccounts : []).map(normalizeBankAccount).filter(Boolean);
    const bank1 = bankList[0] || {};
    const bank2 = bankList[1] || {};
    const gallery = (Array.isArray(mergedData?.gallery) ? mergedData.gallery : []).map(normalizeGalleryItem).map(resolveAssetUrl).filter(Boolean);
    const hasGallery = gallery.length > 0;
    const hasStories = stories.length > 0;
    const hasShippingData = Boolean(pickText(gifts.shipping?.recipient, gifts.shipping?.phone, gifts.shipping?.address));
    const hasGiftSection = (mergedData?.features?.digitalEnvelopeEnabled ?? true) && (bankList.length > 0 || hasShippingData);

    const updateImage = (selector, value) => {
      const node = root.querySelector(selector);
      if (!node || !value) return;
      const resolved = resolveAssetUrl(value);
      node.setAttribute("src", resolved);
      node.removeAttribute("srcset");
      node.removeAttribute("sizes");
    };

    const updateResponsiveThumbnail = (selector, value) => {
      const node = root.querySelector(selector);
      if (!node || !value) return;
      const resolved = resolveAssetUrl(value);
      node.setAttribute("src", resolved);
      node.removeAttribute("srcset");
      node.removeAttribute("sizes");
      node.removeAttribute("width");
      node.removeAttribute("height");
      node.style.width = "100%";
      node.style.height = "auto";
      node.style.objectFit = "cover";
      node.style.objectPosition = "center top";
      node.style.display = "block";
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

    const setNodeVisible = (selector, visible) => {
      root.querySelectorAll(selector).forEach((node) => {
        node.style.display = visible ? "" : "none";
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
      node.style.backgroundImage = `url("${next}")`;
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

    setText(root, ".elementor-element-1c63d13d .elementor-heading-title", copy.coverTitle || "The Wedding of");
    setText(root, ".elementor-element-21a7b3db .elementor-heading-title", coupleDisplay);
    setText(root, ".elementor-element-56950f19 .elementor-heading-title", copy.coverDear || "Dear :");
    setText(root, ".elementor-element-725f20f4 .elementor-heading-title", guestName);
    setText(root, ".elementor-element-3de94342 .elementor-button-text", copy.openButton || "Buka Undangan");

    setText(root, ".elementor-element-3f94bff0 .elementor-heading-title", "The Wedding Of");
    setText(root, ".elementor-element-5a8e76f9 .elementor-heading-title", coupleDisplay);
    setText(root, ".elementor-element-6875cbf .elementor-heading-title", displayDate);

    setText(root, ".elementor-element-61be5801 .elementor-heading-title", copy.heroTitle || "The Wedding of");
    setText(root, ".elementor-element-46ab02c4 .elementor-heading-title", coupleDisplay);
    setHtml(root, ".elementor-element-628db1f7 .elementor-widget-container", `<p>${escapeHtml(heroDate)}</p>`);

    setHtml(root, ".elementor-element-7b047187 .elementor-widget-container", `<p>${escapeHtml(quoteText)}</p>`);
    setHtml(root, ".elementor-element-5ea3d9b2 .elementor-widget-container", `<p><i>${escapeHtml(quoteSourceText)}</i></p>`);
    setHtml(root, ".elementor-element-7f497d56 .elementor-widget-container", `<p>${escapeHtml(pickText(copy.intro, schemaJson.copy.intro))}</p>`);

    setHtml(root, ".elementor-element-5f70916a .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bride.fullName)}</p>`);
    setHtml(root, ".elementor-element-2a4f9739 .elementor-widget-container", parentInfoToHtml(bride.parentInfo));
    setLink(root, ".elementor-element-1c987e3d a.elementor-social-icon-instagram", toInstagramUrl(bride.instagram));

    setHtml(root, ".elementor-element-7b1a6b7a .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(groom.fullName)}</p>`);
    setHtml(root, ".elementor-element-2a5e2a4d .elementor-widget-container", parentInfoToHtml(groom.parentInfo));
    setLink(root, ".elementor-element-6e27a39e a.elementor-social-icon-instagram", toInstagramUrl(groom.instagram));

    const coverFrontImage = pickAsset(mergedData?.media?.coverFrontImage, mergedData?.frontCoverImage, schemaJson.media.heroImage);
    const desktopCoverImage = pickAsset(mergedData?.media?.desktopCoverImage, mergedData?.coverImage, coverFrontImage);
    const heroImage = pickAsset(mergedData?.media?.heroImage, mergedData?.openingThumbnailImage, coverFrontImage, schemaJson.media.heroImage);
    const closingImage = pickAsset(mergedData?.media?.closingImage, schemaJson.media.closingImage, heroImage);
    const countdownThumbnailImage = isStaticDemoMode
      ? ""
      : pickAsset(desktopCoverImage, mergedData?.coverImage, mergedData?.media?.desktopCoverImage, heroImage);
    const loveStoryThumbnailImage = isStaticDemoMode
      ? ""
      : pickAsset(desktopCoverImage, mergedData?.coverImage, mergedData?.media?.desktopCoverImage, heroImage);
    setBackgroundImage("#kolom", coverFrontImage);
    setBackgroundImage("#desk_cov", desktopCoverImage);
    updateImage(".elementor-element-4b37e843 img", bride.image);
    updateImage(".elementor-element-3b7f9a4a img", groom.image);
    updateImage(".elementor-element-50b78d58 img", heroImage);
    updateImage(".elementor-element-130b76d6 img", closingImage);
    updateResponsiveThumbnail(".elementor-element-76c4c342 img", countdownThumbnailImage);
    updateResponsiveThumbnail(".elementor-element-3faf1b3 img", loveStoryThumbnailImage);

    setText(root, ".elementor-element-28d46c09 .elementor-heading-title", copy.countdownTitle || "Menuju Hari Bahagia");

    setText(root, ".elementor-element-1474b51b .elementor-heading-title", normalizeText(akad.title || "Akad Nikah"));
    setHtml(root, ".elementor-element-1b962f22 .elementor-widget-container", `<p>${escapeHtml(akad.date || "")}</p>`);
    setHtml(root, ".elementor-element-7b91e401 .elementor-widget-container", `<p>${escapeHtml(akad.time || "")}</p>`);
    setHtml(root, ".elementor-element-1eb50d4e .elementor-widget-container", formatAddressHtml(akad.addressName || "", akad.address || ""));
    setLink(root, ".elementor-element-7c82a9ed a.elementor-button", normalizeText(akad.mapsUrl || "https://www.google.com/maps"));

    setText(root, ".elementor-element-23d77e99 .elementor-heading-title", normalizeText(resepsi.title || "Resepsi"));
    setHtml(root, ".elementor-element-5af3db73 .elementor-widget-container", `<p>${escapeHtml(resepsi.date || "")}</p>`);
    setHtml(root, ".elementor-element-1e224734 .elementor-widget-container", `<p>${escapeHtml(resepsi.time || "")}</p>`);
    setHtml(root, ".elementor-element-48b08001 .elementor-widget-container", formatAddressHtml(resepsi.addressName || "", resepsi.address || ""));
    setLink(root, ".elementor-element-6f77a52c a.elementor-button", normalizeText(resepsi.mapsUrl || "https://www.google.com/maps"));

    setText(root, ".elementor-element-7185baf3 .elementor-heading-title", pickText(streaming.title, copy.streamingTitle, schemaJson.streaming.title, "Live Streaming"));
    setHtml(root, ".elementor-element-4b860fdb .elementor-widget-container", `<p>${escapeHtml(pickText(streaming.intro, copy.streamingIntro, schemaJson.streaming.intro))}</p>`);
    setHtml(root, ".elementor-element-5d5400e7 .elementor-widget-container", `<p>${escapeHtml(pickText(streaming.date, schemaJson.streaming.date))}</p>`);
    setHtml(root, ".elementor-element-1bf2a554 .elementor-widget-container", `<p>${escapeHtml(pickText(streaming.time, schemaJson.streaming.time))}</p>`);
    setText(root, ".elementor-element-c42713b .elementor-button-text", pickText(streaming.label, schemaJson.streaming.label, "Klik Disini"));
    setLink(root, ".elementor-element-c42713b a.elementor-button", pickText(streaming.url));
    const streamingWrap = root.querySelector(".elementor-element-2a68ad7b");
    if (streamingWrap) streamingWrap.style.display = hasStreaming ? "" : "none";

    setHtml(root, ".elementor-element-6018d302 .elementor-widget-container", `<p>${escapeHtml(pickText(copy.galleryTitle, schemaJson.copy.galleryTitle, "Gallery"))}</p>`);

    const galleryContainer = root.querySelector(".elementor-element-1671b0ec .elementor-gallery__container");
    if (galleryContainer) galleryContainer.classList.add("es-gallery-fallback");
    if (galleryContainer) {
      galleryContainer.querySelectorAll("[data-es-gallery-clone='true']").forEach((node) => node.remove());
      const baseGalleryNode = galleryContainer.querySelector(".e-gallery-item");
      if (baseGalleryNode && gallery.length > 1) {
        const existingCount = galleryContainer.querySelectorAll(".e-gallery-item").length;
        for (let index = existingCount; index < gallery.length; index += 1) {
          const clone = baseGalleryNode.cloneNode(true);
          clone.setAttribute("data-es-gallery-clone", "true");
          galleryContainer.appendChild(clone);
        }
      }
    }

    const galleryNodes = Array.from(root.querySelectorAll(".elementor-element-1671b0ec .e-gallery-item"));
    galleryNodes.forEach((anchor, index) => {
      const image = gallery[index] || resolveAssetUrl(anchor.getAttribute("href") || "");
      if (!image) {
        anchor.style.display = "none";
        return;
      }
      anchor.style.display = "block";
      anchor.setAttribute("href", image);
      const imageNode = anchor.querySelector(".e-gallery-image");
      if (imageNode) {
        imageNode.setAttribute("data-thumbnail", image);
        imageNode.style.backgroundImage = `url("${image}")`;
      }
    });
    setNodeVisible(".elementor-element-6018d302", hasGallery);
    setNodeVisible(".elementor-element-1671b0ec", hasGallery);

    setText(root, ".elementor-element-572400b7 .elementor-heading-title", pickText(copy.loveStoryTitle, schemaJson.copy.loveStoryTitle, "Love Story"));
    [
      {
        titleSelector: ".elementor-element-7af95d3d",
        descSelector: ".elementor-element-1d0c858d",
      },
      {
        titleSelector: ".elementor-element-795576b2",
        descSelector: ".elementor-element-e835975",
      },
      {
        titleSelector: ".elementor-element-c722832",
        descSelector: ".elementor-element-1204c9f6",
      },
    ].forEach(({ titleSelector, descSelector }, index) => {
      const story = stories[index];
      const hasStory = Boolean(story?.title || story?.description || story?.text || story?.date);
      setNodeVisible(titleSelector, hasStory);
      setNodeVisible(descSelector, hasStory);
      if (!hasStory) return;
      setHtml(root, `${titleSelector} .elementor-widget-container`, `<p>${escapeHtml(pickText(story?.title, story?.date))}</p>`);
      setHtml(root, `${descSelector} .elementor-widget-container`, `<p>${escapeHtml(pickText(story?.description, story?.text))}</p>`);
    });
    setNodeVisible(".elementor-element-572400b7", hasStories);

    setText(root, ".elementor-element-1a11e47a .elementor-heading-title", pickText(copy.giftTitle, schemaJson.copy.giftTitle, "Wedding Gift"));
    setHtml(root, ".elementor-element-1a868be4 .elementor-widget-container", `<p>${escapeHtml(pickText(copy.giftIntro, schemaJson.copy.giftIntro))}</p>`);
    setText(root, ".elementor-element-7f4f3cb2 .elementor-button-text", pickText(copy.giftToggleLabel, schemaJson.copy.giftToggleLabel, "Klik di sini"));

    updateImage(".elementor-element-30aeaa27 img", bank1.logo);
    updateImage(".elementor-element-1f63c40b img", bank1.chip);
    updateImage(".elementor-element-d4387de img", bank2.logo);

    setHtml(root, ".elementor-element-6929603c .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank1.accountNumber || "-")}</p>`);
    setHtml(root, ".elementor-element-53f178ad .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank1.accountHolder || "-")}</p>`);
    setHtml(root, ".elementor-element-7cf3fe66 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank2.accountNumber || "-")}</p>`);
    setHtml(root, ".elementor-element-cbcefe6 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank2.accountHolder || "-")}</p>`);

    const copyBox1 = root.querySelector(".elementor-element-7d66bf2 .copy-content");
    const copyBox2 = root.querySelector(".elementor-element-50271a07 .copy-content");
    if (copyBox1) copyBox1.textContent = normalizeText(bank1.accountNumber || "");
    if (copyBox2) copyBox2.textContent = normalizeText(bank2.accountNumber || "");

    setHtml(root, ".elementor-element-27c73c9 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(pickText(copy.shippingTitle, schemaJson.copy.shippingTitle, "Kirim Hadiah"))}</p>`);
    setHtml(
      root,
      ".elementor-element-5c696c96 .elementor-widget-container",
      `<p>Nama Penerima : ${escapeHtml(gifts.shipping?.recipient || "-")}</p><p>No. HP : ${escapeHtml(
        gifts.shipping?.phone || "-"
      )}</p><p>${escapeHtml(gifts.shipping?.address || "-")}</p>`
    );
    setNodeVisible(".elementor-element-1a11e47a", hasGiftSection);
    setNodeVisible(".elementor-element-1a868be4", hasGiftSection);
    setNodeVisible(".elementor-element-7f4f3cb2", hasGiftSection);
    setNodeVisible(".elementor-element-30aeaa27", hasGiftSection);
    setNodeVisible(".elementor-element-1f63c40b", hasGiftSection);
    setNodeVisible(".elementor-element-d4387de", hasGiftSection);
    setNodeVisible(".elementor-element-6929603c", hasGiftSection);
    setNodeVisible(".elementor-element-53f178ad", hasGiftSection);
    setNodeVisible(".elementor-element-7cf3fe66", hasGiftSection);
    setNodeVisible(".elementor-element-cbcefe6", hasGiftSection);
    setNodeVisible(".elementor-element-7d66bf2", hasGiftSection);
    setNodeVisible(".elementor-element-50271a07", hasGiftSection);
    setNodeVisible(".elementor-element-27c73c9", hasGiftSection);
    setNodeVisible(".elementor-element-5c696c96", hasGiftSection);

    setText(root, ".elementor-element-4eed8a0c .elementor-heading-title", pickText(copy.wishesTitle, schemaJson.copy.wishesTitle, "Wishes"));
    setHtml(root, ".elementor-element-e2d3ee0 .elementor-widget-container", `<p>${escapeHtml(pickText(copy.wishesIntro, schemaJson.copy.wishesIntro))}</p>`);
    const wishesEnabled = mergedData?.features?.wishesEnabled ?? true;
    const wishesHeading = root.querySelector(".elementor-element-4eed8a0c");
    const wishesIntro = root.querySelector(".elementor-element-e2d3ee0");
    const wishesWidgetContainer = root.querySelector(".elementor-element-71fcba30");

    if (!wishesEnabled) {
      [wishesHeading, wishesIntro, wishesWidgetContainer].forEach((node) => {
        if (node) node.style.display = "none";
      });
    } else {
      [wishesHeading, wishesIntro, wishesWidgetContainer].forEach((node) => {
        if (node) node.style.display = "";
      });

      const wishesWidget = root.querySelector(".elementor-element-71fcba30 .cui-wrapper");
      if (wishesWidget) wishesWidget.classList.remove("cui-comments-closed");

      const wishesWrap = root.querySelector("#cui-wrap-commnent-13840");
      if (wishesWrap) wishesWrap.style.display = "block";

      const wishesFormContainer = root.querySelector("#cui-container-form-13840");
      if (wishesFormContainer && !wishesFormContainer.querySelector("#commentform-13840")) {
        wishesFormContainer.innerHTML = `
          <div class="respond">
            <form action="#" method="post" id="commentform-13840" class="comment-form">
              <p class="comment-form-author cui-field-1">
                <input id="author" name="author" type="text" class="cui-input" maxlength="50" placeholder="Nama" autocomplete="name" required />
              </p>
              <div class="cui-wrap-textarea">
                <textarea id="comment" name="comment" class="cui-textarea" rows="4" placeholder="Ucapan" required></textarea>
              </div>
              <div class="cui-field-wrap">
                <select id="attendance-13840" name="attendance" class="cui-select" required>
                  <option value="" selected disabled>Konfirmasi Kehadiran</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                </select>
              </div>
              <div class="cui-wrap-submit">
                <p class="form-submit">
                  <input name="submit" type="submit" id="submit-13840" class="submit" value="Kirim" />
                </p>
              </div>
            </form>
          </div>
        `;
      }

      const countLink = root.querySelector("#cui-link-13840");
      const attendanceWrap = root.querySelector("#invitation-count-13840");
      const wishesBox = root.querySelector("#cui-box");
      const wishesList = root.querySelector("#cui-container-comment-13840");

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
        const target = root.querySelector(".elementor-element-71fcba30");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      countLink?.addEventListener("click", onCountLinkClick);
      registerCleanup(() => countLink?.removeEventListener("click", onCountLinkClick));

      const commentStatus = root.querySelector("#cui-comment-status-13840");
      const wishForm = root.querySelector("#commentform-13840");

      const onWishSubmit = async (eventSubmit) => {
        eventSubmit.preventDefault();
        const author = wishForm?.querySelector("#author");
        const comment = wishForm?.querySelector("#comment");
        const attendance = wishForm?.querySelector("#attendance-13840");
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
          await postInvitationWish("eternal-summit", nextEntry);
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
    }

    setHtml(root, ".elementor-element-2389b4dd .elementor-widget-container", `<p>${escapeHtml(pickText(copy.closingText, schemaJson.copy.closingText))}</p>`);
    setHtml(root, ".elementor-element-383ba879 .elementor-widget-container", `<p>${escapeHtml(pickText(copy.closingLead, schemaJson.copy.closingLead, "Kami yang berbahagia,"))}</p>`);
    setText(root, ".elementor-element-43cb6db8 .elementor-heading-title", coupleDisplay);
    setHtml(root, ".elementor-element-1bad6d51 .elementor-widget-container", creditToHtml(pickText(copy.creditText, schemaJson.copy.creditText, "Support with ❤ by ikaancinta.in")));

    const countdownNode = root.querySelector("#wpkoi-elements-countdown-4909d2ba");
    if (countdownNode) {
      countdownNode.setAttribute("data-date", countdownDateISO);
      updateCountdownNode(countdownNode, countdownDateISO);
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = window.setInterval(() => updateCountdownNode(countdownNode, countdownDateISO), 1000);
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

    const pageCover = root.querySelector("#sec");
    const coverContent = root.querySelector("#kolom");
    const awNode = root.querySelector(".aw");
    const openButton = root.querySelector("#open");

    const applyOpenedState = (isOpened = opened) => {
      if (!isOpened) {
        root.classList.remove("es-opened");
        return;
      }

      document.body.classList.remove("es-lock-scroll");
      document.body.style.position = "";
      document.body.style.height = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflowY = "";

      root.classList.add("es-opened");
      root.querySelectorAll(".elementor-invisible").forEach((node) => {
        node.classList.remove("elementor-invisible");
        node.style.visibility = "visible";
        node.style.opacity = "";
        node.style.transform = "";
      });

      root.querySelectorAll(".aw").forEach((node) => {
        node.style.setProperty("display", "block", "important");
      });

      if (coverContent) {
        coverContent.style.transform = "translateY(-100%)";
        coverContent.style.transition = `transform ${tokens.motion.gateDurationMs}ms ease-in-out`;
      }

      if (pageCover) {
        pageCover.style.opacity = "0";
        pageCover.style.visibility = "hidden";
        pageCover.style.pointerEvents = "none";
        pageCover.style.transition = `opacity ${tokens.motion.gateDurationMs}ms ease-in-out`;
      }

      if (awNode) awNode.style.setProperty("display", "block", "important");
    };

    applyOpenedState(opened);

    const song = root.querySelector("#song");
    const songSource = root.querySelector("#song source");
    if (songSource && mergedData?.media?.audio) {
      songSource.setAttribute("src", resolveAssetUrl(mergedData.media.audio));
      song?.load();
    }
    audioRef.current = song;

    const audioContainer = root.querySelector("#audio-container");
    const muteIcon = root.querySelector("#mute-sound");
    const unmuteIcon = root.querySelector("#unmute-sound");
    let audioActive = Boolean(mergedData?.features?.audioEnabled ?? true);

    if (audioContainer) {
      audioContainer.style.display = audioActive ? "flex" : "none";
    }

    if (muteIcon) muteIcon.style.display = audioActive ? "block" : "none";
    if (unmuteIcon) unmuteIcon.style.display = audioActive ? "none" : "block";

    const playAudio = () => {
      if (!audioActive || !audioRef.current) return;
      audioRef.current.play().catch(() => {
        // ignore autoplay block
      });
    };

    const pauseAudio = () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
    };

    if (audioContainer) {
      const onAudioToggle = (eventClick) => {
        eventClick.preventDefault();
        if (!audioRef.current) return;

        if (audioActive) {
          pauseAudio();
          audioActive = false;
          if (muteIcon) muteIcon.style.display = "none";
          if (unmuteIcon) unmuteIcon.style.display = "block";
        } else {
          audioActive = true;
          playAudio();
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
      const onOpen = (eventClick) => {
        eventClick.preventDefault();
        if (opened) return;

        setOpened(true);
        applyOpenedState(true);

        if (pageCover) {
          pageCover.style.opacity = "0";
          pageCover.style.transition = `opacity ${tokens.motion.gateDurationMs}ms ease-in-out`;
          pageCover.style.pointerEvents = "none";
          unlockTimerRef.current = window.setTimeout(() => {
            pageCover.style.visibility = "hidden";
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
      const onToggleEnvelope = (eventClick) => {
        eventClick.preventDefault();
        if (!(mergedData?.features?.digitalEnvelopeEnabled ?? true)) return;
        slideToggleElement(envelope, tokens.motion.giftToggleMs);
      };

      envelopeToggle.addEventListener("click", onToggleEnvelope);
      registerCleanup(() => envelopeToggle.removeEventListener("click", onToggleEnvelope));
    }

    root.querySelectorAll(".elementor-widget-weddingpress-copy-text .elementor-button").forEach((button) => {
      const onCopy = async (eventClick) => {
        eventClick.preventDefault();
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

    root.querySelectorAll(".elementor-element-1671b0ec .e-gallery-item").forEach((anchor) => {
      const onOpenLightbox = (eventClick) => {
        eventClick.preventDefault();
        if (!(mergedData?.features?.lightboxEnabled ?? true)) return;
        const href = resolveAssetUrl(anchor.getAttribute("href") || "");
        if (href) setLightboxImage(href);
      };

      anchor.addEventListener("click", onOpenLightbox);
      registerCleanup(() => anchor.removeEventListener("click", onOpenLightbox));
    });

    if (mergedData?.features?.lottieEnabled ?? true) {
      loadScriptOnce("es-lottie-script", LOTTIE_HREF)
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
            const jsonUrl = settings?.source_json?.url || mergedData?.media?.lottiePrimary || "assets/js/bird-hitam.json";

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
          // ignore lottie failures
        });
    }

    return () => {
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);

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
  }, [mergedData, wishes, fallbackWishes, liveOrderPayload, opened, isStaticDemoMode]);

  useEffect(() => {
    if (!lightboxImage) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setLightboxImage("");
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxImage]);

  return (
    <div className="es-template" ref={rootRef}>
      <div dangerouslySetInnerHTML={{ __html: markup }} />

      {lightboxImage ? (
        <div className="es-lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxImage("")}>
          <div className="es-lightbox__dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="es-lightbox__close" aria-label="Tutup" onClick={() => setLightboxImage("")}>
              ×
            </button>
            <img className="es-lightbox__image" src={lightboxImage} alt="Gallery" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
