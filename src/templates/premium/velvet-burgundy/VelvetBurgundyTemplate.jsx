import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { postInvitationWish } from "../../../services/wishesApi";
import schemaJson from "./schema/schema.json";
import defaultSchema from "./schema/invitationSchema";
import tokens from "./tokens";
import {
  copyToClipboard,
  normalizeText,
  resolveAssetUrl,
  rewriteSrcset,
  runReveal,
  setDynamicVh,
  slideToggleElement,
  toInstagramUrl,
  updateCountdownNode,
} from "./helper";

const BODY_CLASSES = [
  "wp-singular",
  "page-template-default",
  "page",
  "page-id-5856",
  "wp-embed-responsive",
  "wp-theme-hello-elementor",
  "hello-elementor-default",
  "elementor-default",
  "elementor-template-canvas",
  "elementor-kit-5",
  "elementor-page",
  "elementor-page-5856",
];
const BASE_URL = import.meta.env.BASE_URL || "/";
const NORMALIZED_BASE_URL = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
const VELVET_STYLE_LINK_ID = "velvet-burgundy-style";
const VELVET_STYLE_HREF = `${NORMALIZED_BASE_URL}templates/premium/velvet-burgundy/style.css?v=20260306-2`;

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
        const baseObj = output[key] && typeof output[key] === "object" && !Array.isArray(output[key]) ? output[key] : {};
        output[key] = { ...baseObj, ...value };
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

  return output;
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

function formatShipping(shipping) {
  if (!shipping) return "";
  const recipient = normalizeText(shipping.recipient || "-");
  const phone = normalizeText(shipping.phone || "-");
  const address = normalizeText(shipping.address || "-");
  return `<p>Nama Penerima : ${recipient}</p><p>No. HP : ${phone}</p><p>${address}</p>`;
}

function normalizeWishItem(item) {
  const author = normalizeText(item?.author || item?.name || item?.guest || "");
  const comment = normalizeText(item?.comment || item?.message || item?.wish || "");
  if (!author || !comment) return null;
  const attendance = normalizeText(item?.attendance || item?.status || item?.konfirmasi || "Hadir") || "Hadir";
  const createdAt = normalizeText(item?.createdAt || item?.date || "Baru saja") || "Baru saja";
  return { author, comment, attendance, createdAt };
}

