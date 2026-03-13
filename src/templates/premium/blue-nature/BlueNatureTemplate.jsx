import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { postInvitationWish } from "../../../services/wishesApi";
import defaultSchema from "./schema/invitationSchema";
import { aosPreset, tokens } from "./tokens";
import "./blue-nature.css";

import BgCover from "./assets/images/bg-cover.webp";
import HeroPhoto from "./assets/images/hero-photo.jpg";
import BgTexture from "./assets/images/bg-texture.jpg";
import BgPatternLight from "./assets/images/bg-pattern-light.webp";
import BgPatternGallery from "./assets/images/bg-pattern-gallery.webp";
import GroomPhoto from "./assets/images/groom-photo.jpg";
import BridePhoto from "./assets/images/bride-photo.jpg";
import StoryPhoto from "./assets/images/story-photo.jpg";
import Gallery1 from "./assets/images/gallery-1.jpg";
import Gallery2 from "./assets/images/gallery-2.jpg";
import Gallery3 from "./assets/images/gallery-3.jpg";
import FloralDecoration from "./assets/images/floral-decoration.webp";
import ChipAtm from "./assets/images/chip-atm.png";
import LogoBca from "./assets/images/logo-bca.png";
import LogoDana from "./assets/images/logo-dana.png";
import HeartEmoji from "./assets/images/heart-emoji.svg";
import BackgroundMusic from "./assets/audio/background-music.mp3";

const LOCAL_ASSET_MAP = {
    "assets/images/bg-cover.webp": BgCover,
    "assets/images/hero-photo.jpg": HeroPhoto,
    "assets/images/bg-texture.jpg": BgTexture,
    "assets/images/bg-pattern-light.webp": BgPatternLight,
    "assets/images/bg-pattern-gallery.webp": BgPatternGallery,
    "assets/images/groom-photo.jpg": GroomPhoto,
    "assets/images/bride-photo.jpg": BridePhoto,
    "assets/images/story-photo.jpg": StoryPhoto,
    "assets/images/gallery-1.jpg": Gallery1,
    "assets/images/gallery-2.jpg": Gallery2,
    "assets/images/gallery-3.jpg": Gallery3,
    "assets/images/floral-decoration.webp": FloralDecoration,
    "assets/images/chip-atm.png": ChipAtm,
    "assets/images/logo-bca.png": LogoBca,
    "assets/images/logo-dana.png": LogoDana,
    "assets/images/heart-emoji.svg": HeartEmoji,
    "assets/audio/background-music.mp3": BackgroundMusic,
};

function resolveLocalAsset(path, fallback = "") {
    if (!path) return fallback;
    return LOCAL_ASSET_MAP[path] || path || fallback;
}

function mergeInvitationData(baseSchema, incomingData) {
    if (!incomingData || typeof incomingData !== "object") return baseSchema;

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
        lovestory: Array.isArray(incomingData.lovestory) ? incomingData.lovestory : baseSchema.lovestory,
        gallery: Array.isArray(incomingData.gallery) ? incomingData.gallery : baseSchema.gallery,
        gift: {
            ...(baseSchema.gift || {}),
            ...(incomingData.gift || {}),
            shipping: {
                ...(baseSchema.gift?.shipping || {}),
                ...(incomingData.gift?.shipping || {}),
            },
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
            ...(baseSchema.wishes || {}),
            ...(incomingData.wishes || {}),
            initial: Array.isArray(incomingData.wishes?.initial)
                ? incomingData.wishes.initial
                : Array.isArray(baseSchema.wishes?.initial)
                    ? baseSchema.wishes.initial
                    : [],
        },
        behavior: {
            ...(baseSchema.behavior || {}),
            ...(incomingData.behavior || {}),
            audio: {
                ...(baseSchema.behavior?.audio || {}),
                ...(incomingData.behavior?.audio || {}),
            },
            cover: {
                ...(baseSchema.behavior?.cover || {}),
                ...(incomingData.behavior?.cover || {}),
            },
            gift: {
                ...(baseSchema.behavior?.gift || {}),
                ...(incomingData.behavior?.gift || {}),
            },
            countdown: {
                ...(baseSchema.behavior?.countdown || {}),
                ...(incomingData.behavior?.countdown || {}),
            },
            lightbox: {
                ...(baseSchema.behavior?.lightbox || {}),
                ...(incomingData.behavior?.lightbox || {}),
            },
        },
    };
}

