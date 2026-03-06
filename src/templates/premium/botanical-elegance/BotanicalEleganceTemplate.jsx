import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";

import { useInvitationData } from "../../../hooks/useInvitationData";
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

    return output;
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

export default function BotanicalEleganceTemplate({ data: propData = schemaJson }) {
    const { data: fetchedData } = useInvitationData("botanical-elegance");
    const mergedData = useMemo(() => mergeInvitationData(defaultSchema, propData, fetchedData), [propData, fetchedData]);
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

        const groom = {
            nickName: normalizeText(mergedData?.groom?.nickName || mergedData?.couple?.groom?.nickName || "Habib"),
            fullName: normalizeText(mergedData?.groom?.fullName || mergedData?.couple?.groom?.nameFull || "Habib Yulianto"),
            parentInfo:
                normalizeText(mergedData?.groom?.parentInfo || mergedData?.couple?.groom?.parentInfo || "Putri Pertama dari Bapak Andri Setiawan & Ibu Eva Naryanti"),
            instagram: normalizeText(mergedData?.groom?.instagram || mergedData?.couple?.groom?.instagram || "https://www.instagram.com/"),
            image: mergedData?.groom?.image || mergedData?.groom?.photo || schemaJson.groom.image,
        };

        const bride = {
            nickName: normalizeText(mergedData?.bride?.nickName || mergedData?.couple?.bride?.nickName || "Adiba"),
            fullName: normalizeText(mergedData?.bride?.fullName || mergedData?.couple?.bride?.nameFull || "Adiba Putri Syakila"),
            parentInfo:
                normalizeText(mergedData?.bride?.parentInfo || mergedData?.couple?.bride?.parentInfo || "Putri Pertama dari Bapak Andri Setiawan & Ibu Eva Naryanti"),
            instagram: normalizeText(mergedData?.bride?.instagram || mergedData?.couple?.bride?.instagram || "https://www.instagram.com/"),
            image: mergedData?.bride?.image || mergedData?.bride?.photo || schemaJson.bride.image,
        };

        const guestName = normalizeText(mergedData?.guest?.name || "Nama Tamu");
        const coupleDisplay = `${groom.nickName} & ${bride.nickName}`;
        const displayDate = normalizeText(mergedData?.event?.displayDate || "28. 12. 2025");
        const quote = normalizeText(mergedData?.copy?.quote || schemaJson.copy.quote);
        const quoteSource = normalizeText(mergedData?.copy?.quoteSource || schemaJson.copy.quoteSource);
        const coverImage = mergedData?.event?.heroImage || schemaJson.event.heroImage;
        const akad = mergedData?.event?.akad || {};
        const resepsi = mergedData?.event?.resepsi || {};
        const streaming = mergedData?.streaming || {};
        const gifts = mergedData?.gifts || {};
        const bankList = Array.isArray(gifts.bankAccounts) ? gifts.bankAccounts : [];
        const gallery = Array.isArray(mergedData?.gallery) && mergedData.gallery.length > 0 ? mergedData.gallery : schemaJson.gallery;
        const stories = Array.isArray(mergedData?.loveStory) && mergedData.loveStory.length > 0 ? mergedData.loveStory : schemaJson.loveStory;

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

        const updateImage = (selector, value) => {
            const node = root.querySelector(selector);
            if (!node || !value) return;
            node.setAttribute("src", resolveAssetUrl(value));
        };

        setText(".elementor-element-203a05d1 .elementor-heading-title", coupleDisplay);
        setText(".elementor-element-18357ad8 .elementor-heading-title", guestName);
        setText(".elementor-element-4b0afbb5 .elementor-heading-title", coupleDisplay);
        setText(".elementor-element-131f2246 .elementor-heading-title", displayDate);
        setHtml(".elementor-element-11c363cd .elementor-widget-container", `<p>${escapeHtml(groom.nickName)} &amp;</p><p>${escapeHtml(bride.nickName)}</p>`);
        setText(".elementor-element-74b466e3 .elementor-heading-title", displayDate);
        setHtml(
            ".elementor-element-553c0b1 .elementor-heading-title",
            `${escapeHtml(quote)}<br><br><b>${escapeHtml(quoteSource)}</b>`
        );
        setText(".elementor-element-54c012bc .elementor-heading-title", groom.fullName);
        setText(".elementor-element-54e979d1 .elementor-heading-title", bride.fullName);
        setHtml(".elementor-element-a05b88c .elementor-widget-container", formatParentInfoHtml(groom.parentInfo));
        setHtml(".elementor-element-2c8f05cb .elementor-widget-container", formatParentInfoHtml(bride.parentInfo));
        setLink(".elementor-element-4ee7e879 a", toInstagramUrl(groom.instagram));
        setLink(".elementor-element-4592ba4d a", toInstagramUrl(bride.instagram));
        updateImage(".elementor-element-5eec50c8 img", coverImage);
        updateImage(".elementor-element-7bb1f0bc img", coverImage);
        updateImage(".elementor-element-7a06c7ac img", groom.image);
        updateImage(".elementor-element-750ddc6b img", bride.image);

        setText(".elementor-element-2e7e88b2 .elementor-heading-title", normalizeText(akad.date || schemaJson.event.akad.date));
        setText(".elementor-element-618e783 p", normalizeText(akad.time || schemaJson.event.akad.time));
        setHtml(".elementor-element-1d0f5bf0 .elementor-widget-container", formatAddressHtml(akad.addressName, akad.address));

        setText(".elementor-element-38a25917 .elementor-heading-title", normalizeText(resepsi.date || schemaJson.event.resepsi.date));
        setText(".elementor-element-4f4f30c1 p", normalizeText(resepsi.time || schemaJson.event.resepsi.time));
        setHtml(".elementor-element-226a4d35 .elementor-widget-container", formatAddressHtml(resepsi.addressName, resepsi.address));
        setLink(".elementor-element-d620ac1 a", resepsi.mapsUrl || mergedData?.event?.mapUrl || schemaJson.event.mapUrl);

        setText(".elementor-element-47e4b7d9 .elementor-heading-title", normalizeText(streaming.date || schemaJson.streaming.date));
        setText(".elementor-element-15210c7b p", normalizeText(streaming.time || schemaJson.streaming.time));
        setLink(".elementor-element-183e05ef a", streaming.url || schemaJson.streaming.url);
        setText(".elementor-element-183e05ef .elementor-button-text", normalizeText(streaming.label || schemaJson.streaming.label));

        stories.slice(0, 3).forEach((story, index) => {
            const titleSelectors = [".elementor-element-76ffe19e p", ".elementor-element-57f65ff p", ".elementor-element-6fdc1dc2 p"];
            const descSelectors = [".elementor-element-59509e18 p", ".elementor-element-2e3f62ef p", ".elementor-element-14578bea p"];
            setText(titleSelectors[index], normalizeText(story?.title || ""));
            setText(descSelectors[index], normalizeText(story?.description || ""));
        });

        const galleryContainer = root.querySelector(".elementor-element-1a3a1608 .elementor-gallery__container");
        if (galleryContainer) galleryContainer.classList.add("be-gallery-fallback");
        root.querySelectorAll(".elementor-element-1a3a1608 .e-gallery-item").forEach((node, index) => {
            const imageUrl = resolveAssetUrl(gallery[index % gallery.length]);
            node.setAttribute("href", imageUrl);
            const imageNode = node.querySelector(".e-gallery-image");
            if (imageNode) {
                imageNode.setAttribute("data-thumbnail", imageUrl);
                imageNode.style.backgroundImage = `url("${imageUrl}")`;
            }
        });

        const bank1 = bankList[0] || {};
        const bank2 = bankList[1] || bank1;
        setText(".elementor-element-1de686fb .elementor-heading-title", normalizeText(bank1.accountNumber || "1234 5678 90"));
        setText(".elementor-element-14c8f643 .elementor-heading-title", normalizeText(bank1.accountHolder || groom.nickName));
        setText(".elementor-element-797e0dc4 .elementor-heading-title", normalizeText(bank2.accountNumber || bank1.accountNumber || "1234 5678 90"));
        setText(".elementor-element-4f515712 .elementor-heading-title", normalizeText(bank2.accountHolder || bank1.accountHolder || groom.nickName));
        updateImage(".elementor-element-5c5857df img", bank1.logo);
        updateImage(".elementor-element-5b5cab78 img", bank1.chip);
        updateImage(".elementor-element-1918ee75 img", bank2.logo);
        setHtml(
            ".elementor-element-45529c48 .elementor-widget-container",
            `<p>Nama Penerima : ${escapeHtml(normalizeText(gifts.shipping?.recipient || schemaJson.gifts.shipping.recipient))}</p><p>No. HP : <b>${escapeHtml(
                normalizeText(gifts.shipping?.phone || schemaJson.gifts.shipping.phone)
            )}</b></p><p>${escapeHtml(normalizeText(gifts.shipping?.address || schemaJson.gifts.shipping.address))}</p>`
        );

        root.querySelectorAll(".elementor-widget-weddingpress-copy-text").forEach((node, index) => {
            const copyContent = node.querySelector(".copy-content");
            const button = node.querySelector(".elementor-button");
            const account = index === 0 ? bank1.accountNumber : bank2.accountNumber || bank1.accountNumber;
            if (copyContent) copyContent.innerHTML = escapeHtml(normalizeText(account || ""));
            if (button) button.classList.add("be-copy-trigger");
        });

        setText(".elementor-element-7b0cf99f .elementor-heading-title", coupleDisplay);

        const countdownNode = root.querySelector("#wpkoi-elements-countdown-4884d460");
        const countdownTarget = mergedData?.event?.dateISO || schemaJson.event.dateISO;
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
            if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
            unlockTimerRef.current = window.setTimeout(() => {
                document.body.classList.remove("be-lock-scroll");
                setScrollUnlocked(true);
            }, tokens.motion.gateDurationMs);

            const audio = audioRef.current;
            if (audio) {
                try {
                    await audio.play();
                } catch {
                    // ignored
                }
            }

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

        const audioElement = root.querySelector("#song");
        if (audioElement) {
            audioElement.setAttribute("src", resolveAssetUrl("assets/media/audio/Howl-s-Moving-FULL-CUT.mp3"));
            audioElement.load();
            audioRef.current = audioElement;
        }

        const updateAudioIcons = () => {
            const audio = audioRef.current;
            const mute = root.querySelector("#mute-sound");
            const unmute = root.querySelector("#unmute-sound");
            if (!audio || !mute || !unmute) return;
            if (audio.paused) {
                mute.style.display = "none";
                unmute.style.display = "block";
            } else {
                mute.style.display = "block";
                unmute.style.display = "none";
            }
        };
        updateAudioIcons();

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
            updateAudioIcons();
        };
        audioContainer?.addEventListener("click", onAudioToggle);

        const onVisibilityChange = () => {
            const audio = audioRef.current;
            if (!audio) return;
            if (document.visibilityState === "hidden") {
                audio.pause();
            } else if (opened) {
                audio.play().catch(() => undefined);
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
                                formatWishTimestamp(entry.createdAt)
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

        const onWishSubmit = (event) => {
            event.preventDefault();
            const author = form?.querySelector("#author");
            const comment = form?.querySelector("#comment");
            const attendance = form?.querySelector("#attendance-13544");
            if (!author || !comment || !attendance) return;
            if (!author.reportValidity() || !comment.reportValidity() || !attendance.reportValidity()) return;

            const nextEntry = normalizeWishItem({
                author: author.value,
                comment: comment.value,
                attendance: attendance.value,
                createdAt: new Date().toISOString(),
            });
            if (!nextEntry) return;

            const next = [nextEntry, ...wishes];
            setWishes(next);
            writeStoredWishes(next);
            form.reset();

            if (commentStatus) {
                commentStatus.textContent = "Ucapan berhasil disimpan di browser ini.";
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
            form?.removeEventListener("submit", onWishSubmit);
            countLink?.removeEventListener("click", onCountLinkClick);
            root.removeEventListener("click", onCopyClick);
            root.removeEventListener("click", onAnchorClick);
            root.removeEventListener("click", onGalleryClick);
            lottieInstancesRef.current.forEach((instance) => instance?.destroy?.());
            lottieInstancesRef.current = [];
        };
    }, [mergedData, opened, scrollUnlocked, wishes]);

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
