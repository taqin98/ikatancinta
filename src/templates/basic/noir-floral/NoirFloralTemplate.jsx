import { useEffect, useMemo, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { aosPreset, tokens } from "./tokens";
import "./noir-floral.css";

import CoverPhoto from "./assets/images/24GB240-5-2-5e7ae80a.jpg";
import HeroPhoto from "./assets/images/24GB240-2-c9c24109.jpg";
import BridePhoto from "./assets/images/24GB240-6-389abc34.jpg";
import GroomPhoto from "./assets/images/24GB240-3-f234e87c.jpg";
import StoryPhoto from "./assets/images/TEMA-05-2-6c5f3dc1.webp";
import Gallery1 from "./assets/images/24GB240-1-1b86b899.jpg";
import Gallery2 from "./assets/images/24GB240-2-c9c24109.jpg";
import Gallery3 from "./assets/images/24GB240-3-f234e87c.jpg";
import Gallery4 from "./assets/images/24GB240-4-a9a4d304.jpg";
import Gallery5 from "./assets/images/24GB240-5-2-5e7ae80a.jpg";
import Gallery6 from "./assets/images/24GB240-6-389abc34.jpg";
import Gallery7 from "./assets/images/24GB240-7-4978d77a.jpg";
import OverlayFloral from "./assets/images/tema-5-bunga-1024x843-1-2e956483.webp";
import Floral1 from "./assets/images/artboard-flowers-1-e1724206634661-df68913b.webp";
import Floral2 from "./assets/images/artboard-flowers-2-e1724206648670-dff0bc79.webp";
import Floral4 from "./assets/images/artboard-flowers-4-e1724206677813-d10263c0.webp";
import Floral5 from "./assets/images/artboard-flowers-5-e1724206794690-bab2e2be.webp";
import Floral6 from "./assets/images/artboard-flowers-6-d56d098c.webp";
import Floral7 from "./assets/images/artboard-flowers-7-8404b49d.webp";
import Floral8 from "./assets/images/artboard-flowers-8-4506546a.webp";
import Floral9 from "./assets/images/artboard-flowers-9-e1724210841336-4698450a.webp";
import Floral11 from "./assets/images/artboard-flowers-11-602c6b86.webp";
import Floral13 from "./assets/images/artboard-flowers-13-e6b15aa6.webp";
import Floral14 from "./assets/images/artboard-flowers-14-e1724225506979-7543ec16.webp";
import Floral15 from "./assets/images/artboard-flowers-15-e1724225573473-b3e290a5.webp";
import LogoBca from "./assets/images/BCA_logo_Bank_Central_Asia-1-3-5-1-1-ba78b960.png";
import LogoDana from "./assets/images/1200px-Logo_dana_blue.svg-1-1-1-1-2-3e51f46d.png";
import ChipAtm from "./assets/images/chip-atm-1-2-4-1-1-a4baaddd.png";
import HeartEmoji from "./assets/images/2764-7c736eda.svg";
import BackgroundMusic from "./assets/audio/Diskoria-laleilmanino-BCL-Badai-Telah-Berlalu-Official-Music-Video-3.41-640b1fd8.mp3";

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

function formatEventDate(dateText) {
    if (!dateText) return "-";
    return dateText;
}

function toInstagramUrl(handle) {
    if (!handle) return "";
    return `https://instagram.com/${String(handle).replace(/^@/, "")}`;
}

function downloadICS(data) {
    const eventStart = data?.event?.dateISO || "";
    const cleanDate = eventStart.replace(/[-:]/g, "").slice(0, 15);
    if (!cleanDate) return;

    const title = `${data?.couple?.groom?.nickName || ""} & ${data?.couple?.bride?.nickName || ""}`;
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Ikatan Cinta//Noir Floral//EN",
        "BEGIN:VEVENT",
        `SUMMARY:Pernikahan ${title}`,
        `DTSTART:${cleanDate}`,
        `DESCRIPTION:${data?.copy?.openingText || ""}`,
        `LOCATION:${data?.event?.akad?.address || ""}`,
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

function EventCard({ title, detail, delay = 0 }) {
    if (!detail) return null;

    return (
        <article className="nf-event-card" data-aos={aosPreset("card", delay).aos} data-aos-delay={aosPreset("card", delay).delay}>
            <h3 className="nf-script nf-event-card__title">{title}</h3>
            <p className="nf-event-card__date">{formatEventDate(detail.date)}</p>
            <p className="nf-event-card__time">Pukul {detail.time}</p>
            <p className="nf-event-card__address">{detail.address}</p>
            {detail.mapsUrl ? (
                <a className="nf-btn-pill" href={detail.mapsUrl} target="_blank" rel="noreferrer">
                    <i className="nf-fas nf-fa-map-marker-alt" />
                    <span>Lihat Lokasi</span>
                </a>
            ) : null}
        </article>
    );
}

const FALLBACK_GALLERY = [Gallery1, Gallery2, Gallery3, Gallery4, Gallery5, Gallery6, Gallery7];

const FALLBACK_WISHES = [
    {
        author: "key",
        comment: "enjoy your new life",
        attendance: "Hadir",
        createdAt: "11 bulan, 2 minggu lalu",
    },
    {
        author: "D",
        comment: "Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah.",
        attendance: "Tidak Hadir",
        createdAt: "10 bulan, 1 minggu lalu",
    },
];

export default function NoirFloralTemplate() {
    const { data, loading } = useInvitationData("noir-floral");

    const [opened, setOpened] = useState(false);
    const [gateClosing, setGateClosing] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [giftOpen, setGiftOpen] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState("");
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [wishes, setWishes] = useState(FALLBACK_WISHES);
    const [wishForm, setWishForm] = useState({ author: "", comment: "", attendance: "" });
    const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00", ended: false });

    const audioRef = useRef(null);
    const wasPlayingOnHideRef = useRef(false);

    const guest = data?.guest;
    const couple = data?.couple;
    const event = data?.event;
    const copy = data?.copy;
    const lovestory = data?.lovestory;
    const features = data?.features || {};

    const galleryItems = useMemo(() => {
        if (Array.isArray(data?.gallery) && data.gallery.length > 0) {
            return data.gallery;
        }
        return FALLBACK_GALLERY;
    }, [data?.gallery]);

    const timelineItems = useMemo(() => {
        if (Array.isArray(lovestory) && lovestory.length > 0) {
            return lovestory.slice(0, 3);
        }
        return [
            {
                title: "Awal Cerita",
                date: "11-11-2017",
                text: "Berawal dari teman kuliah bersama-sama memperjuangkan S1 Teknik Sipil, bertemu pada tahun 2016 hingga selalu bertemu untuk sesekali makan bersama, lalu menjalin hubungan pacaran 11-11-2017.",
            },
            {
                title: "Lamaran",
                date: "23-03-2019",
                text: "Pada tanggal 23-03-2019 kami mengikat diri pada pertunangan dan pada tanggal 29-10-2020 kami mengadakan akad nikah. Alhamdulillah perjalanan ini sampai pada akhirnya.",
            },
            {
                title: "Resepsi Pernikahan",
                date: "30-03-2026",
                text: "Kami bisa melakukan acara resepsi yang insyaAllah diadakan pada Minggu, 30 Maret 2026.",
            },
        ];
    }, [lovestory]);

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

    const bankList = features?.digitalEnvelopeInfo?.bankList || [];

    useEffect(() => {
        AOS.init({
            duration: tokens.aos.duration,
            offset: tokens.aos.offset,
            easing: tokens.aos.easing,
            once: tokens.aos.once,
            mirror: tokens.aos.mirror,
        });
    }, []);

    useEffect(() => {
        if (!opened) return;
        const timer = setTimeout(() => AOS.refresh(), 320);
        return () => clearTimeout(timer);
    }, [opened, giftOpen]);

    useEffect(() => {
        if (!opened || !event?.dateISO) return;
        const update = () => setCountdown(formatCountdown(event.dateISO));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [opened, event?.dateISO]);

    useEffect(() => {
        if (opened) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [opened]);

    useEffect(() => {
        const handleVisibility = () => {
            const audio = audioRef.current;
            if (!audio) return;

            if (document.visibilityState === "hidden") {
                wasPlayingOnHideRef.current = !audio.paused;
                audio.pause();
                setAudioPlaying(false);
                return;
            }

            if (document.visibilityState === "visible" && wasPlayingOnHideRef.current) {
                audio
                    .play()
                    .then(() => setAudioPlaying(true))
                    .catch(() => setAudioPlaying(false));
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    useEffect(() => {
        const handleEscape = (keyboardEvent) => {
            if (keyboardEvent.key === "Escape") {
                setLightboxIndex(-1);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, []);

    async function playAudio() {
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
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            try {
                await audio.play();
                setAudioPlaying(true);
            } catch {
                setAudioPlaying(false);
            }
            return;
        }

        audio.pause();
        setAudioPlaying(false);
    }

    function handleOpenInvitation() {
        if (opened || gateClosing) return;
        setOpened(true);
        setGateClosing(true);
        setTimeout(() => setGateClosing(false), 900);
        playAudio();
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

    function handleWishSubmit(submitEvent) {
        submitEvent.preventDefault();

        if (!wishForm.author.trim() || !wishForm.comment.trim() || !wishForm.attendance) return;

        const createdAt = new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date());

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

    if (loading || !guest || !couple || !event || !copy) {
        return (
            <div className="nf-template" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                Memuat undangan...
            </div>
        );
    }

    return (
        <div className="nf-template">
            <div className="nf-shell">
                {(!opened || gateClosing) && (
                    <section className={`nf-cover ${gateClosing ? "nf-cover--closing" : ""}`}>
                        <div className="nf-cover__bg" style={{ backgroundImage: `url(${couple.heroPhoto || CoverPhoto})` }}>
                            <div className="nf-cover__fog" />
                            <p className="nf-cover__eyebrow" data-aos={aosPreset("heading").aos}>
                                THE WEDDING OF
                            </p>
                            <h1 className="nf-cover__names" data-aos={aosPreset("title").aos}>
                                {couple.bride.nickName} &amp; {couple.groom.nickName}
                            </h1>
                            <p className="nf-cover__dear">{guest.greetingLabel || "Dear,"}</p>
                            <p className="nf-cover__guest">{guest.name}</p>
                            <button type="button" className="nf-btn-pill nf-cover__button" onClick={handleOpenInvitation}>
                                <span className="material-symbols-outlined">mail</span>
                                <span>Buka Undangan</span>
                            </button>
                        </div>
                    </section>
                )}

                {opened ? (
                    <main className="nf-main">
                        <section id="section-hero" className="nf-section nf-hero">
                            <div className="nf-hero__photo-wrap" data-aos={aosPreset("photo").aos}>
                                <img src={couple.heroPhoto || CoverPhoto} alt={`Foto ${couple.bride.nickName} dan ${couple.groom.nickName}`} className="nf-hero__photo" />
                            </div>
                            <div className="nf-hero__content" data-aos={aosPreset("title").aos}>
                                <p className="nf-hero__label">The Wedding Of</p>
                                <h2 className="nf-script nf-hero__names">
                                    {couple.bride.nickName} &amp; {couple.groom.nickName}
                                </h2>
                                <p className="nf-hero__desc">We invite you to celebrate our wedding</p>
                                <p className="nf-hero__date">{formatEventDate(event.akad.date)}</p>
                                {features?.saveTheDateEnabled ? (
                                    <button type="button" className="nf-btn-pill" onClick={() => downloadICS(data)}>
                                        Save The Date
                                    </button>
                                ) : null}
                            </div>
                            <img src={Floral13} alt="" aria-hidden="true" className="nf-ornament nf-ornament--hero-bottom" data-aos={aosPreset("ornament").aos} />
                            <img src={Floral7} alt="" aria-hidden="true" className="nf-ornament nf-ornament--hero-right" data-aos={aosPreset("ornament").aos} />
                        </section>

                        <section id="section-opening" className="nf-section nf-opening">
                            <h2 className="nf-display" data-aos={aosPreset("heading").aos}>
                                {copy.openingGreeting || "We're Getting Married"}
                            </h2>
                            <div className="nf-opening__curve">
                                <p className="nf-script nf-opening__salam" data-aos={aosPreset("title").aos}>
                                    Assalamu&apos;alaikum Wr. Wb.
                                </p>
                                <p className="nf-opening__text" data-aos={aosPreset("card").aos} data-aos-delay={aosPreset("card").delay}>
                                    {copy.openingText}
                                </p>
                                <div className="nf-opening__frame" data-aos={aosPreset("photo").aos}>
                                    <img src={HeroPhoto} alt={couple.bride.nameFull} />
                                    <img src={Floral14} alt="" aria-hidden="true" className="nf-opening__frame-ornament" />
                                </div>
                            </div>
                            <img src={Floral6} alt="" aria-hidden="true" className="nf-ornament nf-ornament--opening-left" data-aos={aosPreset("ornament").aos} />
                            <img src={Floral4} alt="" aria-hidden="true" className="nf-ornament nf-ornament--opening-right" data-aos={aosPreset("ornament").aos} />
                        </section>

                        <section id="section-bride" className="nf-section nf-profile nf-profile--dark">
                            <p className="nf-profile__amp">&amp;</p>
                            <h3 className="nf-script nf-profile__name" data-aos={aosPreset("title").aos}>
                                {couple.bride.nameFull}
                            </h3>
                            <p className="nf-profile__parents" data-aos={aosPreset("card").aos}>
                                {couple.bride.parentInfo}
                            </p>
                            {couple.bride.instagram ? (
                                <a
                                    className="nf-social-circle"
                                    href={toInstagramUrl(couple.bride.instagram)}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Instagram mempelai wanita"
                                >
                                    <i className="nf-fab nf-fa-instagram" />
                                </a>
                            ) : null}
                            <div className="nf-profile__photo-wrap" data-aos={aosPreset("photo").aos}>
                                <img src={couple.bride.photo || BridePhoto} alt={couple.bride.nameFull} className="nf-profile__photo" />
                                <img src={OverlayFloral} alt="" aria-hidden="true" className="nf-profile__overlay" />
                            </div>
                            <img src={Floral5} alt="" aria-hidden="true" className="nf-ornament nf-ornament--profile-left" data-aos={aosPreset("ornament").aos} />
                        </section>

                        <section id="section-groom" className="nf-section nf-profile nf-profile--dark nf-profile--second">
                            <h3 className="nf-script nf-profile__name" data-aos={aosPreset("title").aos}>
                                {couple.groom.nameFull}
                            </h3>
                            <p className="nf-profile__parents" data-aos={aosPreset("card").aos}>
                                {couple.groom.parentInfo}
                            </p>
                            {couple.groom.instagram ? (
                                <a
                                    className="nf-social-circle"
                                    href={toInstagramUrl(couple.groom.instagram)}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Instagram mempelai pria"
                                >
                                    <i className="nf-fab nf-fa-instagram" />
                                </a>
                            ) : null}
                            <div className="nf-profile__photo-wrap" data-aos={aosPreset("photo").aos}>
                                <img src={couple.groom.photo || GroomPhoto} alt={couple.groom.nameFull} className="nf-profile__photo" />
                                <img src={OverlayFloral} alt="" aria-hidden="true" className="nf-profile__overlay" />
                            </div>
                            <img src={Floral15} alt="" aria-hidden="true" className="nf-ornament nf-ornament--section-bottom" data-aos={aosPreset("ornament").aos} />
                        </section>

                        <section id="section-save-date" className="nf-section nf-save-date">
                            <h3 className="nf-display" data-aos={aosPreset("heading").aos}>
                                Save The Date
                            </h3>
                            <p data-aos={aosPreset("card").aos}>
                                Dan Kami bersyukur, dipertemukan Allah diwaktu terbaik, Kini kami menanti hari istimewa kami.
                            </p>
                        </section>

                        {features?.countdownEnabled ? (
                            <section id="section-countdown" className="nf-section nf-countdown">
                                <h3 className="nf-display" data-aos={aosPreset("heading").aos}>
                                    Countdown
                                </h3>
                                <div className="nf-countdown__grid">
                                    {[
                                        { label: "Hari", value: countdown.days },
                                        { label: "Jam", value: countdown.hours },
                                        { label: "Menit", value: countdown.minutes },
                                        { label: "Detik", value: countdown.seconds },
                                    ].map((item, index) => (
                                        <article key={item.label} className="nf-countdown__item" data-aos={aosPreset("stagger", index).aos} data-aos-delay={aosPreset("stagger", index).delay}>
                                            <strong>{item.value}</strong>
                                            <span>{item.label}</span>
                                        </article>
                                    ))}
                                </div>
                                {countdown.ended ? <p className="nf-countdown__ended">Acara sedang berlangsung.</p> : null}
                            </section>
                        ) : null}

                        {features?.livestreamEnabled && event?.livestream ? (
                            <section id="section-live" className="nf-section nf-live">
                                <img src={Floral6} alt="" aria-hidden="true" className="nf-ornament nf-ornament--live-tl" data-aos={aosPreset("ornament").aos} />
                                <h3 className="nf-script nf-live__title" data-aos={aosPreset("heading").aos}>
                                    Live Streaming
                                </h3>
                                <p className="nf-live__text" data-aos={aosPreset("card").aos}>
                                    Kami mengundang Bapak/Ibu/Saudara/i untuk menyaksikan Pernikahan kami secara virtual yang disiarkan langsung melalui sosial media.
                                </p>
                                <i className="nf-fab nf-fa-instagram nf-live__icon" aria-hidden="true" />
                                <p className="nf-live__meta">{event.livestream.date}</p>
                                <p className="nf-live__meta">Pukul {event.livestream.time}</p>
                                <a className="nf-btn-pill" href={event.livestream.url} target="_blank" rel="noreferrer" data-aos="zoom-in" data-aos-delay="180">
                                    <i className="nf-fab nf-fa-instagram" />
                                    <span>Click Here</span>
                                </a>
                            </section>
                        ) : null}

                        <section id="section-events" className="nf-section nf-events">
                            <img src={Floral1} alt="" aria-hidden="true" className="nf-ornament nf-ornament--events-tl" data-aos={aosPreset("ornament").aos} />
                            <EventCard title="Akad Nikah" detail={event.akad} delay={0} />
                            <img src={Floral2} alt="" aria-hidden="true" className="nf-ornament nf-ornament--events-mid" data-aos={aosPreset("ornament").aos} />
                            <EventCard title="Resepsi" detail={event.resepsi} delay={1} />
                            <img src={Floral13} alt="" aria-hidden="true" className="nf-ornament nf-ornament--events-br" data-aos={aosPreset("ornament").aos} />
                        </section>

                        <section id="section-gallery" className="nf-section nf-gallery">
                            <h3 className="nf-display" data-aos={aosPreset("heading").aos}>
                                Gallery
                            </h3>
                            <p className="nf-gallery__quote" data-aos={aosPreset("card").aos}>
                                {copy.quote}
                                <br />- {copy.quoteSource} -
                            </p>
                            <div className="nf-gallery__grid">
                                {galleryItems.map((image, index) => (
                                    <button
                                        type="button"
                                        className="nf-gallery__item"
                                        key={`${image}-${index}`}
                                        onClick={() => setLightboxIndex(index)}
                                        aria-label={`Buka foto galeri ${index + 1}`}
                                        data-aos={aosPreset("stagger", index).aos}
                                        data-aos-delay={aosPreset("stagger", index).delay}
                                    >
                                        <img src={image} alt={`Galeri ${index + 1}`} loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section id="section-story-hero" className="nf-section nf-story-hero">
                            <img src={Floral6} alt="" aria-hidden="true" className="nf-ornament nf-ornament--story-tl" data-aos={aosPreset("ornament").aos} />
                            <h3 className="nf-script nf-story-hero__title" data-aos={aosPreset("heading").aos}>
                                Perjalanan Cerita Kami
                            </h3>
                            <div className="nf-story-hero__photo" data-aos={aosPreset("photo").aos}>
                                <img src={timelineItems[0]?.photo || StoryPhoto} alt="Perjalanan cinta" />
                            </div>
                        </section>

                        <section id="section-story" className="nf-section nf-story">
                            <article className="nf-story__card" data-aos={aosPreset("card").aos}>
                                {timelineItems.map((item, index) => (
                                    <div className="nf-story__item" key={`${item.title}-${index}`}>
                                        <h4 className="nf-script nf-story__item-title">{item.title}</h4>
                                        <div className="nf-story__divider" />
                                        <p className="nf-story__item-text">{item.text}</p>
                                    </div>
                                ))}
                            </article>
                        </section>

                        {features?.digitalEnvelopeEnabled ? (
                            <section id="section-gift" className="nf-section nf-gift">
                                <h3 className="nf-script nf-gift__title" data-aos={aosPreset("heading").aos}>
                                    Amplop Digital
                                </h3>
                                <p className="nf-gift__desc" data-aos={aosPreset("card").aos}>
                                    Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara cashless.
                                </p>
                                <button
                                    type="button"
                                    className="nf-btn-pill"
                                    onClick={() => setGiftOpen((prev) => !prev)}
                                    data-aos="zoom-in"
                                >
                                    <i className="nf-fas nf-fa-gift" />
                                    <span>{giftOpen ? "Tutup Hadiah" : "Kirim Hadiah"}</span>
                                </button>

                                {giftOpen ? (
                                    <div className="nf-gift__panel">
                                        {bankList.map((bank, index) => {
                                            const isDana = String(bank.bank || "").toLowerCase().includes("dana");
                                            const logo = isDana ? LogoDana : LogoBca;
                                            const accountReadable = bank.account?.replace(/(\d{4})(?=\d)/g, "$1 ") || "-";
                                            return (
                                                <article className="nf-bank-card" key={`${bank.bank}-${bank.account}-${index}`} data-aos={aosPreset("stagger", index).aos} data-aos-delay={aosPreset("stagger", index).delay}>
                                                    <div className="nf-bank-card__top">
                                                        <img src={logo} alt={`Logo ${bank.bank}`} />
                                                        {!isDana ? <img src={ChipAtm} alt="Chip ATM" className="nf-bank-card__chip" /> : null}
                                                    </div>
                                                    <p className="nf-bank-card__number">{accountReadable}</p>
                                                    <p className="nf-bank-card__name">{bank.name}</p>
                                                    <button
                                                        type="button"
                                                        className={`nf-copy-btn ${copiedAccount === bank.account ? "is-copied" : ""}`}
                                                        onClick={() => handleCopy(bank.account)}
                                                    >
                                                        <i className="nf-far nf-fa-copy" />
                                                        <span>{copiedAccount === bank.account ? "Berhasil disalin" : "Copy"}</span>
                                                    </button>
                                                </article>
                                            );
                                        })}
                                        <div className="nf-gift__address" data-aos={aosPreset("card", 2).aos} data-aos-delay={aosPreset("card", 2).delay}>
                                            <p>
                                                Alamat kirim hadiah: <strong>Ds Pagu Kec. Wates Kab. Kediri</strong>
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                <img src={Floral15} alt="" aria-hidden="true" className="nf-ornament nf-ornament--gift-bottom" data-aos={aosPreset("ornament").aos} />
                            </section>
                        ) : null}

                        {features?.rsvpEnabled ? (
                            <section id="section-rsvp" className="nf-section nf-rsvp">
                                <h3 className="nf-display" data-aos={aosPreset("heading").aos}>
                                    Ucapkan Sesuatu
                                </h3>
                                <p className="nf-rsvp__sub" data-aos={aosPreset("card").aos}>
                                    Berikan Ucapan &amp; Doa Restu
                                </p>

                                <div className="nf-rsvp__counter">
                                    <article className="nf-rsvp__counter-card nf-rsvp__counter-card--hadir" data-aos={aosPreset("stagger", 0).aos} data-aos-delay={aosPreset("stagger", 0).delay}>
                                        <strong>{attendanceSummary.hadir}</strong>
                                        <span>Hadir</span>
                                    </article>
                                    <article className="nf-rsvp__counter-card nf-rsvp__counter-card--tidak" data-aos={aosPreset("stagger", 1).aos} data-aos-delay={aosPreset("stagger", 1).delay}>
                                        <strong>{attendanceSummary.tidakHadir}</strong>
                                        <span>Tidak Hadir</span>
                                    </article>
                                </div>

                                <form className="nf-rsvp__form" onSubmit={handleWishSubmit}>
                                    <input
                                        className="nf-rsvp__field"
                                        type="text"
                                        placeholder="Nama"
                                        value={wishForm.author}
                                        onChange={(inputEvent) => setWishForm((prev) => ({ ...prev, author: inputEvent.target.value }))}
                                        required
                                    />
                                    <small className="nf-rsvp__note">Mohon maaf! Khusus untuk tamu undangan</small>
                                    <textarea
                                        className="nf-rsvp__field nf-rsvp__textarea"
                                        placeholder="Ucapan"
                                        value={wishForm.comment}
                                        onChange={(inputEvent) => setWishForm((prev) => ({ ...prev, comment: inputEvent.target.value }))}
                                        required
                                    />
                                    <select
                                        className="nf-rsvp__field"
                                        value={wishForm.attendance}
                                        onChange={(inputEvent) => setWishForm((prev) => ({ ...prev, attendance: inputEvent.target.value }))}
                                        required
                                    >
                                        <option value="" disabled>
                                            Konfirmasi Kehadiran
                                        </option>
                                        <option value="Hadir">Hadir</option>
                                        <option value="Tidak Hadir">Tidak Hadir</option>
                                    </select>
                                    <button type="submit" className="nf-rsvp__submit">
                                        Kirim
                                    </button>
                                </form>

                                <ul className="nf-rsvp__comments">
                                    {wishes.map((wish, index) => (
                                        <li key={`${wish.author}-${wish.createdAt}-${index}`} className="nf-rsvp__comment">
                                            <p className="nf-rsvp__comment-name">
                                                {wish.author}
                                                {wish.attendance === "Hadir" ? <i className="nf-fas nf-fa-check-circle" /> : null}
                                            </p>
                                            <p className="nf-rsvp__comment-text">{wish.comment}</p>
                                            <p className="nf-rsvp__comment-meta">
                                                <i className="nf-fas nf-fa-clock" /> {wish.createdAt}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}

                        <section id="section-closing" className="nf-section nf-closing">
                            <div className="nf-closing__photo" data-aos={aosPreset("photo").aos}>
                                <img src={couple.heroPhoto || CoverPhoto} alt={`Foto ${couple.bride.nickName} dan ${couple.groom.nickName}`} />
                                <img src={OverlayFloral} alt="" aria-hidden="true" className="nf-closing__overlay" />
                            </div>
                            <p className="nf-closing__text" data-aos={aosPreset("card").aos}>
                                {copy.closingText}
                            </p>
                            <h3 className="nf-script nf-closing__salam" data-aos={aosPreset("title").aos}>
                                Wassalamu&apos;alaikum Wr. Wb.
                            </h3>
                            <h2 className="nf-script nf-closing__names" data-aos="zoom-in" data-aos-delay="120">
                                {couple.bride.nickName} &amp; {couple.groom.nickName}
                            </h2>
                            <img src={Floral15} alt="" aria-hidden="true" className="nf-ornament nf-ornament--closing-bottom" data-aos={aosPreset("ornament").aos} />
                        </section>

                        <footer className="nf-footer">
                            <p>
                                Made with <img src={HeartEmoji} alt="heart" /> by Rumahundangan.id
                            </p>
                        </footer>

                        <button type="button" className={`nf-audio ${audioPlaying ? "is-playing" : ""}`} onClick={toggleAudio} aria-label={audioPlaying ? "Pause musik" : "Putar musik"}>
                            <i className={audioPlaying ? "nf-fas nf-fa-compact-disc" : "nf-fas nf-fa-play-circle"} />
                        </button>

                        <audio ref={audioRef} loop preload="auto">
                            <source src={BackgroundMusic} type="audio/mp3" />
                        </audio>
                    </main>
                ) : null}
            </div>

            {lightboxIndex >= 0 ? (
                <div className="nf-lightbox" role="presentation" onClick={() => setLightboxIndex(-1)}>
                    <button
                        type="button"
                        className="nf-lightbox__close"
                        onClick={() => setLightboxIndex(-1)}
                        aria-label="Tutup galeri"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <img className="nf-lightbox__image" src={galleryItems[lightboxIndex]} alt="Preview galeri" />
                </div>
            ) : null}

            <img src={Floral8} alt="" aria-hidden="true" className="nf-global-ornament nf-global-ornament--tr" />
            <img src={Floral9} alt="" aria-hidden="true" className="nf-global-ornament nf-global-ornament--bl" />
            <img src={Floral11} alt="" aria-hidden="true" className="nf-global-ornament nf-global-ornament--br" />
        </div>
    );
}
