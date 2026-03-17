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
  formatParentInfoHtml,
  formatWishTimestamp,
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
const STYLE_HREF = `${PUBLIC_TEMPLATE_PREFIX}style.css?v=20260311-1`;
const LOTTIE_HREF = `${PUBLIC_ASSET_PREFIX}js/lottie.min.js`;
const WISHES_STORAGE_KEY = "premium_02_ucapan_13735";
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

function toYouTubeEmbedUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();
  const match = raw.match(/^.*((youtu\.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
  const videoId = match?.[7] || "";
  if (!videoId || videoId.length !== 11) return "";
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&playsinline=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${videoId}`;
}

export default function PuspaAsmaraTemplate({ data: propData, invitationSlug = "puspa-asmara" }) {
  const { data: fetchedData } = useInvitationData(invitationSlug, {
    fallbackSlug: "puspa-asmara",
    skipFetch: Boolean(propData),
  });
  const mergedData = useMemo(() => mergeInvitationData(defaultSchema, propData ?? schemaJson, fetchedData), [propData, fetchedData]);
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
    document.body.classList.add("pa-lock-scroll");

    setDynamicVh();
    const onResize = () => setDynamicVh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      document.body.classList.remove("pa-lock-scroll");
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
    const seeded = Array.isArray(mergedData?.wishes) ? mergedData.wishes.map(normalizeWishItem).filter(Boolean) : [];
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

    const guestName = normalizeText(mergedData?.guest?.name || "Nama Tamu");

    const groom = {
      nickName: normalizeText(mergedData?.groom?.nickName || mergedData?.couple?.groom?.nickName || "Habib"),
      fullName: normalizeText(mergedData?.groom?.fullName || mergedData?.couple?.groom?.nameFull || "Habib Yulianto"),
      parentInfo: normalizeText(
        mergedData?.groom?.parentInfo || mergedData?.couple?.groom?.parentInfo || "Putra Ketiga dari Bapak Putra & Ibu Putri"
      ),
      instagram: normalizeText(mergedData?.groom?.instagram || mergedData?.couple?.groom?.instagram || "https://www.instagram.com/"),
      image: mergedData?.groom?.image || schemaJson.groom.image,
    };

    const bride = {
      nickName: normalizeText(mergedData?.bride?.nickName || mergedData?.couple?.bride?.nickName || "Adiba"),
      fullName: normalizeText(mergedData?.bride?.fullName || mergedData?.couple?.bride?.nameFull || "Adiba Putri Syakila"),
      parentInfo: normalizeText(
        mergedData?.bride?.parentInfo || mergedData?.couple?.bride?.parentInfo || "Putri Ketiga dari Bapak Putra & Ibu Putri"
      ),
      instagram: normalizeText(mergedData?.bride?.instagram || mergedData?.couple?.bride?.instagram || "https://www.instagram.com/"),
      image: mergedData?.bride?.image || schemaJson.bride.image,
    };

    const coupleDisplay = normalizeText(mergedData?.copy?.heroCouple || `${groom.nickName} & ${bride.nickName}`);
    const eventDateISO = mergedData?.event?.dateISO || "2025-12-28T10:00:00+07:00";
    const displayDate = normalizeText(mergedData?.event?.displayDate || mergedData?.copy?.heroDate || "28. 12. 2025");
    const akad = mergedData?.event?.akad || {};
    const resepsi = mergedData?.event?.resepsi || {};
    const streaming = mergedData?.streaming || {};

    const giftInfo = mergedData?.gifts || {};
    const bankList = Array.isArray(giftInfo.bankAccounts) ? giftInfo.bankAccounts : [];
    const bank1 = bankList[0] || {};
    const bank2 = bankList[1] || {};

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

    const copy = mergedData?.copy || {};

    setText(root, ".elementor-element-4aed6964 .elementor-heading-title", copy.coverTitle || "The Wedding of");
    setHtml(root, ".elementor-element-7fec0abf .elementor-widget-container", `<p>${escapeHtml(coupleDisplay)}</p>`);
    setText(root, ".elementor-element-623c7507 .elementor-heading-title", copy.coverDear || "Dear");
    setText(root, ".elementor-element-6731e16c .elementor-heading-title", guestName);
    setText(root, ".elementor-element-4bdce91 .elementor-button-text", copy.openButton || "BUKA UNDANGAN");

    setText(root, ".elementor-element-3680e999 .elementor-heading-title", "The Wedding Of");
    setText(root, ".elementor-element-606cba01 .elementor-heading-title", coupleDisplay);
    setText(root, ".elementor-element-63bc46cc .elementor-heading-title", displayDate);

    setText(root, ".elementor-element-535c83d9 .elementor-heading-title", copy.heroTitle || "The Wedding of");
    setText(root, ".elementor-element-78bd6e34 .elementor-heading-title", coupleDisplay);
    setText(root, ".elementor-element-69b16771 .elementor-heading-title", displayDate);
    setText(root, ".elementor-element-1f3c6efb .elementor-button-text", copy.saveTheDate || "Save The Date");

    setText(root, ".elementor-element-29fcde9 .elementor-heading-title", "Kedua Mempelai");
    setHtml(root, ".elementor-element-8dbd8be .elementor-widget-container", `<p>${escapeHtml(bride.nickName)}</p>`);
    setText(root, ".elementor-element-1b389f5a .elementor-heading-title", bride.fullName);
    setHtml(root, ".elementor-element-4dff81de .elementor-widget-container", formatParentInfoHtml(bride.parentInfo));

    setHtml(root, ".elementor-element-1c0c8223 .elementor-widget-container", `<p>${escapeHtml(groom.nickName)}</p>`);
    setText(root, ".elementor-element-63b29b3e .elementor-heading-title", groom.fullName);
    setHtml(root, ".elementor-element-36ad69f2 .elementor-widget-container", formatParentInfoHtml(groom.parentInfo));

    setLink(root, ".elementor-element-112b21bd a.elementor-social-icon-instagram", toInstagramUrl(bride.instagram));
    setLink(root, ".elementor-element-56372222 a.elementor-social-icon-instagram", toInstagramUrl(groom.instagram));

    const brideImage = resolveAssetUrl(bride.image);
    const groomImage = resolveAssetUrl(groom.image);
    const brideImageNode = root.querySelector(".elementor-element-1fdc8774 img");
    const groomImageNode = root.querySelector(".elementor-element-1c40500 img");
    if (brideImageNode && brideImage) brideImageNode.setAttribute("src", brideImage);
    if (groomImageNode && groomImage) groomImageNode.setAttribute("src", groomImage);

    setText(root, ".elementor-element-2cbc0e63 .elementor-heading-title", copy.countdownTitle || "MENUJU HARI BAHAGIA");

    setText(root, ".elementor-element-421de45b .elementor-heading-title", normalizeText(akad.title || "Akad Nikah"));
    setText(root, ".elementor-element-3075ddd1 .elementor-heading-title", normalizeText(akad.date || "Minggu, 28 Desember 2025"));
    setText(root, ".elementor-element-747dcb9 .elementor-heading-title", normalizeText(akad.time || "Pukul : 09.00 WIB"));
    setHtml(root, ".elementor-element-6583b60f .elementor-widget-container", formatAddressHtml(akad.addressName || "Kediaman Mempelai Wanita"));
    setLink(root, ".elementor-element-49e9eabe a.elementor-button", normalizeText(akad.mapsUrl || "https://maps.google.com/"));

    setText(root, ".elementor-element-5cc8d2a8 .elementor-heading-title", normalizeText(resepsi.title || "Resepsi"));
    setText(root, ".elementor-element-25b9dde4 .elementor-heading-title", normalizeText(resepsi.date || "Minggu, 28 Desember 2025"));
    setText(root, ".elementor-element-7ce43ba6 .elementor-heading-title", normalizeText(resepsi.time || "Pukul : 09.00 WIB"));
    setHtml(root, ".elementor-element-7a6eb763 .elementor-widget-container", formatAddressHtml(resepsi.addressName || "Kediaman Mempelai Wanita"));
    setLink(root, ".elementor-element-56cb6222 a.elementor-button", normalizeText(resepsi.mapsUrl || "https://maps.google.com/"));

    setHtml(root, ".elementor-element-26ee4767 .elementor-widget-container", `<p>${escapeHtml(copy.livestreamTitle || "Live Streaming")}</p>`);
    setText(
      root,
      ".elementor-element-53c44360 .elementor-heading-title",
      copy.livestreamIntro ||
        "Kami mengundang Bapak/Ibu/Saudara/i untuk menyaksikan pernikahan kami secara virtual yang disiarkan langsung melalui media sosial di bawah ini:"
    );
    setText(root, ".elementor-element-3f9bf4f9 .elementor-heading-title", normalizeText(streaming.date || "Minggu, 28 Desember 2025"));
    setText(root, ".elementor-element-386e8a79 .elementor-heading-title", normalizeText(streaming.time || "Pukul : 10.00 WIB"));
    setText(root, ".elementor-element-626a8ac3 .elementor-button-text", normalizeText(streaming.label || "@Instagram"));
    setLink(root, ".elementor-element-626a8ac3 a.elementor-button", normalizeText(streaming.url || "https://www.instagram.com/"));

    setHtml(root, ".elementor-element-6fb79463 .elementor-widget-container", `<p>${escapeHtml(copy.galleryTitle || "Our Gallery")}</p>`);

    const galleryItems = Array.isArray(mergedData?.gallery) ? mergedData.gallery.map(resolveAssetUrl).filter(Boolean) : [];
    const galleryNodes = Array.from(root.querySelectorAll(".elementor-element-663c198b .e-gallery-item"));
    const fallbackGallery = root.querySelector(".elementor-element-663c198b .elementor-gallery__container");
    if (fallbackGallery) fallbackGallery.classList.add("pa-gallery-fallback");

    galleryNodes.forEach((anchor, index) => {
      const nextImage = galleryItems[index] || resolveAssetUrl(anchor.getAttribute("href") || "");
      if (!nextImage) {
        anchor.style.display = "none";
        return;
      }
      anchor.style.display = "block";
      anchor.setAttribute("href", nextImage);
      const imageNode = anchor.querySelector(".e-gallery-image");
      if (imageNode) {
        imageNode.setAttribute("data-thumbnail", nextImage);
        imageNode.style.backgroundImage = `url("${nextImage}")`;
      }
    });

    setHtml(root, ".elementor-element-238d1126 .elementor-widget-container", `<p>${escapeHtml(copy.loveStoryTitle || "Love Story")}</p>`);
    const stories = Array.isArray(mergedData?.loveStory) ? mergedData.loveStory : [];
    setHtml(root, ".elementor-element-4d91d29d .elementor-widget-container", `<p>${escapeHtml(stories[0]?.title || "Awal Bertemu")}</p>`);
    setHtml(
      root,
      ".elementor-element-2226599f .elementor-widget-container",
      `<p style="text-align: justify;">${escapeHtml(stories[0]?.description || "")}</p>`
    );
    setHtml(root, ".elementor-element-4b922a7d .elementor-widget-container", `<p>${escapeHtml(stories[1]?.title || "Lamaran")}</p>`);
    setHtml(
      root,
      ".elementor-element-27a54e7 .elementor-widget-container",
      `<p style="text-align: justify;">${escapeHtml(stories[1]?.description || "")}</p>`
    );
    setHtml(root, ".elementor-element-696fc2cc .elementor-widget-container", `<p>${escapeHtml(stories[2]?.title || "Pernikahan")}</p>`);
    setHtml(
      root,
      ".elementor-element-7879f7e9 .elementor-widget-container",
      `<p style="text-align: justify;">${escapeHtml(stories[2]?.description || "")}</p>`
    );

    setText(root, ".elementor-element-15be07d9 .elementor-heading-title", copy.giftTitle || "Wedding Gift");
    setHtml(root, ".elementor-element-141b6a99 .elementor-widget-container", `<p>${escapeHtml(copy.giftIntro || "")}</p>`);
    setText(root, ".elementor-element-4c42a555 .elementor-button-text", copy.giftToggleLabel || "Klik di sini");

    const bank1LogoNode = root.querySelector(".elementor-element-4e6e1333 img");
    const bank1ChipNode = root.querySelector(".elementor-element-24f130ef img");
    const bank2LogoNode = root.querySelector(".elementor-element-1f4e8e34 img");
    if (bank1LogoNode && bank1.logo) bank1LogoNode.setAttribute("src", resolveAssetUrl(bank1.logo));
    if (bank1ChipNode && bank1.chip) bank1ChipNode.setAttribute("src", resolveAssetUrl(bank1.chip));
    if (bank2LogoNode && bank2.logo) bank2LogoNode.setAttribute("src", resolveAssetUrl(bank2.logo));

    setHtml(root, ".elementor-element-124e0fdb .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank1.accountNumber || "-")}</p>`);
    setHtml(root, ".elementor-element-15e9e282 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank1.accountHolder || "-")}</p>`);
    setHtml(root, ".elementor-element-71a8e014 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank2.accountNumber || "-")}</p>`);
    setHtml(root, ".elementor-element-16681b37 .elementor-widget-container", `<p class="elementor-heading-title elementor-size-default">${escapeHtml(bank2.accountHolder || "-")}</p>`);

    const copyBox1 = root.querySelector(".elementor-element-24d1d394 .copy-content");
    const copyBox2 = root.querySelector(".elementor-element-751d79fe .copy-content");
    if (copyBox1) copyBox1.textContent = normalizeText(bank1.accountNumber || "");
    if (copyBox2) copyBox2.textContent = normalizeText(bank2.accountNumber || "");

    setHtml(root, ".elementor-element-45da7c64 .elementor-widget-container", `<p>${escapeHtml(copy.shippingTitle || "Kirim Hadiah")}</p>`);
    setHtml(
      root,
      ".elementor-element-63cff63a .elementor-widget-container",
      `<p>Nama Penerima : ${escapeHtml(giftInfo.shipping?.recipient || "-")}</p><p>No. HP : ${escapeHtml(
        giftInfo.shipping?.phone || "-"
      )}</p><p>${escapeHtml(giftInfo.shipping?.address || "-")}</p>`
    );

    setText(root, ".elementor-element-3437d66e .elementor-heading-title", copy.wishesTitle || "Wishes");
    setHtml(root, ".elementor-element-59922aab .elementor-widget-container", `<p>${escapeHtml(copy.wishesIntro || "")}</p>`);

    const wishesWidget = root.querySelector(".elementor-element-44eea63b .cui-wrapper");
    if (wishesWidget) wishesWidget.classList.remove("cui-comments-closed");

    const wishesWrap = root.querySelector("#cui-wrap-commnent-13735");
    if (wishesWrap) wishesWrap.style.display = "block";

    const wishesFormContainer = root.querySelector("#cui-container-form-13735");
    if (wishesFormContainer && !wishesFormContainer.querySelector("#commentform-13735")) {
      wishesFormContainer.innerHTML = `
        <div class="respond">
          <form action="#" method="post" id="commentform-13735" class="comment-form">
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
                <option value="Absen">Absen</option>
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
              formatWishTimestamp(entry.createdAt)
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
      if (!author || !comment || !attendance) return;
      if (!author.reportValidity() || !comment.reportValidity() || !attendance.reportValidity()) return;

      const nextEntry = normalizeWishItem({
        author: author.value,
        comment: comment.value,
        attendance: attendance.value,
        createdAt: new Date().toISOString(),
      });
      if (!nextEntry) return;

      try {
        await postInvitationWish("puspa-asmara", nextEntry);
      } catch {
        // Keep optimistic local render even if API is unavailable.
      }

      setWishes((prev) => {
        const next = [nextEntry, ...prev];
        writeStoredWishes(next);
        return next;
      });
      wishForm.reset();

      if (commentStatus) {
        commentStatus.textContent = "Ucapan berhasil disimpan di browser ini.";
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

    setHtml(root, ".elementor-element-40dd7e2e .elementor-widget-container", `<p>${escapeHtml(copy.creditText || "")}</p>`);

    const closingImage = root.querySelector(".elementor-element-32cb9456 img");
    if (closingImage) {
      closingImage.setAttribute("src", resolveAssetUrl("assets/images/SUJA-24SK1173-PII-9-1-e1730097922583.jpg"));
    }

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
  }, [mergedData, wishes]);

  useEffect(() => {
    if (!lightboxImage) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setLightboxImage("");
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxImage]);

  return (
    <div className="pa-template" ref={rootRef}>
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