function formatEventDate(dateText) {
    if (!dateText) return "";
    return dateText;
}

function formatCountdown(targetISO) {
    const now = Date.now();
    const target = new Date(targetISO).getTime();
    const diff = target - now;
    if (!Number.isFinite(target) || diff <= 0) {
        return { days: "00", hours: "00", minutes: "00", seconds: "00", ended: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        ended: false,
    };
}

function downloadICS(invitationData) {
    const eventStart = invitationData?.event?.dateISO || "";
    const cleanDate = eventStart.replace(/[-:]/g, "").slice(0, 15);
    const title = `${invitationData?.couple?.groom?.nickName || ""} & ${invitationData?.couple?.bride?.nickName || ""}`;
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Ikatan Cinta//BlueNature//EN",
        "BEGIN:VEVENT",
        `SUMMARY:Pernikahan ${title}`,
        `DTSTART:${cleanDate}`,
        `DESCRIPTION:${invitationData?.copy?.openingText || ""}`,
        `LOCATION:${invitationData?.event?.akad?.address || ""}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "save-the-date.ics";
    link.click();
    URL.revokeObjectURL(url);
}

function EventCard({ title, detail, patternImage, delay = 0 }) {
    if (!detail) return null;

    return (
        <article
            className="bn-event-card bn-reveal"
            data-aos={aosPreset("card", delay).aos}
            data-aos-delay={aosPreset("card", delay).delay}
            style={{ backgroundImage: `url(${patternImage})` }}
        >
            <h3 className="bn-title-script bn-event-card__title">{title}</h3>
            <p className="bn-event-card__date">{formatEventDate(detail.date)}</p>
            <p className="bn-event-card__time">Pukul: {detail.time}</p>
            <div className="bn-event-card__divider" aria-hidden="true">
                <i className="bn-fas bn-fa-map-marker-alt" />
            </div>
            <p className="bn-event-card__location">{detail.address}</p>
            {detail.mapsUrl ? (
                <a className="bn-btn-pill" href={detail.mapsUrl} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>
                    <i className="bn-fas bn-fa-map-marker-alt" />
                    <span>Lihat Lokasi</span>
                </a>
            ) : null}
        </article>
    );
}

export default function BlueNatureTemplate({ data: propData = null }) {
    const { data: fetchedData, loading } = useInvitationData("blue-nature");
    const mergedData = useMemo(
        () => mergeInvitationData(defaultSchema, { ...(fetchedData || {}), ...(propData || {}) }),
        [fetchedData, propData]
    );

    const [opened, setOpened] = useState(false);
    const [gateClosing, setGateClosing] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [activeNav, setActiveNav] = useState("hero");
    const [giftOpen, setGiftOpen] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState("");
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const initialWishes = useMemo(
        () => (Array.isArray(mergedData?.wishes?.initial) ? mergedData.wishes.initial : defaultSchema.wishes.initial),
        [mergedData]
    );
    const [wishes, setWishes] = useState(() => initialWishes);
    const [wishForm, setWishForm] = useState({ author: "", comment: "", attendance: "" });
    const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00", ended: false });

    const audioRef = useRef(null);

    const guest = mergedData?.guest;
    const couple = mergedData?.couple;
    const event = mergedData?.event;
    const copy = mergedData?.copy;
    const lovestory = mergedData?.lovestory;
    const features = mergedData?.features;
    const behavior = mergedData?.behavior || defaultSchema.behavior;
    const audio = mergedData?.audio || defaultSchema.audio;
    const gift = mergedData?.gift || defaultSchema.gift;

    const galleryItems = useMemo(() => {
        if (Array.isArray(mergedData?.gallery) && mergedData.gallery.length > 0) {
            return mergedData.gallery.map((item) => resolveLocalAsset(item, item));
        }
        return [Gallery1, Gallery2, StoryPhoto, HeroPhoto, Gallery3];
    }, [mergedData]);

    const timelineItems = useMemo(() => {
        if (Array.isArray(lovestory) && lovestory.length > 0) {
            return lovestory.slice(0, 3);
        }
        return [
            { title: "Awal Bertemu", date: "2019", text: "Perjalanan kami dimulai dari pertemuan sederhana yang membawa banyak cerita indah." },
            { title: "Lamaran", date: "2025", text: "Dengan restu keluarga, kami mengikat janji dan memulai langkah baru bersama." },
            { title: "Pernikahan", date: "2026", text: "Kami memohon doa agar rumah tangga kami dipenuhi kebahagiaan dan keberkahan." },
        ];
    }, [lovestory]);

    useEffect(() => {
        setWishes(Array.isArray(initialWishes) ? initialWishes : []);
    }, [initialWishes]);

    const attendanceSummary = useMemo(() => {
        return wishes.reduce(
            (acc, item) => {
                if (item.attendance === "Hadir") acc.hadir += 1;
                if (item.attendance === "Tidak Hadir") acc.tidakHadir += 1;
                return acc;
            },
            { hadir: 0, tidakHadir: 0 }
        );
    }, [wishes]);

    const bankList = features?.digitalEnvelopeInfo?.bankList || gift?.bankList || [];

    useEffect(() => {
        if (!behavior?.aos) return;
        AOS.init({
            duration: tokens.aos.duration,
            offset: tokens.aos.offset,
            easing: tokens.aos.easing,
            once: tokens.aos.once,
        });
    }, [behavior?.aos]);

    useEffect(() => {
        if (!opened) return;
        const timer = setTimeout(() => AOS.refresh(), 350);
        return () => clearTimeout(timer);
    }, [opened]);

    useEffect(() => {
        if (!opened || !event?.dateISO || !features?.countdownEnabled || !behavior?.countdown?.enabled) return;
        const update = () => setCountdown(formatCountdown(event.dateISO));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [opened, event?.dateISO, features?.countdownEnabled, behavior?.countdown?.enabled]);

    useEffect(() => {
        if (opened || behavior?.cover?.lockScrollUntilOpen === false) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [opened, behavior?.cover?.lockScrollUntilOpen]);

    useEffect(() => {
        setGiftOpen(behavior?.gift?.startHidden === false);
    }, [behavior?.gift?.startHidden]);

    useEffect(() => {
        if (!opened) return;
        if (behavior?.reveal === false) return;
        const nodes = Array.from(document.querySelectorAll(".bn-reveal"));
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("bn-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: "0px 0px -30px 0px" }
        );

        nodes.forEach((node) => observer.observe(node));

        return () => observer.disconnect();
    }, [opened, behavior?.reveal]);

    useEffect(() => {
        if (!opened) return;
        const sectionIds = ["hero", "events", "gallery"];
        if (features?.rsvpEnabled && behavior?.wishes?.enabled !== false) {
            sectionIds.push("rsvp");
        } else if (features?.digitalEnvelopeEnabled && behavior?.gift?.toggleEnabled !== false) {
            sectionIds.push("gift");
        }
        sectionIds.push("closing");
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveNav(entry.target.id.replace("section-", ""));
                    }
                });
            },
            { threshold: 0.35 }
        );

        sectionIds.forEach((id) => {
            const element = document.getElementById(`section-${id}`);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [opened, features?.rsvpEnabled, features?.digitalEnvelopeEnabled, behavior?.wishes?.enabled, behavior?.gift?.toggleEnabled]);

    useEffect(() => {
        const handleVisibility = () => {
            const audio = audioRef.current;
            if (!audio) return;
            if (document.visibilityState === "hidden" && behavior?.audio?.pauseOnHidden !== false) {
                audio.pause();
            } else if (document.visibilityState === "visible" && audioPlaying && behavior?.audio?.enabled !== false) {
                audio.play().catch(() => {});
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [audioPlaying, behavior?.audio?.pauseOnHidden, behavior?.audio?.enabled]);

    async function playAudio() {
        if (behavior?.audio?.enabled === false) return;
        const audio = audioRef.current;
        if (!audio) return;
        try {
            await audio.play();
            setAudioPlaying(true);
        } catch {
            setAudioPlaying(false);
        }
    }

    async function toggleAudio() {
        if (behavior?.audio?.enabled === false) return;
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            try {
                await audio.play();
                setAudioPlaying(true);
            } catch {
                setAudioPlaying(false);
            }
        } else {
            audio.pause();
            setAudioPlaying(false);
        }
    }

    function handleOpenInvitation() {
        if (opened || gateClosing) return;
        setOpened(true);
        setGateClosing(true);
        setTimeout(() => setGateClosing(false), behavior?.cover?.closeTransitionMs || 950);
        if (behavior?.audio?.enabled !== false && behavior?.audio?.autoplayOnOpen !== false) {
            playAudio();
        }
    }

    function handleCopy(account) {
        if (!account) return;
        const fallbackCopy = () => {
            const textarea = document.createElement("textarea");
            textarea.value = account;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        };

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(account).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }

        setCopiedAccount(account);
        setTimeout(() => setCopiedAccount(""), 1600);
    }

    async function handleWishSubmit(submitEvent) {
        submitEvent.preventDefault();
        if (!wishForm.author.trim() || !wishForm.comment.trim() || !wishForm.attendance) return;

        const createdAt = new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date());

        try {
            await postInvitationWish("blue-nature", {
                author: wishForm.author.trim(),
                comment: wishForm.comment.trim(),
                attendance: wishForm.attendance,
            });
        } catch {
            // Keep optimistic local render even if API is unavailable.
        }

        setWishes((prev) => [
            {
                author: wishForm.author.trim(),
                comment: wishForm.comment.trim(),
                attendance: wishForm.attendance,
                createdAt,
            },
            ...prev,
        ]);

        setWishForm({ author: "", comment: "", attendance: "" });
    }

    function navItem(id, icon, label) {
        const active = activeNav === id;
        return (
            <button
                type="button"
                key={id}
                className={`bn-bottom-nav__item ${active ? "is-active" : ""}`}
                onClick={() => {
                    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
                    setActiveNav(id);
                }}
                aria-label={label}
            >
                <span className="material-symbols-outlined bn-bottom-nav__icon">{icon}</span>
                <span>{label}</span>
            </button>
        );
    }

    if (loading || !mergedData || !couple || !event || !copy || !guest) {
        return (
            <div className="bn-template" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                Memuat undangan...
            </div>
        );
    }

    return (
        <div className="bn-template">
            <div className="bn-shell">
                {(!opened || gateClosing) && (
                    <section className={`bn-cover-gate ${gateClosing ? "bn-cover-gate--closing" : ""}`}>
                        <div
                            className="bn-cover-gate__content"
                            style={{ backgroundImage: `url(${resolveLocalAsset(couple.heroPhoto, HeroPhoto)})` }}
                        >
                            <p className="bn-cover-gate__label" data-aos={aosPreset("heading").aos}>
                                The Wedding Of
                            </p>
                            <h1 className="bn-cover-gate__names" data-aos={aosPreset("title").aos}>
                                {couple.groom.nickName} &amp; {couple.bride.nickName}
                            </h1>
                            <p className="bn-cover-gate__dear">{guest.greetingLabel}</p>
                            <p className="bn-cover-gate__guest">{guest.name}</p>
                            <button type="button" className="bn-btn-pill" onClick={handleOpenInvitation}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
                                Buka Undangan
                            </button>
                        </div>
                    </section>
                )}

                {opened && (
                    <main className="bn-main">
                        <section id="section-hero" className="bn-section bn-hero" style={{ backgroundImage: `url(${BgCover})` }}>
                            <div className="bn-hero__panel">
                                <div className="bn-hero__photo" data-aos={aosPreset("photo").aos}>
                                    <img
                                        src={resolveLocalAsset(couple.heroPhoto, HeroPhoto)}
                                        alt={`Foto ${couple.groom.nickName} dan ${couple.bride.nickName}`}
                                    />
                                </div>
                                <p className="bn-hero__label" data-aos={aosPreset("heading").aos}>The Wedding Of</p>
                                <h1 className="bn-hero__names" data-aos={aosPreset("title").aos}>
                                    {couple.groom.nickName} &amp; {couple.bride.nickName}
                                </h1>
                                <p className="bn-hero__date" data-aos="fade-up" data-aos-delay="160">
                                    {formatEventDate(event.akad.date)}
                                </p>
                                {features.saveTheDateEnabled ? (
                                    <button
                                        type="button"
                                        className="bn-btn-pill"
                                        style={{ marginTop: 8 }}
                                        data-aos="zoom-in"
                                        data-aos-delay="240"
                                        onClick={() => downloadICS(mergedData)}
                                    >
                                        Save The Date
                                    </button>
                                ) : null}
                            </div>
                        </section>

                        <section id="section-quote" className="bn-section bn-quote" style={{ backgroundImage: `url(${BgTexture})` }}>
                            <div className="bn-quote__initials-wrap">
                                <img src={FloralDecoration} alt="" aria-hidden="true" className="bn-quote__floral bn-reveal" />
                                <h2 className="bn-quote__initials bn-reveal" data-aos="fade-up">
                                    {couple.groom.nickName?.charAt(0)} &amp; {couple.bride.nickName?.charAt(0)}
                                </h2>
                            </div>
                            <p className="bn-quote__text bn-reveal" data-aos="fade-up" data-aos-delay="100">
                                &quot;{copy.quote}&quot;
                            </p>
                            <p className="bn-quote__text" style={{ marginTop: 8, fontSize: 13 }} data-aos="fade-up" data-aos-delay="160">
                                <strong>({copy.quoteSource})</strong>
                            </p>
                        </section>

                        <section id="section-groom" className="bn-section bn-profile" style={{ backgroundImage: `url(${BgPatternLight})` }}>
                            <h2 className="bn-title-script bn-profile__title" data-aos="fade-down">Our Special Day</h2>
                            <p className="bn-profile__intro" data-aos="fade-up">{copy.openingText}</p>
                            <img
                                className="bn-profile__photo"
                                src={resolveLocalAsset(couple.groom.photo, GroomPhoto)}
                                alt={couple.groom.nameFull}
                                data-aos="zoom-in"
                            />
                            <h3 className="bn-profile__name" data-aos="fade-up">{couple.groom.nameFull}</h3>
                            <p className="bn-profile__parents" data-aos="fade-up" data-aos-delay="100">
                                {couple.groom.parentInfo}
                            </p>
                            {couple.groom.instagram ? (
                                <a
                                    className="bn-profile__social"
                                    href={`https://instagram.com/${couple.groom.instagram.replace("@", "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    data-aos="fade-up"
                                    data-aos-delay="160"
                                    aria-label="Instagram mempelai pria"
                                >
                                    <i className="bn-fab bn-fa-instagram" />
                                </a>
                            ) : null}
                        </section>

                        <section id="section-bride" className="bn-section bn-profile" style={{ backgroundImage: `url(${BgPatternLight})`, paddingTop: 14 }}>
                            <h2 className="bn-profile__name" style={{ marginTop: 0 }} data-aos="fade-up">
                                &amp;
                            </h2>
                            <img
                                className="bn-profile__photo"
                                src={resolveLocalAsset(couple.bride.photo, BridePhoto)}
                                alt={couple.bride.nameFull}
                                data-aos="zoom-in"
                            />
                            <h3 className="bn-profile__name" data-aos="fade-up">{couple.bride.nameFull}</h3>
                            <p className="bn-profile__parents" data-aos="fade-up" data-aos-delay="100">
                                {couple.bride.parentInfo}
                            </p>
                            {couple.bride.instagram ? (
                                <a
                                    className="bn-profile__social"
                                    href={`https://instagram.com/${couple.bride.instagram.replace("@", "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    data-aos="fade-up"
                                    data-aos-delay="160"
                                    aria-label="Instagram mempelai wanita"
                                >
                                    <i className="bn-fab bn-fa-instagram" />
                                </a>
                            ) : null}
                        </section>

                        {features.countdownEnabled ? (
                            <section id="section-countdown" className="bn-section bn-countdown">
                                <h2 className="bn-countdown__title" data-aos="fade-down">Save The Date</h2>
                                <div className="bn-countdown__timer">
                                    {[
                                        { label: "Hari", value: countdown.days },
                                        { label: "Jam", value: countdown.hours },
                                        { label: "Menit", value: countdown.minutes },
                                        { label: "Detik", value: countdown.seconds },
                                    ].map((item, index) => (
                                        <div
                                            key={item.label}
                                            className="bn-countdown__item"
                                            data-aos="fade-up"
                                            data-aos-delay={index * 100}
                                        >
                                            <span className="bn-countdown__digits">{item.value}</span>
                                            <span className="bn-countdown__label">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                                {countdown.ended ? (
                                    <p style={{ marginTop: 6, fontSize: 12 }}>Acara sedang berlangsung.</p>
                                ) : null}
                            </section>
                        ) : null}

                        <section id="section-events" className="bn-section bn-events" style={{ backgroundImage: `url(${BgTexture})` }}>
                            <EventCard title="Akad Nikah" detail={event.akad} patternImage={BgPatternLight} delay={0} />
                            <EventCard title="Resepsi" detail={event.resepsi} patternImage={BgPatternLight} delay={1} />
                        </section>

                        {features.livestreamEnabled && event.livestream ? (
                            <section id="section-live" className="bn-section bn-live" style={{ backgroundImage: `url(${BgTexture})` }}>
                                <article className="bn-live__card bn-reveal" style={{ backgroundImage: `url(${BgPatternLight})` }} data-aos="fade-up">
                                    <h3 className="bn-title-script bn-live__title" data-aos="fade-down">Live Streaming</h3>
                                    <p className="bn-live__text" data-aos="fade-up" data-aos-delay="100">
                                        Kami mengundang Bapak/Ibu/Saudara/i untuk menyaksikan pernikahan kami secara virtual.
                                    </p>
                                    <p className="bn-live__text" data-aos="fade-up" data-aos-delay="140">
                                        {event.livestream.date}
                                    </p>
                                    <p className="bn-live__text" data-aos="fade-up" data-aos-delay="180">
                                        Pukul: {event.livestream.time}
                                    </p>
                                    <a className="bn-btn-pill" href={event.livestream.url} target="_blank" rel="noreferrer" data-aos="zoom-in" data-aos-delay="220">
                                        Klik Disini
                                    </a>
                                </article>
                            </section>
                        ) : null}

                        <section id="section-gallery" className="bn-section bn-gallery" style={{ backgroundImage: `url(${BgPatternGallery})` }}>
                            <h2 className="bn-title-script bn-gallery__title" data-aos="fade-down">Gallery</h2>
                            <div className="bn-gallery__grid">
                                {galleryItems.map((image, index) => (
                                    <button
                                        type="button"
                                        className="bn-gallery__item"
                                        key={`${image}-${index}`}
                                        onClick={() => {
                                            if (behavior?.lightbox?.enabled === false) return;
                                            setLightboxIndex(index);
                                        }}
                                        data-aos="fade-up"
                                        data-aos-delay={index * 80}
                                        aria-label={`Buka foto galeri ${index + 1}`}
                                    >
                                        <img src={image} alt={`Galeri ${index + 1}`} loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section id="section-love-hero" className="bn-section bn-love-hero">
                            <h2 className="bn-love-hero__heading" data-aos="fade-down">Love</h2>
                            <p className="bn-love-hero__sub" data-aos="fade-up">Story</p>
                            <img
                                className="bn-love-hero__image"
                                src={resolveLocalAsset(timelineItems[0]?.photo, StoryPhoto)}
                                alt="Foto Love Story"
                                data-aos="zoom-in"
                            />
                        </section>

                        <section id="section-love-story" className="bn-section bn-timeline">
                            <article className="bn-timeline__card" data-aos="fade-up">
                                {timelineItems.map((storyItem, index) => (
                                    <div className="bn-timeline__item" key={`${storyItem.title}-${index}`}>
                                        <h3 className="bn-timeline__item-title">{storyItem.title}</h3>
                                        {storyItem.date ? <p className="bn-timeline__item-date">{storyItem.date}</p> : null}
                                        <p className="bn-timeline__item-text">{storyItem.text}</p>
                                    </div>
                                ))}
                            </article>
                        </section>

                        {features.digitalEnvelopeEnabled && behavior?.gift?.toggleEnabled !== false ? (
                            <section id="section-gift" className="bn-section bn-gift">
                                <article className="bn-gift__card" data-aos="fade-up">
                                    <h2 className="bn-title-script bn-gift__title" data-aos="fade-down">Wedding Gift</h2>
                                    <p className="bn-gift__desc" data-aos="fade-up" data-aos-delay="100">
                                        Doa restu Anda sangat berarti bagi kami. Bila ingin berbagi tanda kasih, Anda dapat mengirimkan hadiah secara cashless.
                                    </p>
                                    <button
                                        type="button"
                                        className="bn-btn-pill"
                                        data-aos="zoom-in"
                                        data-aos-delay="180"
                                        onClick={() => setGiftOpen((prev) => !prev)}
                                    >
                                        <i className="bn-fas bn-fa-long-arrow-alt-right" />
                                        <span>{giftOpen ? "Tutup Detail" : "Klik Disini"}</span>
                                    </button>

                                    {giftOpen ? (
                                        <div className="bn-gift__panel">
                                            {bankList.map((bank, index) => {
                                                const key = String(bank.bank || "").toLowerCase();
                                                const logo = key.includes("dana") ? LogoDana : LogoBca;
                                                const readable = bank.account?.replace(/(\d{4})(?=\d)/g, "$1 ") || "-";
                                                return (
                                                    <div className="bn-bank-card" key={`${bank.bank}-${bank.account}-${index}`} data-aos="fade-up" data-aos-delay={index * 90}>
                                                        <div className="bn-bank-card__logo">
                                                            <img src={logo} alt={`Logo ${bank.bank}`} loading="lazy" />
                                                        </div>
                                                        <div className="bn-bank-card__chip">
                                                            {!key.includes("dana") ? <img src={ChipAtm} alt="Chip ATM" loading="lazy" /> : <div style={{ height: 24 }} />}
                                                        </div>
                                                        <p className="bn-bank-card__number">{readable}</p>
                                                        <p className="bn-bank-card__holder">{bank.name || couple.groom.nickName}</p>
                                                        <button
                                                            type="button"
                                                            className={`bn-copy-btn ${copiedAccount === bank.account ? "is-copied" : ""}`}
                                                            onClick={() => handleCopy(bank.account)}
                                                        >
                                                            <i className="bn-far bn-fa-copy" />
                                                            {copiedAccount === bank.account ? "Berhasil disalin" : "Copy"}
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            <div className="bn-gift-address" data-aos="fade-up" data-aos-delay="220">
                                                <div className="bn-gift-address__icon">
                                                    <i className="bn-fas bn-fa-gift" />
                                                </div>
                                                <h3 className="bn-gift-address__title">Kirim Hadiah</h3>
                                                <div className="bn-gift-address__info">
                                                    <p>Nama Penerima: {gift?.shipping?.recipient || couple.groom.nameFull}</p>
                                                    <p>No. HP: {gift?.shipping?.phone || "-"}</p>
                                                    <p>{gift?.shipping?.address || "-"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </article>
                            </section>
                        ) : null}

                        {features.rsvpEnabled && behavior?.wishes?.enabled !== false ? (
                            <section id="section-rsvp" className="bn-section bn-wishes">
                                <article className="bn-wishes__card" data-aos="fade-up">
                                    <h2 className="bn-title-script bn-wishes__title" data-aos="fade-down">
                                        {mergedData?.wishes?.title || "Wishes"}
                                    </h2>
                                    <p className="bn-wishes__desc" data-aos="fade-up">
                                        Berikan ucapan, harapan, dan doa untuk kedua mempelai.
                                    </p>

                                    <div className="bn-wishes__attendance">
                                        <div className="bn-wishes__attendance-card bn-wishes__attendance-card--hadir" data-aos="fade-up" data-aos-delay="40">
                                            <strong>{attendanceSummary.hadir}</strong>
                                            <span>Hadir</span>
                                        </div>
                                        <div className="bn-wishes__attendance-card bn-wishes__attendance-card--tidak" data-aos="fade-up" data-aos-delay="110">
                                            <strong>{attendanceSummary.tidakHadir}</strong>
                                            <span>Tidak Hadir</span>
                                        </div>
                                    </div>

                                    <form className="bn-wishes__form" onSubmit={handleWishSubmit}>
                                        <input
                                            className="bn-wishes__field"
                                            type="text"
                                            placeholder="Nama"
                                            value={wishForm.author}
                                            onChange={(inputEvent) => setWishForm((prev) => ({ ...prev, author: inputEvent.target.value }))}
                                            data-aos="fade-up"
                                            data-aos-delay="120"
                                            required
                                        />
                                        <textarea
                                            className="bn-wishes__field bn-wishes__textarea"
                                            placeholder="Ucapan"
                                            value={wishForm.comment}
                                            onChange={(inputEvent) => setWishForm((prev) => ({ ...prev, comment: inputEvent.target.value }))}
                                            data-aos="fade-up"
                                            data-aos-delay="170"
                                            required
                                        />
                                        <select
                                            className="bn-wishes__field"
                                            value={wishForm.attendance}
                                            onChange={(inputEvent) => setWishForm((prev) => ({ ...prev, attendance: inputEvent.target.value }))}
                                            data-aos="fade-up"
                                            data-aos-delay="210"
                                            required
                                        >
                                            <option value="" disabled>
                                                Konfirmasi Kehadiran
                                            </option>
                                            <option value="Hadir">Hadir</option>
                                            <option value="Tidak Hadir">Tidak Hadir</option>
                                        </select>
                                        <button className="bn-wishes__submit" type="submit" data-aos="zoom-in" data-aos-delay="240">
                                            Kirim
                                        </button>
                                    </form>

                                    <ul className="bn-wishes__comments">
                                        {wishes.map((wish, index) => (
                                            <li key={`${wish.author}-${wish.createdAt}-${index}`} className="bn-wishes__comment">
                                                <p className="bn-wishes__comment-name">{wish.author}</p>
                                                <p className="bn-wishes__comment-text">{wish.comment}</p>
                                                <p className="bn-wishes__comment-meta">
                                                    <span>{wish.attendance}</span>
                                                    <span>{wish.createdAt}</span>
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </section>
                        ) : null}

                        <section id="section-closing" className="bn-closing">
                            <div
                                className="bn-closing__image"
                                style={{ backgroundImage: `url(${resolveLocalAsset(timelineItems[2]?.photo, StoryPhoto)})` }}
                            >
                                <h2 className="bn-closing__thanks" data-aos="fade-down">Terimakasih</h2>
                            </div>
                            <div className="bn-closing__message" style={{ backgroundImage: `url(${BgPatternLight})` }}>
                                <p className="bn-closing__text" data-aos="fade-up">
                                    {copy.closingText}
                                </p>
                                <h3 className="bn-closing__names" data-aos="zoom-in" data-aos-delay="120">
                                    {couple.groom.nickName} &amp; {couple.bride.nickName}
                                </h3>
                            </div>
                        </section>

                        <footer className="bn-footer">
                            <p className="bn-footer__credit">
                                Support with
                                <img src={HeartEmoji} alt="heart" />
                                by ikatancinta.in
                            </p>
                        </footer>

                        <nav className="bn-bottom-nav" aria-label="Navigasi cepat undangan">
                            {[
                                ["hero", "home", "Home"],
                                ["events", "event", "Acara"],
                                ["gallery", "photo_library", "Galeri"],
                                ...(features.rsvpEnabled && behavior?.wishes?.enabled !== false
                                    ? [["rsvp", "chat", "Wishes"]]
                                    : features.digitalEnvelopeEnabled && behavior?.gift?.toggleEnabled !== false
                                        ? [["gift", "redeem", "Gift"]]
                                        : []),
                                ["closing", "favorite", "Akhir"],
                            ].map(([id, icon, label]) => navItem(id, icon, label))}
                        </nav>

                        {behavior?.audio?.enabled !== false ? (
                            <div className="bn-audio-player">
                                <button
                                    type="button"
                                    className={`bn-audio-player__btn ${audioPlaying ? "is-playing" : ""}`}
                                    onClick={toggleAudio}
                                    aria-label={audioPlaying ? "Pause musik" : "Play musik"}
                                >
                                    <i className={audioPlaying ? "bn-fas bn-fa-compact-disc" : "bn-fas bn-fa-play-circle"} />
                                </button>
                                <audio ref={audioRef} loop={audio?.loop !== false} preload="auto">
                                    <source src={resolveLocalAsset(audio?.src, BackgroundMusic)} type="audio/mp3" />
                                </audio>
                            </div>
                        ) : null}
                    </main>
                )}
            </div>

            {lightboxIndex >= 0 && behavior?.lightbox?.enabled !== false ? (
                <div className="bn-lightbox" onClick={() => setLightboxIndex(-1)} role="presentation">
                    <button type="button" className="bn-lightbox__close" onClick={() => setLightboxIndex(-1)} aria-label="Tutup galeri">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <img className="bn-lightbox__image" src={galleryItems[lightboxIndex]} alt="Preview galeri" />
                </div>
            ) : null}
        </div>
    );
}