function formatWishTimestamp(date) {
  const parts = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const read = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${read("day")} ${read("month")} ${read("year")}, ${read("hour")}:${read("minute")}`;
}

export default function VelvetBurgundyTemplate({ data: propData = schemaJson }) {
  const { data: fetchedData } = useInvitationData("velvet-burgundy");
  const mergedData = useMemo(() => mergeInvitationData(defaultSchema, propData, fetchedData), [propData, fetchedData]);
  const fallbackWishes = useMemo(
    () => (defaultSchema.wishes || []).map(normalizeWishItem).filter(Boolean),
    []
  );

  const rootRef = useRef(null);
  const openButtonRef = useRef(null);
  const audioRef = useRef(null);
  const wasPlayingOnHideRef = useRef(false);
  const unlockTimerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const [opened, setOpened] = useState(false);
  const [scrollUnlocked, setScrollUnlocked] = useState(false);
  const [wishes, setWishes] = useState(() => fallbackWishes);
  const commentAvatarSrc = resolveAssetUrl("assets/images/local/wp-content__uploads__2023__05__cropped-LOGO-32x32.jpg");
  const hadirCount = useMemo(
    () => wishes.filter((item) => /hadir|datang/i.test(item.attendance)).length,
    [wishes]
  );
  const absenCount = useMemo(
    () => wishes.filter((item) => /tidak|absen/i.test(item.attendance)).length,
    [wishes]
  );
  const wishesListClassName = useMemo(() => {
    const classes = ["cui-container-comments", "cui-order-DESC"];
    if (wishes.length > 0) classes.push(`cui-has-${wishes.length}-comments`);
    if (wishes.length > 1) classes.push("cui-multiple-comments");
    return classes.join(" ");
  }, [wishes]);

  useEffect(() => {
    let styleNode = document.getElementById(VELVET_STYLE_LINK_ID);
    let createdByTemplate = false;

    if (!styleNode) {
      const link = document.createElement("link");
      link.id = VELVET_STYLE_LINK_ID;
      link.rel = "stylesheet";
      link.href = VELVET_STYLE_HREF;
      link.setAttribute("data-template-style", "velvet-burgundy");
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
    const next = Array.isArray(mergedData?.wishes) ? mergedData.wishes : [];
    const normalized = next.map(normalizeWishItem).filter(Boolean);
    setWishes(normalized.length > 0 ? normalized : fallbackWishes);
  }, [mergedData, fallbackWishes]);

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
    const previousBodyClasses = BODY_CLASSES.filter((name) => document.body.classList.contains(name));
    BODY_CLASSES.forEach((name) => document.body.classList.add(name));

    setDynamicVh();
    const onResize = () => setDynamicVh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      BODY_CLASSES.forEach((name) => document.body.classList.remove(name));
      previousBodyClasses.forEach((name) => document.body.classList.add(name));
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    if (!scrollUnlocked) {
      document.body.classList.add("vb-lock-scroll");
    } else {
      document.body.classList.remove("vb-lock-scroll");
    }

    const guestName = normalizeText(mergedData?.guest?.name || "Nama Tamu");

    const groom = {
      nickName: normalizeText(mergedData?.groom?.nickName || mergedData?.couple?.groom?.nickName || "Habib"),
      fullName: normalizeText(mergedData?.groom?.fullName || mergedData?.couple?.groom?.nameFull || "Habib Yulianto"),
      parentInfo:
        normalizeText(mergedData?.groom?.parentInfo || mergedData?.couple?.groom?.parentInfo || "Putra Kedua Dari : Bapak Putra dan Ibu Putri"),
      instagram: normalizeText(mergedData?.groom?.instagram || mergedData?.couple?.groom?.instagram || "wekita.id"),
    };

    const bride = {
      nickName: normalizeText(mergedData?.bride?.nickName || mergedData?.couple?.bride?.nickName || "Adiba"),
      fullName: normalizeText(mergedData?.bride?.fullName || mergedData?.couple?.bride?.nameFull || "Adiba Putri Syakila"),
      parentInfo:
        normalizeText(mergedData?.bride?.parentInfo || mergedData?.couple?.bride?.parentInfo || "Putri Pertama Dari : Bapak Putra dan Ibu Putri"),
      instagram: normalizeText(mergedData?.bride?.instagram || mergedData?.couple?.bride?.instagram || "wekita.id"),
    };

    const eventDateISO = mergedData?.event?.dateISO || "2027-03-30T09:00:00+07:00";
    const akad = mergedData?.event?.akad || {};
    const resepsi = mergedData?.event?.resepsi || {};
    const streaming = mergedData?.streaming || mergedData?.event?.livestream || {};

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
    });

    root.querySelectorAll("a[href]").forEach((node) => {
      const value = node.getAttribute("href") || "";
      const next = resolveAssetUrl(value);
      if (next && next !== value) node.setAttribute("href", next);
    });

    const gallery = Array.isArray(mergedData?.gallery) && mergedData.gallery.length > 0 ? mergedData.gallery : defaultSchema.gallery || [];
    if (gallery.length > 0) {
      const galleryContainer = root.querySelector(".elementor-element-2d7b3f8d .elementor-gallery__container");
      const galleryItems = Array.from(root.querySelectorAll(".elementor-element-2d7b3f8d .e-gallery-item"));
      if (galleryContainer) {
        // Elementor justified gallery requires frontend runtime to compute inline geometry.
        // In React route we force a deterministic fallback layout so images stay visible.
        galleryContainer.classList.add("vb-gallery-fallback");
      }
      galleryItems.forEach((item, idx) => {
        const image = resolveAssetUrl(gallery[idx % gallery.length]);
        if (!image) return;
        const imageNumber = idx + 1;
        item.setAttribute("href", image);
        item.setAttribute("aria-label", `Buka foto galeri ${imageNumber}`);
        item.setAttribute("title", `Buka foto galeri ${imageNumber}`);
        const imageNode = item.querySelector(".e-gallery-image");
        if (imageNode) {
          imageNode.setAttribute("data-thumbnail", image);
          imageNode.setAttribute("aria-label", `Foto galeri ${imageNumber}`);
          imageNode.style.backgroundImage = `url("${image}")`;
          imageNode.style.backgroundSize = "cover";
          imageNode.style.backgroundPosition = "center center";
        }
      });
    }

    setText(root, ".elementor-element-17d8c3af .elementor-widget-container", guestName);
    setText(root, ".elementor-element-60f56f12 .elementor-heading-title", groom.nickName);
    setText(root, ".elementor-element-5963fd5d .elementor-heading-title", bride.nickName);
    setText(root, ".elementor-element-37936085 .elementor-heading-title", groom.nickName);
    setText(root, ".elementor-element-25fb2110 .elementor-heading-title", bride.nickName);
    setText(root, ".elementor-element-3932eb27 p", groom.nickName);
    setText(root, ".elementor-element-7e40feef p", groom.fullName);
    setText(root, ".elementor-element-2033f181 p", bride.nickName);
    setText(root, ".elementor-element-406a9d62 p", bride.fullName);
    setHtml(root, ".elementor-element-8c853a8 .elementor-widget-container", `<p><strong>Putra Kedua Dari :</strong></p><p>${groom.parentInfo.replace(/^.*?:\s*/, "") || "Bapak Putra dan Ibu Putri"}</p>`);
    setHtml(root, ".elementor-element-2bdae3fe .elementor-widget-container", `<p><strong>Putri Pertama Dari :</strong><br />${bride.parentInfo.replace(/^.*?:\s*/, "") || "Bapak Putra dan Ibu Putri"}</p>`);

    setText(root, ".elementor-element-b4085f2 p", akad.date || resepsi.date || "Minggu, 30 Maret 2027");
    setText(root, ".elementor-element-1854bc7a p", akad.date || "Minggu, 30 Maret 2027");
    setText(root, ".elementor-element-2bca4ecc p", `Pukul : ${akad.time || "09:00 WIB"}`);
    setText(root, ".elementor-element-6225ab71 p", `Alamat : ${akad.address || "Ds Pagu Kec. Wates Kab. Kediri"}`);

    setText(root, ".elementor-element-1de9950f p", resepsi.date || "Minggu, 30 Maret 2027");
    setText(root, ".elementor-element-7288414 p", `Pukul : ${resepsi.time || "09:00 WIB"}`);
    setText(root, ".elementor-element-2b4fb691 p", `Alamat : ${resepsi.address || "Ds Pagu Kec. Wates Kab. Kediri"}`);

    setLink(root, ".elementor-element-46140128 a", akad.mapsUrl || resepsi.mapsUrl || "https://maps.app.goo.gl/D914WhqsNx1qxTRm6");
    setLink(root, ".elementor-element-5deddaeb a", resepsi.mapsUrl || akad.mapsUrl || "https://maps.app.goo.gl/D914WhqsNx1qxTRm6");

    setText(root, ".elementor-element-29e3c153 p", streaming.date || resepsi.date || "Minggu, 30 Maret 2027");
    setText(root, ".elementor-element-54cfaa68 p", `Pukul : ${streaming.time || resepsi.time || "09:00 WIB"}`);
    setLink(root, ".elementor-element-25605cc7 a", streaming.url || "https://instagram.com");
    setText(root, ".elementor-element-25605cc7 .elementor-button-text", streaming.label || "Join Streaming");

    setLink(root, ".elementor-element-7b8e92f5 a", toInstagramUrl(groom.instagram));
    setLink(root, ".elementor-element-6d3c705d a", toInstagramUrl(bride.instagram));

    setText(root, ".elementor-element-6e0c2eb1 p", bank1.accountNumber || "1234 5678 90");
    setText(root, ".elementor-element-27297eef p", bank1.accountHolder || groom.nickName || "Habib");
    setText(root, ".elementor-element-66771dda p", bank2.accountNumber || bank1.accountNumber || "1234 5678 90");
    setText(root, ".elementor-element-4c9c9600 p", bank2.accountHolder || bank1.accountHolder || groom.nickName || "Habib");

    const logo1 = root.querySelector(".elementor-element-3deecddf img");
    if (logo1 && bank1.logo) logo1.setAttribute("src", resolveAssetUrl(bank1.logo));
    const chip = root.querySelector(".elementor-element-6c76d365 img");
    if (chip && bank1.chip) chip.setAttribute("src", resolveAssetUrl(bank1.chip));
    const logo2 = root.querySelector(".elementor-element-378cbbc0 img");
    if (logo2 && bank2.logo) logo2.setAttribute("src", resolveAssetUrl(bank2.logo));

    const copyContents = Array.from(root.querySelectorAll(".elementor-widget-weddingpress-copy-text .copy-content"));
    if (copyContents[0]) copyContents[0].innerHTML = bank1.accountNumber || "1234 5678 90";
    if (copyContents[1]) copyContents[1].innerHTML = bank2.accountNumber || bank1.accountNumber || "1234 5678 90";

    setHtml(root, ".elementor-element-1863debf .elementor-widget-container", formatShipping(giftInfo.shipping));
    setText(root, ".elementor-element-57e5bff0 p", `${groom.nickName} & ${bride.nickName}`);

    const countdownNode = root.querySelector("#wpkoi-elements-countdown-5720b7ed");
    if (countdownNode) countdownNode.setAttribute("data-date", eventDateISO);
    updateCountdownNode(countdownNode, eventDateISO);
    const countdownInterval = window.setInterval(() => updateCountdownNode(countdownNode, eventDateISO), 1000);

    const openWrap = root.querySelector("#open");
    const sec = root.querySelector("#sec");
    const kolom = root.querySelector("#kolom");
    const page = root.querySelector("[data-elementor-type='wp-page']");
    const contentSiblings = page ? Array.from(page.children).filter((node) => node.id !== "sec") : [];

    contentSiblings.forEach((node) => {
      if (!opened) {
        node.setAttribute("inert", "");
        node.setAttribute("aria-hidden", "true");
        return;
      }

      node.removeAttribute("inert");
      node.removeAttribute("aria-hidden");
    });

    if (!opened) {
      window.requestAnimationFrame(() => {
        openButtonRef.current?.focus({ preventScroll: true });
      });
    }

    const setAudioIconState = () => {
      const audio = audioRef.current;
      const mute = root.querySelector("#mute-sound");
      const unmute = root.querySelector("#unmute-sound");
      if (!mute || !unmute || !audio) return;

      if (audio.paused) {
        mute.style.display = "none";
        unmute.style.display = "block";
      } else {
        mute.style.display = "block";
        unmute.style.display = "none";
      }
    };

    const openInvitation = async (event) => {
      event.preventDefault();
      if (opened) return;

      // Elementor runtime is not present in React route, so reveal hidden animated nodes manually.
      root.querySelectorAll(".elementor-invisible").forEach((node) => {
        node.classList.remove("elementor-invisible");
      });

      if (kolom) {
        kolom.style.transform = "translateY(-100%)";
        kolom.style.transition = "transform 1.5s ease-in-out";
      }
      if (sec) {
        sec.style.opacity = "0";
        sec.style.transition = "opacity 1.5s ease-in-out";
        window.setTimeout(() => {
          sec.style.visibility = "hidden";
        }, tokens.motion.gateDurationMs);
      }

      setOpened(true);
      if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = window.setTimeout(() => {
        setScrollUnlocked(true);
      }, tokens.motion.gateDurationMs);
      window.setTimeout(() => {
        root.querySelector("#home")?.focus({ preventScroll: true });
      }, tokens.motion.gateDurationMs);

      const audio = audioRef.current;
      if (audio) {
        try {
          await audio.play();
        } catch {
          // browser may block autoplay until user gesture; click already counts as gesture.
        }
        setAudioIconState();
      }

      root.querySelectorAll(".motion-text").forEach((node, idx) => {
        window.setTimeout(() => node.classList.add("active"), idx * 300);
      });

      window.setTimeout(() => {
        runReveal(root);
        AOS.refreshHard();
      }, 200);
    };

    if (openWrap) {
      openWrap.addEventListener("click", openInvitation);
    }

    const giftButton = root.querySelector("#klik");
    const giftContainer = root.querySelector("#amplop");
    const onGiftClick = (event) => {
      event.preventDefault();
      slideToggleElement(giftContainer, tokens.motion.giftToggleMs);
    };
    if (giftButton && giftContainer) {
      giftButton.addEventListener("click", onGiftClick);
    }

    const audioElement = root.querySelector("#song");
    const audioSource = audioElement?.querySelector("source");
    if (audioSource) {
      audioSource.setAttribute(
        "src",
        resolveAssetUrl(
          "assets/misc/local/wp-content__uploads__2024__09__y2mate.com-PREP-As-It-Was-Harry-Styles-Cover-Official-Visualizer-1-1.mp3"
        )
      );
    }
    if (audioElement) {
      audioElement.load();
      audioRef.current = audioElement;
      if (opened) {
        audioElement.play().catch(() => undefined);
      }
      setAudioIconState();
    }

    const audioContainer = root.querySelector("#audio-container");
    const onAudioToggle = async (event) => {
      event.preventDefault();
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          // ignored
        }
      } else {
        audio.pause();
      }
      setAudioIconState();
    };

    if (audioContainer) {
      audioContainer.addEventListener("click", onAudioToggle);
    }

    const onCopyClick = async (event) => {
      const trigger = event.target.closest(".vb-copy-trigger");
      if (!trigger) return;
      event.preventDefault();
      const wrapper = trigger.closest(".elementor-button-wrapper");
      const source = wrapper?.querySelector(".copy-content");
      const text = source?.textContent || "";
      const copied = await copyToClipboard(text);
      if (!copied) return;

      const original = trigger.innerHTML;
      trigger.textContent = trigger.getAttribute("data-message") || "berhasil disalin";
      window.setTimeout(() => {
        trigger.innerHTML = original;
      }, 500);
    };
    root.addEventListener("click", onCopyClick);

    const onBottomNavClick = (event) => {
      const anchor = event.target.closest(".elementor-element-46795b49 a[href^='#']");
      if (!anchor) return;

      const targetSelector = anchor.getAttribute("href");
      if (!targetSelector || targetSelector === "#") return;

      const target = root.querySelector(targetSelector);
      if (!target) return;

      event.preventDefault();

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const startTop = window.scrollY;
      const endTop = Math.max(0, target.getBoundingClientRect().top + startTop - 8);

      if (prefersReducedMotion || Math.abs(endTop - startTop) < 4) {
        window.scrollTo({ top: endTop, behavior: "auto" });
        return;
      }

      if (scrollAnimationRef.current) {
        window.cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }

      const duration = 900;
      const startTime = performance.now();
      const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeInOutCubic(progress);
        const next = startTop + (endTop - startTop) * eased;
        window.scrollTo(0, next);

        if (progress < 1) {
          scrollAnimationRef.current = window.requestAnimationFrame(animate);
          return;
        }
        scrollAnimationRef.current = null;
      };

      scrollAnimationRef.current = window.requestAnimationFrame(animate);
    };
    root.addEventListener("click", onBottomNavClick);

    const form = root.querySelector("[data-wishes-form]");
    const onWishSubmit = async (event) => {
      event.preventDefault();
      const target = event.currentTarget;
      const fd = new FormData(target);
      const author = normalizeText(fd.get("author"));
      const comment = normalizeText(fd.get("comment"));
      const attendance = normalizeText(fd.get("konfirmasi")) || "Hadir";
      if (!author || !comment) return;

      try {
        await postInvitationWish("velvet-burgundy", {
          author,
          comment,
          attendance,
        });
      } catch {
        // Keep optimistic local render even if API is unavailable.
      }

      setWishes((prev) => [
        {
          author,
          comment,
          attendance,
          createdAt: formatWishTimestamp(new Date()),
        },
        ...prev,
      ]);

      target.reset();
    };

    if (form) {
      form.addEventListener("submit", onWishSubmit);
    }

    const onScroll = () => runReveal(root);
    window.addEventListener("scroll", onScroll, { passive: true });
    runReveal(root);

    const onVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.visibilityState === "hidden") {
        wasPlayingOnHideRef.current = !audio.paused;
        audio.pause();
        setAudioIconState();
        return;
      }

      if (document.visibilityState === "visible" && wasPlayingOnHideRef.current) {
        audio.play().catch(() => undefined);
        setAudioIconState();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(countdownInterval);
      if (openWrap) openWrap.removeEventListener("click", openInvitation);
      if (giftButton && giftContainer) giftButton.removeEventListener("click", onGiftClick);
      if (audioContainer) audioContainer.removeEventListener("click", onAudioToggle);
      if (form) form.removeEventListener("submit", onWishSubmit);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root.removeEventListener("click", onCopyClick);
      root.removeEventListener("click", onBottomNavClick);
      if (scrollAnimationRef.current) {
        window.cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      document.body.classList.remove("vb-lock-scroll");
    };
  }, [mergedData, opened, scrollUnlocked]);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`vb-template${opened ? " vb-opened" : ""}`} ref={rootRef}>
      <div data-elementor-type="wp-page" data-elementor-id="5856" className="elementor elementor-5856" data-elementor-post-type="page">
        <div className="elementor-element elementor-element-1ef19b6d e-flex e-con-boxed e-con e-parent" data-id="1ef19b6d" data-element_type="container" id="sec">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-9597f7 e-con-full tinggi e-flex e-con e-child" data-id="9597f7" data-element_type="container" id="kolom" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-18ecfc31 e-con-full e-flex e-con e-child" data-id="18ecfc31" data-element_type="container" data-settings='{"background_background":"classic"}' data-aos="zoom-out-down" data-aos-delay="5" data-aos-duration="2500" data-aos-easing="lease-in-cube" data-aos-offset="10">
                <div className="elementor-element elementor-element-5894956f elementor-widget elementor-widget-spacer" data-id="5894956f" data-element_type="widget" data-widget_type="spacer.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-spacer">
                      <div className="elementor-spacer-inner"></div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-426821d7 e-con-full e-flex e-con e-child" data-id="426821d7" data-element_type="container">
                  <div className="elementor-element elementor-element-2e16c07b e-con-full e-flex e-con e-child" data-id="2e16c07b" data-element_type="container">
                    <div className="elementor-element elementor-element-48e6a0b3 elementor-widget elementor-widget-heading" data-id="48e6a0b3" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <h2 className="elementor-heading-title elementor-size-default">
                          H
                        </h2>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-60f56f12 elementor-widget elementor-widget-heading" data-id="60f56f12" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <h2 className="elementor-heading-title elementor-size-default">
                          Habib
                        </h2>
                      </div>
                    </div>
                  </div>
                  <div className="elementor-element elementor-element-3e972f1b e-con-full e-flex e-con e-child" data-id="3e972f1b" data-element_type="container">
                    <div className="elementor-element elementor-element-156923bd elementor-widget elementor-widget-heading" data-id="156923bd" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <h2 className="elementor-heading-title elementor-size-default">
                          A
                        </h2>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-5963fd5d elementor-widget elementor-widget-heading" data-id="5963fd5d" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <h2 className="elementor-heading-title elementor-size-default">
                          Adiba
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-4a1c6e93 elementor-widget elementor-widget-text-editor" data-id="4a1c6e93" data-element_type="widget" data-aos="fade-up" data-aos-delay="5" data-aos-duration="2500" data-aos-easing="lease-in-cube" data-aos-offset="10" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Dear,
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-17d8c3af elementor-widget elementor-widget-text-editor" data-id="17d8c3af" data-element_type="widget" data-aos="fade-up" data-aos-delay="5" data-aos-duration="2500" data-aos-easing="lease-in-cube" data-aos-offset="10" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">

                  Nama Tamu
                </div>
              </div>
              <div className="elementor-element elementor-element-4ba523aa elementor-align-center elementor-widget elementor-widget-button" data-id="4ba523aa" data-element_type="widget" id="open" data-aos="fade-up" data-aos-delay="15" data-aos-duration="2500" data-aos-easing="lease-in-cube" data-aos-offset="10" data-widget_type="button.default">
                <div className="elementor-widget-container">
                  <div className="elementor-button-wrapper">
                    <button
                      ref={openButtonRef}
                      className="elementor-button elementor-size-sm"
                      type="button"
                    >
                      <span className="elementor-button-content-wrapper">
                        <span className="elementor-button-icon">
                          <i aria-hidden="true" className="fas fa-book-open"></i>
                        </span>
                        <span className="elementor-button-text">
                          Buka Undangan
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="elementor-element elementor-element-5de82168 animated-slow e-flex e-con-boxed elementor-invisible e-con e-parent" data-id="5de82168" data-element_type="container" id="home" data-settings='{"animation":"fadeIn"}' tabIndex={-1}>
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-939be17 e-con-full b e-flex e-con e-child" data-id="939be17" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-68cd9073 animated-slow elementor-invisible elementor-widget elementor-widget-heading" data-id="68cd9073" data-element_type="widget" data-settings='{"_animation":"zoomIn"}' data-widget_type="heading.default">
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    The Wedding Of
                  </h2>
                </div>
              </div>
              <div className="elementor-element elementor-element-37936085 animated-slow elementor-invisible elementor-widget elementor-widget-heading" data-id="37936085" data-element_type="widget" data-settings='{"_animation":"fadeInUp"}' data-widget_type="heading.default">
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Habib
                  </h2>
                </div>
              </div>
              <div className="elementor-element elementor-element-25af31f8 animated-slow elementor-invisible elementor-widget elementor-widget-heading" data-id="25af31f8" data-element_type="widget" data-settings='{"_animation":"fadeInUp"}' data-widget_type="heading.default">
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    &
                  </h2>
                </div>
              </div>
              <div className="elementor-element elementor-element-25fb2110 animated-slow elementor-invisible elementor-widget elementor-widget-heading" data-id="25fb2110" data-element_type="widget" data-settings='{"_animation":"fadeInUp"}' data-widget_type="heading.default">
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Adiba
                  </h2>
                </div>
              </div>
              <div className="elementor-element elementor-element-70ef66a8 animated-slow elementor-invisible elementor-widget elementor-widget-text-editor" data-id="70ef66a8" data-element_type="widget" data-settings='{"_animation":"zoomIn"}' data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Kami berharap Anda
                  </p>
                  <p>
                    menjadi bagian dari hari istimewa kami.
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-5720b7ed animated-slow elementor-invisible elementor-widget elementor-widget-weddingpress-countdown" data-id="5720b7ed" data-element_type="widget" data-settings='{"_animation":"zoomIn"}' data-widget_type="weddingpress-countdown.default">
                <div className="elementor-widget-container">
                  <div className="wpkoi-elements-countdown-wrapper">
                    <div className="wpkoi-elements-countdown-container wpkoi-elements-countdown-label-block">
                      <ul id="wpkoi-elements-countdown-5720b7ed" className="wpkoi-elements-countdown-items" data-date="Mar 30 2025 10:00:00">
                        <li className="wpkoi-elements-countdown-item">
                          <div className="wpkoi-elements-countdown-days">
                            <span data-days="" className="wpkoi-elements-countdown-digits">
                              00
                            </span>
                            <span className="wpkoi-elements-countdown-label">
                              Hari
                            </span>
                          </div>
                        </li>
                        <li className="wpkoi-elements-countdown-item">
                          <div className="wpkoi-elements-countdown-hours">
                            <span data-hours="" className="wpkoi-elements-countdown-digits">
                              00
                            </span>
                            <span className="wpkoi-elements-countdown-label">
                              Jam
                            </span>
                          </div>
                        </li>
                        <li className="wpkoi-elements-countdown-item">
                          <div className="wpkoi-elements-countdown-minutes">
                            <span data-minutes="" className="wpkoi-elements-countdown-digits">
                              00
                            </span>
                            <span className="wpkoi-elements-countdown-label">
                              Menit
                            </span>
                          </div>
                        </li>
                        <li className="wpkoi-elements-countdown-item">
                          <div className="wpkoi-elements-countdown-seconds">
                            <span data-seconds="" className="wpkoi-elements-countdown-digits">
                              00
                            </span>
                            <span className="wpkoi-elements-countdown-label">
                              Detik
                            </span>
                          </div>
                        </li>
                      </ul>
                      <div className="clearfix"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-7b7152dd elementor-widget-divider--view-line elementor-widget elementor-widget-divider" data-id="7b7152dd" data-element_type="widget" data-widget_type="divider.default">
                <div className="elementor-widget-container">
                  <div className="elementor-divider">
                    <span className="elementor-divider-separator"></span>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-b4085f2 elementor-invisible elementor-widget elementor-widget-text-editor" data-id="b4085f2" data-element_type="widget" data-settings='{"_animation":"fadeInUp","_animation_delay":1000}' data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Minggu, 30 Maret 2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="elementor-element elementor-element-47c702cc e-flex e-con-boxed e-con e-parent" data-id="47c702cc" data-element_type="container">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-49235f22 e-con-full e-flex e-con e-child" data-id="49235f22" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-3aca2b1b reveal elementor-widget elementor-widget-image" data-id="3aca2b1b" data-element_type="widget" data-widget_type="image.default">
                <div className="elementor-widget-container">
                  <img fetchpriority="high" decoding="async" width="455" height="768" src={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__Picture5-1-1-178x300.webp")} className="attachment-full size-full wp-image-6989" alt="" srcSet={rewriteSrcset("assets/images/local/wp-content__uploads__2024__09__Picture5-1-1-178x300.webp 178w")} sizes="(max-width: 455px) 100vw, 455px" />
                </div>
              </div>
              <div className="elementor-element elementor-element-4b85a326 reveal elementor-widget elementor-widget-heading" data-id="4b85a326" data-element_type="widget" data-widget_type="heading.default">
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Our Special Day
                  </h2>
                </div>
              </div>
              <div className="elementor-element elementor-element-3774d091 reveal elementor-widget elementor-widget-text-editor" data-id="3774d091" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    “Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.”
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-7a04a9ca reveal elementor-widget elementor-widget-text-editor" data-id="7a04a9ca" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    ( QS. Ar-Rum 21 )
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-696110fc elementor-widget elementor-widget-spacer" data-id="696110fc" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="elementor-element elementor-element-401cdb47 e-flex e-con-boxed e-con e-parent" data-id="401cdb47" data-element_type="container" id="mempelai">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-6aa671c1 e-con-full e-flex e-con e-child" data-id="6aa671c1" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-7ddf41dd revealin elementor-widget-divider--view-line elementor-widget elementor-widget-divider" data-id="7ddf41dd" data-element_type="widget" data-widget_type="divider.default">
                <div className="elementor-widget-container">
                  <div className="elementor-divider">
                    <span className="elementor-divider-separator"></span>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-641157f6 e-con-full revealatas e-flex e-con e-child" data-id="641157f6" data-element_type="container" data-settings='{"background_background":"classic"}'>
                <div className="elementor-element elementor-element-5511eb0c revealin elementor-invisible elementor-widget elementor-widget-text-editor" data-id="5511eb0c" data-element_type="widget" data-settings='{"_animation_mobile":"fadeInUp","_animation":"fadeInUp"}' data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      The Groom
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-1646ddbf e-con-full e-flex e-con e-child" data-id="1646ddbf" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-3932eb27 revealin elementor-widget elementor-widget-text-editor" data-id="3932eb27" data-element_type="widget" data-widget_type="text-editor.default">
                    <div className="elementor-widget-container">
                      <p>
                        Habib
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-7e40feef reveal elementor-widget elementor-widget-text-editor" data-id="7e40feef" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Habib Yulianto
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-8c853a8 reveal elementor-widget elementor-widget-text-editor" data-id="8c853a8" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    <strong>
                      Putra Kedua Dari :
                    </strong>
                  </p>
                  <p>
                    Bapak Putra dan Ibu Putri
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-7b8e92f5 e-grid-align-tablet-center e-grid-align-mobile-center reveal elementor-shape-rounded elementor-grid-0 e-grid-align-center elementor-widget elementor-widget-social-icons" data-id="7b8e92f5" data-element_type="widget" data-settings='{"_animation_mobile":"none"}' data-widget_type="social-icons.default">
                <div className="elementor-widget-container">
                  <div className="elementor-social-icons-wrapper elementor-grid">
                    <span className="elementor-grid-item">
                      <a className="elementor-icon elementor-social-icon elementor-social-icon-instagram elementor-animation-grow elementor-repeater-item-6154405" href="https://instagram.com/wekita.id" target="_blank">
                        <span className="elementor-screen-only">
                          Instagram
                        </span>
                        <i aria-hidden="true" className="fab fa-instagram"></i>
                      </a>
                    </span>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-331939 reveal elementor-widget elementor-widget-text-editor" data-id="331939" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    &
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-1cf65b8a e-con-full revealatas e-flex e-con e-child" data-id="1cf65b8a" data-element_type="container" data-settings='{"background_background":"classic"}'>
                <div className="elementor-element elementor-element-44715d4d revealin elementor-invisible elementor-widget elementor-widget-text-editor" data-id="44715d4d" data-element_type="widget" data-settings='{"_animation_mobile":"fadeInUp","_animation":"fadeInUp"}' data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      The Bride
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-b1cd5cd e-con-full e-flex e-con e-child" data-id="b1cd5cd" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-2033f181 revealin elementor-widget elementor-widget-text-editor" data-id="2033f181" data-element_type="widget" data-widget_type="text-editor.default">
                    <div className="elementor-widget-container">
                      <p>
                        Adiba
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-406a9d62 reveal elementor-widget elementor-widget-text-editor" data-id="406a9d62" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Adiba Putri Syakila
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-2bdae3fe reveal elementor-widget elementor-widget-text-editor" data-id="2bdae3fe" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    <strong>
                      Putri Pertama Dari :
                    </strong>
                    <br />
                    Bapak Putra dan Ibu Putri
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-6d3c705d e-grid-align-tablet-center e-grid-align-mobile-center reveal elementor-shape-rounded elementor-grid-0 e-grid-align-center elementor-widget elementor-widget-social-icons" data-id="6d3c705d" data-element_type="widget" data-settings='{"_animation_mobile":"none"}' data-widget_type="social-icons.default">
                <div className="elementor-widget-container">
                  <div className="elementor-social-icons-wrapper elementor-grid">
                    <span className="elementor-grid-item">
                      <a className="elementor-icon elementor-social-icon elementor-social-icon-instagram elementor-animation-grow elementor-repeater-item-6154405" href="https://instagram.com/wekita.id" target="_blank">
                        <span className="elementor-screen-only">
                          Instagram
                        </span>
                        <i aria-hidden="true" className="fab fa-instagram"></i>
                      </a>
                    </span>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-20e4dc76 elementor-widget elementor-widget-spacer" data-id="20e4dc76" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="elementor-element elementor-element-5f53f861 e-flex e-con-boxed e-con e-parent" data-id="5f53f861" data-element_type="container" id="date">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-3e8625e3 e-con-full e-flex e-con e-child" data-id="3e8625e3" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-67a53440 elementor-widget elementor-widget-spacer" data-id="67a53440" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-10be07a5 reveal elementor-widget elementor-widget-text-editor" data-id="10be07a5" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    SAVE
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-54a5f6bd reveal elementor-widget elementor-widget-text-editor" data-id="54a5f6bd" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    The Date
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-42660150 elementor-widget-divider--view-line elementor-widget elementor-widget-divider" data-id="42660150" data-element_type="widget" data-widget_type="divider.default">
                <div className="elementor-widget-container">
                  <div className="elementor-divider">
                    <span className="elementor-divider-separator"></span>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-50fe3ef7 elementor-widget elementor-widget-spacer" data-id="50fe3ef7" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-6708a2a1 e-con-full reveal e-flex e-con e-child" data-id="6708a2a1" data-element_type="container" data-settings='{"background_background":"classic"}'>
                <div className="elementor-element elementor-element-5181f0f9 e-con-full e-flex e-con e-child" data-id="5181f0f9" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-3bb1e855 elementor-widget elementor-widget-spacer" data-id="3bb1e855" data-element_type="widget" data-widget_type="spacer.default">
                    <div className="elementor-widget-container">
                      <div className="elementor-spacer">
                        <div className="elementor-spacer-inner"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-3b0b446c revealin elementor-widget elementor-widget-heading" data-id="3b0b446c" data-element_type="widget" data-widget_type="heading.default">
                  <div className="elementor-widget-container">
                    <h2 className="elementor-heading-title elementor-size-default">
                      Akad Nikah
                    </h2>
                  </div>
                </div>
                <div className="elementor-element elementor-element-1854bc7a revealin elementor-widget elementor-widget-text-editor" data-id="1854bc7a" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Minggu, 30 Maret 2025
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-6a3863e2 revealin elementor-widget-divider--view-line elementor-widget elementor-widget-divider" data-id="6a3863e2" data-element_type="widget" data-widget_type="divider.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-divider">
                      <span className="elementor-divider-separator"></span>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-2bca4ecc revealin elementor-widget elementor-widget-text-editor" data-id="2bca4ecc" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Pukul : 09:00 WIB
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-6225ab71 revealin elementor-widget elementor-widget-text-editor" data-id="6225ab71" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Alamat : Ds Pagu Kec. Wates Kab. Kediri
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-46140128 elementor-align-center elementor-tablet-align-center elementor-mobile-align-center revealin elementor-widget elementor-widget-button" data-id="46140128" data-element_type="widget" data-widget_type="button.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-button-wrapper">
                      <a className="elementor-button elementor-button-link elementor-size-sm" href="https://maps.app.goo.gl/D914WhqsNx1qxTRm6" target="_blank">
                        <span className="elementor-button-content-wrapper">
                          <span className="elementor-button-icon">
                            <i aria-hidden="true" className="fas fa-map-marker-alt"></i>
                          </span>
                          <span className="elementor-button-text">
                            Lihat Lokasi
                          </span>
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-19f42085 elementor-widget elementor-widget-spacer" data-id="19f42085" data-element_type="widget" data-widget_type="spacer.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-spacer">
                      <div className="elementor-spacer-inner"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-130716fb elementor-widget elementor-widget-spacer" data-id="130716fb" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-92f7791 e-con-full reveal e-flex e-con e-child" data-id="92f7791" data-element_type="container" data-settings='{"background_background":"classic"}'>
                <div className="elementor-element elementor-element-39596315 e-con-full e-flex e-con e-child" data-id="39596315" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-3e61aa5a elementor-widget elementor-widget-spacer" data-id="3e61aa5a" data-element_type="widget" data-widget_type="spacer.default">
                    <div className="elementor-widget-container">
                      <div className="elementor-spacer">
                        <div className="elementor-spacer-inner"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-2e840c5b reveal elementor-widget elementor-widget-heading" data-id="2e840c5b" data-element_type="widget" data-widget_type="heading.default">
                  <div className="elementor-widget-container">
                    <h2 className="elementor-heading-title elementor-size-default">
                      Resepsi
                    </h2>
                  </div>
                </div>
                <div className="elementor-element elementor-element-1de9950f revealin elementor-widget elementor-widget-text-editor" data-id="1de9950f" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Minggu, 30 Maret 2025
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-5bd9ffe3 revealin elementor-widget-divider--view-line elementor-widget elementor-widget-divider" data-id="5bd9ffe3" data-element_type="widget" data-widget_type="divider.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-divider">
                      <span className="elementor-divider-separator"></span>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-7288414 revealin elementor-widget elementor-widget-text-editor" data-id="7288414" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Pukul : 09:00 WIB
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-2b4fb691 revealin elementor-widget elementor-widget-text-editor" data-id="2b4fb691" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Alamat : Ds Pagu Kec. Wates Kab. Kediri
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-5deddaeb elementor-align-center elementor-tablet-align-center elementor-mobile-align-center revealin elementor-widget elementor-widget-button" data-id="5deddaeb" data-element_type="widget" data-widget_type="button.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-button-wrapper">
                      <a className="elementor-button elementor-button-link elementor-size-sm" href="https://maps.app.goo.gl/D914WhqsNx1qxTRm6" target="_blank">
                        <span className="elementor-button-content-wrapper">
                          <span className="elementor-button-icon">
                            <i aria-hidden="true" className="fas fa-map-marker-alt"></i>
                          </span>
                          <span className="elementor-button-text">
                            Lihat Lokasi
                          </span>
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-237864b6 elementor-widget elementor-widget-spacer" data-id="237864b6" data-element_type="widget" data-widget_type="spacer.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-spacer">
                      <div className="elementor-spacer-inner"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-156751d1 elementor-widget elementor-widget-spacer" data-id="156751d1" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="elementor-element elementor-element-1bbaa257 e-flex e-con-boxed e-con e-parent" data-id="1bbaa257" data-element_type="container">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-5f314a0c e-con-full e-flex e-con e-child" data-id="5f314a0c" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-662e8646 elementor-widget elementor-widget-spacer" data-id="662e8646" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-706b558a reveal elementor-widget elementor-widget-text-editor" data-id="706b558a" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Live Streaming
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-4b5b73ea reveal elementor-widget elementor-widget-text-editor" data-id="4b5b73ea" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Kami juga berencana untuk mempublikasikan pernikahan kami secara virtual melalui live streaming instagram yang bisa anda ikuti melalui link berikut:
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-29e3c153 reveal elementor-widget elementor-widget-text-editor" data-id="29e3c153" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Minggu, 30 Maret 2025
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-54cfaa68 reveal elementor-widget elementor-widget-text-editor" data-id="54cfaa68" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Pukul : 09:00 WIB
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-25605cc7 elementor-align-center reveal elementor-widget elementor-widget-button" data-id="25605cc7" data-element_type="widget" data-widget_type="button.default">
                <div className="elementor-widget-container">
                  <div className="elementor-button-wrapper">
                    <a className="elementor-button elementor-button-link elementor-size-sm" href="https://instagram.com/wekita.id" target="_blank">
                      <span className="elementor-button-content-wrapper">
                        <span className="elementor-button-icon">
                          <i aria-hidden="true" className="fas fa-long-arrow-alt-right"></i>
                        </span>
                        <span className="elementor-button-text">
                          Klik Disini
                        </span>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-1eebb4d9 elementor-widget elementor-widget-spacer" data-id="1eebb4d9" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="elementor-element elementor-element-714a115e e-con-full e-flex e-con e-child" data-id="714a115e" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-6a7cba90 elementor-widget elementor-widget-spacer" data-id="6a7cba90" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-52ba1529 e-con-full revealatas e-flex e-con e-child" data-id="52ba1529" data-element_type="container" data-settings='{"background_background":"classic"}'>
                <div className="elementor-element elementor-element-116a5c83 elementor-widget elementor-widget-spacer" data-id="116a5c83" data-element_type="widget" data-widget_type="spacer.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-spacer">
                      <div className="elementor-spacer-inner"></div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-54e6fc39 revealin elementor-widget elementor-widget-text-editor" data-id="54e6fc39" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Love Story
                    </p>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-24b9bdb1 elementor-widget elementor-widget-spacer" data-id="24b9bdb1" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-2dd8f818 e-con-full e-flex e-con e-child" data-id="2dd8f818" data-element_type="container">
                <div className="elementor-element elementor-element-7754a066 revealin elementor-widget elementor-widget-text-editor" data-id="7754a066" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      6 DESEMBER 2022
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-7bfb3209 reveal elementor-widget elementor-widget-text-editor" data-id="7bfb3209" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-3a58553b e-con-full e-flex e-con e-child" data-id="3a58553b" data-element_type="container">
                <div className="elementor-element elementor-element-769e8559 revealin elementor-widget elementor-widget-text-editor" data-id="769e8559" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      16 DESEMBER 2022
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-29ed6468 reveal elementor-widget elementor-widget-text-editor" data-id="29ed6468" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-157e312e e-con-full e-flex e-con e-child" data-id="157e312e" data-element_type="container">
                <div className="elementor-element elementor-element-20686e1e revealin elementor-widget elementor-widget-text-editor" data-id="20686e1e" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      26 DESEMBER 2022
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-5b0dceb4 reveal elementor-widget elementor-widget-text-editor" data-id="5b0dceb4" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-580581af elementor-widget elementor-widget-spacer" data-id="580581af" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="elementor-element elementor-element-30d075e8 e-flex e-con-boxed e-con e-parent" data-id="30d075e8" data-element_type="container" id="galeri">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-10db3a46 e-con-full e-flex e-con e-child" data-id="10db3a46" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-1f4f182 elementor-widget elementor-widget-spacer" data-id="1f4f182" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-2410f99b revealatas elementor-widget elementor-widget-text-editor" data-id="2410f99b" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Our
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-52a3c53e reveal elementor-widget elementor-widget-text-editor" data-id="52a3c53e" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Gallery
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-30a75ff6 revealr elementor-widget-divider--view-line elementor-widget elementor-widget-divider" data-id="30a75ff6" data-element_type="widget" data-widget_type="divider.default">
                <div className="elementor-widget-container">
                  <div className="elementor-divider">
                    <span className="elementor-divider-separator"></span>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-2d7b3f8d reveal elementor-widget elementor-widget-gallery" data-id="2d7b3f8d" data-element_type="widget" data-settings='{"ideal_row_height_tablet":{"unit":"px","size":163,"sizes":[]},"ideal_row_height":{"unit":"px","size":250,"sizes":[]},"gallery_layout":"justified","ideal_row_height_mobile":{"unit":"px","size":250,"sizes":[]},"gap":{"unit":"px","size":10,"sizes":[]},"gap_tablet":{"unit":"px","size":10,"sizes":[]},"gap_mobile":{"unit":"px","size":10,"sizes":[]},"link_to":"file","overlay_background":"yes","content_hover_animation":"fade-in"}' data-widget_type="gallery.default">
                <div className="elementor-widget-container">
                  <div className="elementor-gallery__container">
                    <a className="e-gallery-item elementor-gallery-item elementor-animated-content" href={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__sm-sm-1-5.jpg")} data-elementor-open-lightbox="yes" data-elementor-lightbox-slideshow="2d7b3f8d" data-e-action-hash="#elementor-action%3Aaction%3Dlightbox%26settings%3DeyJpZCI6NzM3OSwidXJsIjoiaHR0cHM6XC9cL2ludi5ydW1haHVuZGFuZ2FuLmlkXC93cC1jb250ZW50XC91cGxvYWRzXC8yMDI0XC8wOVwvc20tc20tMS01LmpwZyIsInNsaWRlc2hvdyI6IjJkN2IzZjhkIn0%3D">
                      <div className="e-gallery-image elementor-gallery-item__image" data-thumbnail={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__sm-sm-1-5.jpg")} data-width="1152" data-height="768" aria-label="" role="img"></div>
                      <div className="elementor-gallery-item__overlay"></div>
                    </a>
                    <a className="e-gallery-item elementor-gallery-item elementor-animated-content" href={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__foto-1-1.jpg")} data-elementor-open-lightbox="yes" data-elementor-lightbox-slideshow="2d7b3f8d" data-e-action-hash="#elementor-action%3Aaction%3Dlightbox%26settings%3DeyJpZCI6NzM4MSwidXJsIjoiaHR0cHM6XC9cL2ludi5ydW1haHVuZGFuZ2FuLmlkXC93cC1jb250ZW50XC91cGxvYWRzXC8yMDI0XC8wOVwvZm90by0xLTEuanBnIiwic2xpZGVzaG93IjoiMmQ3YjNmOGQifQ%3D%3D">
                      <div className="e-gallery-image elementor-gallery-item__image" data-thumbnail={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__foto-1-1.jpg")} data-width="1024" data-height="1535" aria-label="" role="img"></div>
                      <div className="elementor-gallery-item__overlay"></div>
                    </a>
                    <a className="e-gallery-item elementor-gallery-item elementor-animated-content" href={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__foto-1-2.jpg")} data-elementor-open-lightbox="yes" data-elementor-lightbox-slideshow="2d7b3f8d" data-e-action-hash="#elementor-action%3Aaction%3Dlightbox%26settings%3DeyJpZCI6NzM4MiwidXJsIjoiaHR0cHM6XC9cL2ludi5ydW1haHVuZGFuZ2FuLmlkXC93cC1jb250ZW50XC91cGxvYWRzXC8yMDI0XC8wOVwvZm90by0xLTIuanBnIiwic2xpZGVzaG93IjoiMmQ3YjNmOGQifQ%3D%3D">
                      <div className="e-gallery-image elementor-gallery-item__image" data-thumbnail={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__foto-1-2.jpg")} data-width="1024" data-height="1535" aria-label="" role="img"></div>
                      <div className="elementor-gallery-item__overlay"></div>
                    </a>
                    <a className="e-gallery-item elementor-gallery-item elementor-animated-content" href={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__foto-1-6.jpg")} data-elementor-open-lightbox="yes" data-elementor-lightbox-slideshow="2d7b3f8d" data-e-action-hash="#elementor-action%3Aaction%3Dlightbox%26settings%3DeyJpZCI6NzM3OCwidXJsIjoiaHR0cHM6XC9cL2ludi5ydW1haHVuZGFuZ2FuLmlkXC93cC1jb250ZW50XC91cGxvYWRzXC8yMDI0XC8wOVwvZm90by0xLTYuanBnIiwic2xpZGVzaG93IjoiMmQ3YjNmOGQifQ%3D%3D">
                      <div className="e-gallery-image elementor-gallery-item__image" data-thumbnail={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__foto-1-6.jpg")} data-width="1151" data-height="768" aria-label="" role="img"></div>
                      <div className="elementor-gallery-item__overlay"></div>
                    </a>
                    <a className="e-gallery-item elementor-gallery-item elementor-animated-content" href={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__sm-1-5-1-e1725518237570.jpg")} data-elementor-open-lightbox="yes" data-elementor-lightbox-slideshow="2d7b3f8d" data-e-action-hash="#elementor-action%3Aaction%3Dlightbox%26settings%3DeyJpZCI6NzM3MiwidXJsIjoiaHR0cHM6XC9cL2ludi5ydW1haHVuZGFuZ2FuLmlkXC93cC1jb250ZW50XC91cGxvYWRzXC8yMDI0XC8wOVwvc20tMS01LTEtZTE3MjU1MTgyMzc1NzAuanBnIiwic2xpZGVzaG93IjoiMmQ3YjNmOGQifQ%3D%3D">
                      <div className="e-gallery-image elementor-gallery-item__image" data-thumbnail={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__sm-1-5-1-e1725518237570.jpg")} data-width="1100" data-height="768" aria-label="" role="img"></div>
                      <div className="elementor-gallery-item__overlay"></div>
                    </a>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-3071cd00 elementor-widget elementor-widget-spacer" data-id="3071cd00" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-1aff0c90 elementor-widget elementor-widget-spacer" data-id="1aff0c90" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="elementor-element elementor-element-5c19d9a1 e-flex e-con-boxed e-con e-parent" data-id="5c19d9a1" data-element_type="container">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-6bf7f25a e-con-full e-flex e-con e-child" data-id="6bf7f25a" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-4a27389b e-con-full reveal e-flex e-con e-child" data-id="4a27389b" data-element_type="container" data-settings='{"background_background":"classic"}'>
                <div className="elementor-element elementor-element-149eb079 wyKR elementor-widget elementor-widget-image" data-id="149eb079" data-element_type="widget" data-widget_type="image.default">
                  <div className="elementor-widget-container">
                    <img decoding="async" width="378" height="768" src={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__Asset-1@4x-8-1-1.webp")} className="attachment-large size-large wp-image-7383" alt="" srcSet={rewriteSrcset("assets/images/local/wp-content__uploads__2024__09__Asset-1@4x-8-1-1.webp 378w, assets/images/local/wp-content__uploads__2024__09__Asset-1@4x-8-1-1-148x300.webp 148w")} sizes="(max-width: 378px) 100vw, 378px" />
                  </div>
                </div>
                <div className="elementor-element elementor-element-56dac0be reveal elementor-widget elementor-widget-text-editor" data-id="56dac0be" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Wedding Gift
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-586e84e5 reveal elementor-widget elementor-widget-text-editor" data-id="586e84e5" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara cashless.
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-2abc256b elementor-align-center elementor-tablet-align-center elementor-mobile-align-center revealin elementor-widget elementor-widget-button" data-id="2abc256b" data-element_type="widget" id="klik" data-widget_type="button.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-button-wrapper">
                      <button className="elementor-button elementor-size-sm" type="button">
                        <span className="elementor-button-content-wrapper">
                          <span className="elementor-button-icon">
                            <i aria-hidden="true" className="fas fa-gift"></i>
                          </span>
                          <span className="elementor-button-text">
                            Klik Disini
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-7944a7db e-con-full e-flex e-con e-child" data-id="7944a7db" data-element_type="container" id="amplop">
                  <div className="elementor-element elementor-element-372a8dc8 e-con-full animated-slow e-flex elementor-invisible e-con e-child" data-id="372a8dc8" data-element_type="container" data-settings='{"background_background":"classic","animation":"zoomIn"}'>
                    <div className="elementor-element elementor-element-3deecddf elementor-widget elementor-widget-image" data-id="3deecddf" data-element_type="widget" data-widget_type="image.default">
                      <div className="elementor-widget-container">
                        <img decoding="async" width="2048" height="650" src={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__BCA_logo_Bank_Central_Asia-1-3-2048x650-1-1.png")} className="attachment-full size-full wp-image-6963" alt="" srcSet={rewriteSrcset("assets/images/local/wp-content__uploads__2024__09__BCA_logo_Bank_Central_Asia-1-3-2048x650-1-1.png 2048w, assets/images/local/wp-content__uploads__2024__09__BCA_logo_Bank_Central_Asia-1-3-2048x650-1-1-300x95.png 300w, assets/images/local/wp-content__uploads__2024__09__BCA_logo_Bank_Central_Asia-1-3-2048x650-1-1-1024x325.png 1024w, assets/images/local/wp-content__uploads__2024__09__BCA_logo_Bank_Central_Asia-1-3-2048x650-1-1-768x244.png 768w, assets/images/local/wp-content__uploads__2024__09__BCA_logo_Bank_Central_Asia-1-3-2048x650-1-1-1536x488.png 1536w")} sizes="(max-width: 2048px) 100vw, 2048px" />
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-6c76d365 elementor-widget elementor-widget-image" data-id="6c76d365" data-element_type="widget" data-widget_type="image.default">
                      <div className="elementor-widget-container">
                        <img loading="lazy" decoding="async" width="150" height="150" src={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__chip-atm-1-2-4.png")} className="attachment-full size-full wp-image-7384" alt="" />
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-6e0c2eb1 elementor-widget elementor-widget-heading" data-id="6e0c2eb1" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <p className="elementor-heading-title elementor-size-default">
                          1234 5678 90
                        </p>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-27297eef elementor-widget elementor-widget-heading" data-id="27297eef" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <p className="elementor-heading-title elementor-size-default">
                          Habib
                        </p>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-28a6b346 elementor-align-right elementor-tablet-align-right elementor-mobile-align-right elementor-widget elementor-widget-weddingpress-copy-text" data-id="28a6b346" data-element_type="widget" data-widget_type="weddingpress-copy-text.default">
                      <div className="elementor-widget-container">
                        <div className="elementor-image img"></div>
                        <div className="head-title"></div>
                        <div className="elementor-button-wrapper">
                          <div className="copy-content spancontent" style={{ display: "none" }}></div>
                          <button style={{ cursor: "pointer" }} data-message="berhasil disalin" className="elementor-button vb-copy-trigger" type="button">
                            <div className="elementor-button-content-wrapper">
                              <span>
                                <i aria-hidden="true" className="fas fa-copy"></i>
                              </span>
                              <span className="elementor-button-text">
                                Copy
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="elementor-element elementor-element-5c65d12a e-con-full animated-slow e-flex elementor-invisible e-con e-child" data-id="5c65d12a" data-element_type="container" data-settings='{"background_background":"classic","animation":"zoomIn"}'>
                    <div className="elementor-element elementor-element-378cbbc0 elementor-widget elementor-widget-image" data-id="378cbbc0" data-element_type="widget" data-widget_type="image.default">
                      <div className="elementor-widget-container">
                        <img loading="lazy" decoding="async" width="1200" height="342" src={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__1200px-Logo_dana_blue.svg-1-2-1.png")} className="attachment-full size-full wp-image-7385" alt="" srcSet={rewriteSrcset("assets/images/local/wp-content__uploads__2024__09__1200px-Logo_dana_blue.svg-1-2-1.png 1200w, assets/images/local/wp-content__uploads__2024__09__1200px-Logo_dana_blue.svg-1-2-1-300x86.png 300w, assets/images/local/wp-content__uploads__2024__09__1200px-Logo_dana_blue.svg-1-2-1-1024x292.png 1024w, assets/images/local/wp-content__uploads__2024__09__1200px-Logo_dana_blue.svg-1-2-1-768x219.png 768w")} sizes="(max-width: 1200px) 100vw, 1200px" />
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-65c833ad elementor-widget elementor-widget-spacer" data-id="65c833ad" data-element_type="widget" data-widget_type="spacer.default">
                      <div className="elementor-widget-container">
                        <div className="elementor-spacer">
                          <div className="elementor-spacer-inner"></div>
                        </div>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-66771dda elementor-widget elementor-widget-heading" data-id="66771dda" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <p className="elementor-heading-title elementor-size-default">
                          1234 5678 90
                        </p>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-4c9c9600 elementor-widget elementor-widget-heading" data-id="4c9c9600" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <p className="elementor-heading-title elementor-size-default">
                          Habib
                        </p>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-6e6da4ea elementor-align-right elementor-tablet-align-right elementor-mobile-align-right elementor-widget elementor-widget-weddingpress-copy-text" data-id="6e6da4ea" data-element_type="widget" data-widget_type="weddingpress-copy-text.default">
                      <div className="elementor-widget-container">
                        <div className="elementor-image img"></div>
                        <div className="head-title"></div>
                        <div className="elementor-button-wrapper">
                          <div className="copy-content spancontent" style={{ display: "none" }}></div>
                          <button style={{ cursor: "pointer" }} data-message="berhasil disalin" className="elementor-button vb-copy-trigger" type="button">
                            <div className="elementor-button-content-wrapper">
                              <span>
                                <i aria-hidden="true" className="far fa-copy"></i>
                              </span>
                              <span className="elementor-button-text">
                                Copy
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="elementor-element elementor-element-6feebbd9 e-con-full animated-slow e-flex elementor-invisible e-con e-child" data-id="6feebbd9" data-element_type="container" data-settings='{"background_background":"classic","animation":"zoomIn"}'>
                    <div className="elementor-element elementor-element-5560d9a2 elementor-view-default elementor-widget elementor-widget-icon" data-id="5560d9a2" data-element_type="widget" data-widget_type="icon.default">
                      <div className="elementor-widget-container">
                        <div className="elementor-icon-wrapper">
                          <div className="elementor-icon">
                            <i aria-hidden="true" className="fas fa-gift"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-6bdd75cb elementor-widget elementor-widget-heading" data-id="6bdd75cb" data-element_type="widget" data-widget_type="heading.default">
                      <div className="elementor-widget-container">
                        <p className="elementor-heading-title elementor-size-default">
                          Kirim Hadiah
                        </p>
                      </div>
                    </div>
                    <div className="elementor-element elementor-element-1863debf elementor-widget elementor-widget-text-editor" data-id="1863debf" data-element_type="widget" data-widget_type="text-editor.default">
                      <div className="elementor-widget-container">
                        <p>
                          Nama Penerima : Habib Yulianto
                        </p>
                        <p>
                          No. HP : 1234 5678 90
                        </p>
                        <p>
                          Ds Pagu Kec.Wates Kab. Kediri
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-4292e560 elementor-widget elementor-widget-spacer" data-id="4292e560" data-element_type="widget" data-widget_type="spacer.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-spacer">
                      <div className="elementor-spacer-inner"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-5f102532 e-con-full revealatas e-flex e-con e-child" data-id="5f102532" data-element_type="container" id="ucapan" data-settings='{"background_background":"classic"}'>
                <div className="elementor-element elementor-element-4ad0ff79 wyKR elementor-widget elementor-widget-image" data-id="4ad0ff79" data-element_type="widget" data-widget_type="image.default">
                  <div className="elementor-widget-container">
                    <img decoding="async" width="378" height="768" src={resolveAssetUrl("assets/images/local/wp-content__uploads__2024__09__Asset-1@4x-8-1-1.webp")} className="attachment-large size-large wp-image-7383" alt="" srcSet={rewriteSrcset("assets/images/local/wp-content__uploads__2024__09__Asset-1@4x-8-1-1.webp 378w, assets/images/local/wp-content__uploads__2024__09__Asset-1@4x-8-1-1-148x300.webp 148w")} sizes="(max-width: 378px) 100vw, 378px" />
                  </div>
                </div>
                <div className="elementor-element elementor-element-74c77e18 reveal elementor-widget elementor-widget-text-editor" data-id="74c77e18" data-element_type="widget" data-widget_type="text-editor.default">
                  <div className="elementor-widget-container">
                    <p>
                      Ucapan Sesuatu
                    </p>
                  </div>
                </div>
                <div className="elementor-element elementor-element-2c918f18 revealatas elementor-widget elementor-widget-weddingpress-kit2" data-id="2c918f18" data-element_type="widget" data-settings='{"attendence":"yes","show_date":"yes"}' data-widget_type="weddingpress-kit2.default">
                  <div className="elementor-widget-container">
                    <div className="cui-wrapper cui-facebook cui-border vb-wishes-shell" style={{ overflow: "hidden" }}>
                      <div className="cui-wrap-link">
                        <div className="header-cui">
                          <a id="cui-link-5856" className="cui-link cui-icon-link cui-icon-link-true auto-load-true" href="#ucapan" title="Comments">
                            <span data-wishes-count="">
                              {wishes.length}
                            </span>
                            Comments
                          </a>
                        </div>
                      </div>
                      <div id="cui-wrap-commnent-5856" className="cui-wrap-comments" style={{ display: "block" }}>
                        <div id="cui-wrap-form-5856" className="cui-clearfix">
                          <div className="cui-comment-attendence">
                            <div id="invitation-count-5856" className="cui_comment_count_card_wrap">
                              <div className="cui_comment_count_card_row_2">
                                <div className="cui_comment_count_card cui_card-hadir">
                                  <span data-attend-hadir="">
                                    {hadirCount}
                                  </span>
                                  <span>
                                    Hadir
                                  </span>
                                </div>
                                <div className="cui_comment_count_card cui_card-tidak_hadir">
                                  <span data-attend-absen="">
                                    {absenCount}
                                  </span>
                                  <span>
                                    Tidak hadir
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="cui-clearfix cui-wrap-form">
                            <div className="cui-container-form cui-no-login">
                              <div className="respond cui-clearfix">
                                <form className="vb-wishes-form" id="commentform-5856" data-wishes-form="">
                                  <p className="comment-form-author cui-field-1">
                                    <input id="author" name="author" type="text" className="cui-input" placeholder="Nama" required />
                                  </p>
                                  <div className="cui-wrap-textarea">
                                    <textarea id="cui-textarea-5856" className="waci_comment cui-textarea autosize-textarea" name="comment" placeholder="Ucapan" rows="2" required></textarea>
                                    <span className="cui-required">*</span>
                                    <span className="cui-error-info cui-error-info-text">2 characters minimum.</span>
                                  </div>
                                  <div className="cui-clearfix cui-wrap-select cui-field-wrap cui-select-attending">
                                    <select className="waci_comment cui-select" name="konfirmasi" id="konfirmasi" defaultValue="" required>
                                      <option value="" disabled>
                                        Konfirmasi Kehadiran
                                      </option>
                                      <option value="Hadir">
                                        Datang
                                      </option>
                                      <option value="Tidak hadir">
                                        Absen
                                      </option>
                                    </select>
                                    <span className="cui-required"></span>
                                    <span className="cui-error-info cui-error-info-confirm"></span>
                                  </div>
                                  <div className="cui-wrap-submit cui-clearfix">
                                    <p className="form-submit">
                                      <span className="cui-hide">Do not change these fields following</span>
                                      <input type="text" className="cui-hide" name="name" value="username" readOnly />
                                      <input type="text" className="cui-hide" name="nombre" value="" readOnly />
                                      <input type="text" className="cui-hide" name="form-cui" value="" readOnly />
                                      <input type="button" className="cui-form-btn cui-cancel-btn" value="Cancel" />
                                      <input name="submit" id="submit-5856" value="Kirim" type="submit" />
                                    </p>
                                  </div>
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div id="cui-comment-status-5856" className="cui-comment-status"></div>
                        <div id="cui-box" className="cui-box">
                          <ul
                            id="cui-container-comment-5856"
                            className={wishesListClassName}
                            data-order="DESC"
                            data-wishes-list=""
                            style={{ display: "block" }}
                          >
                            {wishes.map((wish, index) => (
                              <li className="cui-item-comment vb-wishes-item" key={`${wish.author}-${wish.createdAt}-${index}`}>
                                <div className="cui-comment-avatar">
                                  <img alt={wish.author} src={commentAvatarSrc} />
                                </div>
                                <div className="cui-comment-content">
                                  <div className="cui-comment-info">
                                    <a className="cui-commenter-name">{wish.author}</a>
                                  </div>
                                  <div className="cui-comment-text">
                                    <p>{wish.comment}</p>
                                  </div>
                                  <div className="vb-wishes-meta">
                                    <span>{wish.createdAt}</span>
                                    <span className="vb-wishes-attend">{wish.attendance}</span>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-7bd1d03a elementor-widget elementor-widget-spacer" data-id="7bd1d03a" data-element_type="widget" data-widget_type="spacer.default">
                  <div className="elementor-widget-container">
                    <div className="elementor-spacer">
                      <div className="elementor-spacer-inner"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="elementor-element elementor-element-35e18d91 e-flex e-con-boxed e-con e-parent" data-id="35e18d91" data-element_type="container">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-526d66ae e-con-full e-flex e-con e-child" data-id="526d66ae" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-67cb162e elementor-widget elementor-widget-spacer" data-id="67cb162e" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-43b40837 reveal elementor-widget elementor-widget-heading" data-id="43b40837" data-element_type="widget" data-widget_type="heading.default">
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    Terimakasih
                  </h2>
                </div>
              </div>
            </div>
            <div className="elementor-element elementor-element-5de4b0ce e-con-full e-flex e-con e-child" data-id="5de4b0ce" data-element_type="container" data-settings='{"background_background":"classic"}'>
              <div className="elementor-element elementor-element-27820747 reveal elementor-widget elementor-widget-text-editor" data-id="27820747" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Telah menjadi bagian dari momen bahagia kami
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-57e5bff0 animated-slow elementor-invisible elementor-widget elementor-widget-text-editor" data-id="57e5bff0" data-element_type="widget" data-settings='{"_animation":"fadeInUp"}' data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Habib & Adiba
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-448daa98 elementor-widget elementor-widget-spacer" data-id="448daa98" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-27a9fef5 elementor-widget elementor-widget-text-editor" data-id="27a9fef5" data-element_type="widget" data-widget_type="text-editor.default">
                <div className="elementor-widget-container">
                  <p>
                    Support with
                    <img decoding="async" className="emoji" role="img" draggable="false" src={resolveAssetUrl("assets/images/s.w.org/images__core__emoji__13.0.1__svg__2764.svg")} alt="❤" />
                    by ikatancinta.in
                  </p>
                </div>
              </div>
              <div className="elementor-element elementor-element-636ea9bd elementor-view-stacked elementor-shape-circle elementor-widget elementor-widget-weddingpress-audio" data-id="636ea9bd" data-element_type="widget" data-settings='{"sticky":"bottom","sticky_offset":130,"sticky_offset_mobile":120,"loop":"yes","sticky_on":["desktop","tablet","mobile"],"sticky_effects_offset":0,"sticky_anchor_link_offset":0}' data-widget_type="weddingpress-audio.default">
                <div className="elementor-widget-container">
                  <div id="audio-container" className="audio-box">
                    <audio id="song" loop>
                      <source src={resolveAssetUrl("assets/misc/local/wp-content__uploads__2024__09__y2mate.com-PREP-As-It-Was-Harry-Styles-Cover-Official-Visualizer-1-1.mp3")} type="audio/mp3" />
                    </audio>
                    <div className="elementor-icon-wrapper" id="unmute-sound" style={{ display: "none" }}>
                      <div className="elementor-icon elementor-animation-shrink">
                        <i aria-hidden="true" className="far fa-pause-circle"></i>
                      </div>
                    </div>
                    <div className="elementor-icon-wrapper" id="mute-sound" style={{ display: "none" }}>
                      <div className="elementor-icon elementor-animation-shrink">
                        <i aria-hidden="true" className="fas fa-compact-disc"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-3ab6375b elementor-widget elementor-widget-spacer" data-id="3ab6375b" data-element_type="widget" data-widget_type="spacer.default">
                <div className="elementor-widget-container">
                  <div className="elementor-spacer">
                    <div className="elementor-spacer-inner"></div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-element-46795b49 e-con-full e-flex e-con e-child" data-id="46795b49" data-element_type="container" data-settings='{"background_background":"classic","sticky":"bottom","sticky_offset":20,"sticky_on":["desktop","tablet","mobile"],"sticky_effects_offset":0,"sticky_anchor_link_offset":0}'>
                <div className="elementor-element elementor-element-10f4dcc5 e-con-full e-flex e-con e-child" data-id="10f4dcc5" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-3d0eb30b elementor-shape-rounded elementor-grid-0 e-grid-align-center elementor-widget elementor-widget-social-icons" data-id="3d0eb30b" data-element_type="widget" data-widget_type="social-icons.default">
                    <div className="elementor-widget-container">
                      <div className="elementor-social-icons-wrapper elementor-grid">
                        <span className="elementor-grid-item">
                          <a className="elementor-icon elementor-social-icon elementor-social-icon-home elementor-animation-pulse-grow elementor-repeater-item-4185e3b" href="#home">
                            <span className="elementor-screen-only">
                              Home
                            </span>
                            <i aria-hidden="true" className="fas fa-home"></i>
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-69cb2bd3 e-con-full e-flex e-con e-child" data-id="69cb2bd3" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-31d5bec2 elementor-shape-rounded elementor-grid-0 e-grid-align-center elementor-widget elementor-widget-social-icons" data-id="31d5bec2" data-element_type="widget" data-widget_type="social-icons.default">
                    <div className="elementor-widget-container">
                      <div className="elementor-social-icons-wrapper elementor-grid">
                        <span className="elementor-grid-item">
                          <a className="elementor-icon elementor-social-icon elementor-social-icon-heart elementor-animation-pulse-grow elementor-repeater-item-4185e3b" href="#mempelai">
                            <span className="elementor-screen-only">
                              Heart
                            </span>
                            <i aria-hidden="true" className="far fa-heart"></i>
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-7ee24fcb e-con-full e-flex e-con e-child" data-id="7ee24fcb" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-4a5968c7 elementor-shape-rounded elementor-grid-0 e-grid-align-center elementor-widget elementor-widget-social-icons" data-id="4a5968c7" data-element_type="widget" data-widget_type="social-icons.default">
                    <div className="elementor-widget-container">
                      <div className="elementor-social-icons-wrapper elementor-grid">
                        <span className="elementor-grid-item">
                          <a className="elementor-icon elementor-social-icon elementor-social-icon-calendar-alt elementor-animation-pulse-grow elementor-repeater-item-4185e3b" href="#date">
                            <span className="elementor-screen-only">
                              Calendar-alt
                            </span>
                            <i aria-hidden="true" className="far fa-calendar-alt"></i>
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-6a1d9a9f e-con-full e-flex e-con e-child" data-id="6a1d9a9f" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-4f699e5e elementor-shape-rounded elementor-grid-0 e-grid-align-center elementor-widget elementor-widget-social-icons" data-id="4f699e5e" data-element_type="widget" data-widget_type="social-icons.default">
                    <div className="elementor-widget-container">
                      <div className="elementor-social-icons-wrapper elementor-grid">
                        <span className="elementor-grid-item">
                          <a className="elementor-icon elementor-social-icon elementor-social-icon-images elementor-animation-pulse-grow elementor-repeater-item-4185e3b" href="#galeri">
                            <span className="elementor-screen-only">
                              Images
                            </span>
                            <i aria-hidden="true" className="far fa-images"></i>
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="elementor-element elementor-element-58514246 e-con-full e-flex e-con e-child" data-id="58514246" data-element_type="container" data-settings='{"background_background":"classic"}'>
                  <div className="elementor-element elementor-element-6137fdb4 elementor-shape-rounded elementor-grid-0 e-grid-align-center elementor-widget elementor-widget-social-icons" data-id="6137fdb4" data-element_type="widget" data-widget_type="social-icons.default">
                    <div className="elementor-widget-container">
                      <div className="elementor-social-icons-wrapper elementor-grid">
                        <span className="elementor-grid-item">
                          <a className="elementor-icon elementor-social-icon elementor-social-icon-comment-dots elementor-animation-pulse-grow elementor-repeater-item-4185e3b" href="#ucapan">
                            <span className="elementor-screen-only">
                              Comment-dots
                            </span>
                            <i aria-hidden="true" className="far fa-comment-dots"></i>
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
