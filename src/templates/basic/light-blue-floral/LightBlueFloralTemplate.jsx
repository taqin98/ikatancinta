import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { tokens } from "./tokens";
import { useInvitationData } from "../../../hooks/useInvitationData";

import CoverGate from "./components/CoverGate";
import SectionTitle from "./components/SectionTitle";
import FloralDivider from "./components/FloralDivider";
import CountdownTimer from "./components/CountdownTimer";
import CardEvent from "./components/CardEvent";
import CoupleCard from "./components/CoupleCard";
import RSVPForm from "./components/RSVPForm";
import GalleryGrid from "./components/GalleryGrid";
import LoveStoryItem from "./components/LoveStoryItem";
import GiftEnvelope from "./components/GiftEnvelope";
import LiveStreaming from "./components/LiveStreaming";

// Real floral decoration assets
const DEC = {
    topLeft: new URL("./assets/decorations/flower-top-left.webp", import.meta.url).href,
    topRight: new URL("./assets/decorations/flower-top-right.webp", import.meta.url).href,
    bottomLeft: new URL("./assets/decorations/flower-bottom-left.webp", import.meta.url).href,
    bottom1: new URL("./assets/decorations/flower-bottom-1.webp", import.meta.url).href,
    bottom2: new URL("./assets/decorations/flower-bottom-2.webp", import.meta.url).href,
    frameLeft: new URL("./assets/decorations/flower-frame-left.webp", import.meta.url).href,
    frameRight: new URL("./assets/decorations/flower-frame-right.webp", import.meta.url).href,
    centerOverlay: new URL("./assets/decorations/flower-center-overlay.png", import.meta.url).href,
    corner1: new URL("./assets/decorations/flower-corner-1.webp", import.meta.url).href,
    corner2: new URL("./assets/decorations/flower-corner-2.webp", import.meta.url).href,
    corner3: new URL("./assets/decorations/flower-corner-3.webp", import.meta.url).href,
    corner4: new URL("./assets/decorations/flower-corner-4.webp", import.meta.url).href,
    corner5: new URL("./assets/decorations/flower-corner-5.webp", import.meta.url).href,
};

// Save The Date ICS download
function downloadICS(data) {
    const { akad } = data.event;
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//IkatanCinta//LightBlueFloral//EN",
        "BEGIN:VEVENT",
        `SUMMARY:Pernikahan ${data.couple.groom.nickName} & ${data.couple.bride.nickName}`,
        `DTSTART:${data.event.dateISO.replace(/[-:]/g, "").slice(0, 15)}`,
        `DESCRIPTION:${data.copy.openingGreeting}`,
        `LOCATION:${akad.address}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "save-the-date.ics";
    a.click();
    URL.revokeObjectURL(url);
}

export default function LightBlueFloralTemplate() {
    const { data, loading } = useInvitationData("light-blue-floral");

    const [opened, setOpened] = useState(false);
    const [activeNav, setActiveNav] = useState("hero");

    // Destructure only once data is resolved
    const { guest, couple, event, copy, lovestory, gallery, features } = data || {};
    const hasInfoSection = Boolean(features?.livestreamEnabled || features?.digitalEnvelopeEnabled);
    const showInfoNav = Boolean(!features?.rsvpEnabled && hasInfoSection);

    // Init AOS
    useEffect(() => {
        AOS.init({
            duration: tokens.aos.duration,
            offset: tokens.aos.offset,
            easing: tokens.aos.easing,
            once: tokens.aos.once,
        });
    }, []);

    // Refresh AOS when cover is opened
    useEffect(() => {
        if (opened) {
            setTimeout(() => AOS.refresh(), 400);
        }
    }, [opened]);

    // Active nav tracking
    useEffect(() => {
        const sections = ["hero", "mempelai", "acara", "galeri", "lovestory"];
        if (features?.rsvpEnabled) {
            sections.push("rsvp");
        } else if (showInfoNav) {
            sections.push("info");
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) setActiveNav(e.target.id.replace("section-", ""));
                });
            },
            { threshold: 0.3 }
        );
        sections.forEach((id) => {
            const el = document.getElementById(`section-${id}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [opened, features?.rsvpEnabled, showInfoNav]);

    const sectionBase = {
        width: "100%",
        padding: "56px 20px",
        position: "relative",
        overflow: "hidden",
    };

    const sectionAlt = { ...sectionBase, background: tokens.colors.sectionAlt };
    const sectionWhite = { ...sectionBase, background: tokens.colors.white };

    function navItem(id, icon, label) {
        const isActive = activeNav === id;
        return (
            <a
                href={`#section-${id}`}
                onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
                    setActiveNav(id);
                }}
                className="flex flex-col items-center gap-0.5 transition-all"
                style={{ textDecoration: "none" }}
                aria-label={label}
            >
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: "1.2rem",
                        color: isActive ? tokens.colors.accent : tokens.colors.mutedText,
                        transition: "color 0.2s",
                    }}
                >
                    {icon}
                </span>
                <span
                    style={{
                        fontFamily: tokens.fonts.sans,
                        fontSize: "0.55rem",
                        letterSpacing: "0.04em",
                        color: isActive ? tokens.colors.accent : tokens.colors.mutedText,
                        fontWeight: isActive ? 600 : 400,
                    }}
                >
                    {label}
                </span>
            </a>
        );
    }

    // Loading skeleton while resolving data
    if (loading || !data) {
        return (
            <div
                style={{
                    minHeight: "100dvh",
                    background: tokens.colors.pageBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "12px",
                }}
            >
                <FloralDivider />
                <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText, fontSize: "0.85rem" }}>
                    Memuat undangan…
                </p>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100dvh",
                background: tokens.colors.pageBg,
                fontFamily: tokens.fonts.sans,
                color: tokens.colors.bodyText,
            }}
        >
            {/* ── MOBILE SHELL ──────────────────────────────────────────── */}
            <div
                className="relative mx-auto overflow-hidden"
                style={{
                    maxWidth: "430px",
                    minHeight: "100dvh",
                    background: tokens.colors.pageBg,
                    boxShadow: "0 0 60px rgba(36,59,85,0.12)",
                }}
            >

                {/* ── SECTION 0: COVER GATE ────────────────────────────── */}
                {!opened && (
                    <CoverGate
                        guestName={guest.name}
                        greetingLabel={guest.greetingLabel}
                        groomNick={couple.groom.nickName}
                        brideNick={couple.bride.nickName}
                        onOpen={() => setOpened(true)}
                    />
                )}

                {/* ── SECTIONS 1–9: MAIN CONTENT (after gate) ─────────── */}
                {opened && (
                    <>
                        {/* SECTION 1 — HERO */}
                        <section
                            id="section-hero"
                            style={{
                                ...sectionBase,
                                background: `linear-gradient(180deg, ${tokens.colors.pageBg} 0%, ${tokens.colors.white} 100%)`,
                                textAlign: "center",
                            }}
                        >
                            {/* Ornaments — top-left flower cluster, top-right leaf branch */}
                            <img src={DEC.topLeft} alt="" aria-hidden="true" className="absolute top-0 left-0 pointer-events-none select-none" style={{ width: 150, opacity: 0.92 }} />
                            <img src={DEC.topRight} alt="" aria-hidden="true" className="absolute top-0 right-0 pointer-events-none select-none" style={{ width: 170, opacity: 0.88 }} />

                            <p
                                data-aos="fade-down"
                                style={{ fontFamily: tokens.fonts.sans, letterSpacing: "0.3em", color: tokens.colors.mutedText }}
                                className="text-xs uppercase mb-2"
                            >
                                WEDDING OF
                            </p>

                            {/* Couple photo */}
                            <div
                                data-aos="zoom-in"
                                data-aos-delay="100"
                                className="relative mx-auto mb-4"
                                style={{
                                    width: "180px",
                                    height: "220px",
                                    borderRadius: "90px 90px 50px 50px",
                                    overflow: "hidden",
                                    boxShadow: tokens.shadow.photo,
                                    border: `4px solid ${tokens.colors.white}`,
                                }}
                            >
                                <img
                                    src={
                                        couple.heroPhoto ||
                                        "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=500&q=80"
                                    }
                                    alt="Foto Couple"
                                    className="w-full h-full object-cover"
                                />
                                {/* Subtle blue rim */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        boxShadow: `inset 0 0 0 2px ${tokens.colors.cardBorder}`,
                                        borderRadius: "inherit",
                                    }}
                                />
                            </div>

                            {/* Couple names in script */}
                            <h1
                                data-aos="fade-up"
                                data-aos-delay="150"
                                style={{
                                    fontFamily: tokens.fonts.script,
                                    color: tokens.colors.headingText,
                                    fontSize: "clamp(2rem, 7vw, 2.8rem)",
                                    lineHeight: 1.1,
                                }}
                            >
                                {couple.groom.nickName}
                            </h1>
                            <p
                                data-aos="fade-up"
                                data-aos-delay="180"
                                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText, fontSize: "1rem" }}
                            >
                                &amp;
                            </p>
                            <h1
                                data-aos="fade-up"
                                data-aos-delay="200"
                                style={{
                                    fontFamily: tokens.fonts.script,
                                    color: tokens.colors.headingText,
                                    fontSize: "clamp(2rem, 7vw, 2.8rem)",
                                    lineHeight: 1.1,
                                }}
                                className="mb-6"
                            >
                                {couple.bride.nickName}
                            </h1>

                            <FloralDivider />

                            {/* Countdown */}
                            {features.countdownEnabled && (
                                <CountdownTimer
                                    targetISO={event.dateISO}
                                    aos="fade-up"
                                    aosDelay="250"
                                />
                            )}

                            {/* Date display */}
                            <p
                                data-aos="fade-up"
                                data-aos-delay="300"
                                className="mt-4 text-sm"
                                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.bodyText }}
                            >
                                {event.akad.date}
                            </p>

                            {/* Save The Date button */}
                            {features.saveTheDateEnabled && (
                                <button
                                    data-aos="fade-up"
                                    data-aos-delay="350"
                                    onClick={() => downloadICS(data)}
                                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                                    style={{
                                        background: tokens.colors.accent,
                                        color: tokens.colors.white,
                                        fontFamily: tokens.fonts.sans,
                                        boxShadow: tokens.shadow.button,
                                        border: "none",
                                    }}
                                >
                                    <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                                    Save The Date
                                </button>
                            )}
                        </section>

                        {/* SECTION 2 — PEMBUKA + MEMPELAI */}
                        <section id="section-mempelai" style={sectionAlt}>
                            {/* Opening text */}
                            <div className="text-center mb-8" data-aos="fade-up">
                                <p
                                    className="text-base font-semibold mb-2"
                                    style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.headingText }}
                                >
                                    {copy.openingGreeting}
                                </p>
                                <FloralDivider />
                                <p
                                    className="text-sm leading-relaxed"
                                    style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.bodyText }}
                                >
                                    {copy.openingText}
                                </p>
                            </div>

                            {/* Mempelai */}
                            <SectionTitle title="Mempelai" aos="fade-up" />

                            <div className="flex flex-col items-center">
                                {/* Groom */}
                                <CoupleCard
                                    role="groom"
                                    nameFull={couple.groom.nameFull}
                                    nickName={couple.groom.nickName}
                                    parentInfo={couple.groom.parentInfo}
                                    instagram={couple.groom.instagram}
                                    photo={couple.groom.photo}
                                    aos="fade-right"
                                    aosDelay="100"
                                />

                                {/* Ampersand divider */}
                                <div
                                    data-aos="zoom-in"
                                    data-aos-delay="150"
                                    className="my-6 w-14 h-14 rounded-full flex items-center justify-center"
                                    style={{
                                        fontFamily: tokens.fonts.script,
                                        fontSize: "2.2rem",
                                        color: tokens.colors.accent,
                                        border: `1.5px solid ${tokens.colors.cardBorder}`,
                                        background: tokens.colors.white,
                                        boxShadow: tokens.shadow.card,
                                    }}
                                >
                                    &amp;
                                </div>

                                {/* Bride */}
                                <CoupleCard
                                    role="bride"
                                    nameFull={couple.bride.nameFull}
                                    nickName={couple.bride.nickName}
                                    parentInfo={couple.bride.parentInfo}
                                    instagram={couple.bride.instagram}
                                    photo={couple.bride.photo}
                                    aos="fade-left"
                                    aosDelay="200"
                                />
                            </div>

                            {/* Bouquet ornaments — same asset mirrored, bleed at edges */}
                            <img src={DEC.frameLeft} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ bottom: -20, left: -16, width: 170, opacity: 0.9, zIndex: 1 }} />
                            <img src={DEC.frameLeft} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ bottom: -20, right: -16, width: 170, opacity: 0.9, zIndex: 1, transform: "scaleX(-1)" }} />
                        </section>

                        {/* SECTION 3 — QUOTE AYAT */}
                        <section
                            style={{
                                ...sectionWhite,
                                textAlign: "center",
                                background: `linear-gradient(135deg, ${tokens.colors.accentSoft} 0%, ${tokens.colors.white} 100%)`,
                            }}
                        >
                            <div data-aos="fade-up" className="relative px-4">
                                {/* Subtle flower watermark behind quote */}
                                <img src={DEC.centerOverlay} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" style={{ opacity: 0.18, transform: "scale(1.1)" }} />
                                {/* Large quote mark */}
                                <div
                                    className="absolute -top-4 left-0 text-7xl leading-none select-none pointer-events-none"
                                    style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.cardBorder, lineHeight: 1 }}
                                    aria-hidden="true"
                                >
                                    &quot;
                                </div>
                                <p
                                    className="italic text-sm leading-relaxed mb-3 pt-4"
                                    style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.bodyText, fontSize: "0.95rem" }}
                                >
                                    {copy.quote}
                                </p>
                                <p
                                    className="text-xs font-semibold"
                                    style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.accent }}
                                >
                                    ({copy.quoteSource})
                                </p>
                            </div>
                            <FloralDivider />
                        </section>

                        {/* SECTION 4 — JADWAL ACARA */}
                        <section id="section-acara" style={sectionAlt}>
                            <SectionTitle
                                title="Jadwal Acara"
                                subtitle="Dengan segala kerendahan hati, kami mengundang kehadiran Bapak/Ibu/Saudara/i"
                                aos="fade-up"
                            />
                            <div className="flex flex-col gap-4">
                                <CardEvent
                                    type="akad"
                                    date={event.akad.date}
                                    time={event.akad.time}
                                    address={event.akad.address}
                                    mapsUrl={event.akad.mapsUrl}
                                    aos="fade-up"
                                    aosDelay="100"
                                />
                                <CardEvent
                                    type="resepsi"
                                    date={event.resepsi.date}
                                    time={event.resepsi.time}
                                    address={event.resepsi.address}
                                    mapsUrl={event.resepsi.mapsUrl}
                                    aos="fade-up"
                                    aosDelay="200"
                                />
                            </div>
                            {/* Corner branches — BL and BR matching reference */}
                            <img src={DEC.bottomLeft} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ bottom: -10, left: -10, width: 130, opacity: 0.85, zIndex: 1 }} />
                            <img src={DEC.bottomLeft} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ bottom: -10, right: -10, width: 130, opacity: 0.85, zIndex: 1, transform: "scaleX(-1)" }} />
                        </section>

                        {/* SECTION 5 — LIVE STREAMING + AMPLOP DIGITAL */}
                        {(features.livestreamEnabled || features.digitalEnvelopeEnabled) && (
                            <section id="section-info" style={sectionWhite}>
                                <SectionTitle title="Info Tambahan" aos="fade-up" />
                                <div className="flex flex-col gap-4">
                                    {features.livestreamEnabled && event.livestream && (
                                        <LiveStreaming
                                            date={event.livestream.date}
                                            time={event.livestream.time}
                                            platformLabel={event.livestream.platformLabel}
                                            url={event.livestream.url}
                                            aos="fade-up"
                                        />
                                    )}
                                    {features.digitalEnvelopeEnabled && (
                                        <GiftEnvelope
                                            bankList={features?.digitalEnvelopeInfo?.bankList || []}
                                            aos="fade-up"
                                        />
                                    )}
                                </div>
                            </section>
                        )}

                        {/* SECTION 6 — GALERI FOTO */}
                        <section id="section-galeri" style={sectionAlt}>
                            <SectionTitle
                                title="Galeri Foto"
                                subtitle="Mengabadikan setiap momen berharga"
                                aos="fade-up"
                            />
                            <GalleryGrid photos={gallery} aos="fade-up" />
                            {/* Corner accents on gallery — TL and BR */}
                            <img src={DEC.corner3} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ top: -8, left: -8, width: 100, opacity: 0.75, zIndex: 1 }} />
                            <img src={DEC.corner3} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ bottom: -8, right: -8, width: 100, opacity: 0.75, zIndex: 1, transform: "scaleX(-1) scaleY(-1)" }} />
                        </section>

                        {/* SECTION 7 — LOVE STORY */}
                        <section id="section-lovestory" style={sectionWhite}>
                            <SectionTitle
                                title="Our Love Story"
                                subtitle="Setiap kisah cinta dimulai dari pertemuan yang tak terduga"
                                aos="fade-up"
                            />
                            <div className="flex flex-col items-center">
                                {lovestory.map((item, i) => (
                                    <LoveStoryItem
                                        key={i}
                                        index={i}
                                        title={item.title}
                                        date={item.date}
                                        text={item.text}
                                        photo={item.photo}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* SECTION 8 — RSVP / UCAPAN */}
                        {features.rsvpEnabled && (
                            <section id="section-rsvp" style={sectionAlt}>
                                <SectionTitle
                                    title="Ucapan & Doa"
                                    subtitle="Berikan ucapan dan doa restu untuk kami"
                                    aos="fade-up"
                                />
                                <RSVPForm
                                    groomNick={couple.groom.nickName}
                                    brideNick={couple.bride.nickName}
                                    aos="fade-up"
                                />
                            </section>
                        )}

                        {/* SECTION 9 — PENUTUP */}
                        <section
                            style={{
                                ...sectionBase,
                                background: `linear-gradient(180deg, ${tokens.colors.white} 0%, ${tokens.colors.pageBg} 100%)`,
                                textAlign: "center",
                                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)",
                            }}
                        >
                            {/* Closing section — full corner florals matching reference */}
                            <img src={DEC.topLeft} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ top: -10, left: -10, width: 140, opacity: 0.9, zIndex: 1 }} />
                            <img src={DEC.topLeft} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ top: -10, right: -10, width: 140, opacity: 0.9, zIndex: 1, transform: "scaleX(-1)" }} />
                            <img src={DEC.frameLeft} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ bottom: -16, left: -16, width: 160, opacity: 0.8, zIndex: 1 }} />
                            <img src={DEC.frameLeft} alt="" aria-hidden="true" className="absolute pointer-events-none select-none" style={{ bottom: -16, right: -16, width: 160, opacity: 0.8, zIndex: 1, transform: "scaleX(-1)" }} />

                            {/* Closing couple photo */}
                            <div
                                data-aos="zoom-in"
                                className="relative mx-auto mb-6"
                                style={{
                                    width: "160px",
                                    height: "200px",
                                    borderRadius: "80px 80px 40px 40px",
                                    overflow: "hidden",
                                    boxShadow: tokens.shadow.photo,
                                    border: `4px solid ${tokens.colors.white}`,
                                }}
                            >
                                <img
                                    src={
                                        couple.heroPhoto ||
                                        "https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=500&q=80"
                                    }
                                    alt="Foto Couple Penutup"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <FloralDivider />

                            <h2
                                data-aos="fade-up"
                                style={{
                                    fontFamily: tokens.fonts.script,
                                    fontSize: "2.2rem",
                                    color: tokens.colors.headingText,
                                }}
                                className="mb-3"
                            >
                                {couple.groom.nickName} &amp; {couple.bride.nickName}
                            </h2>

                            <p
                                data-aos="fade-up"
                                data-aos-delay="100"
                                className="text-sm leading-relaxed mb-4"
                                style={{
                                    fontFamily: tokens.fonts.sans,
                                    color: tokens.colors.bodyText,
                                    maxWidth: "300px",
                                    margin: "0 auto",
                                }}
                            >
                                {copy.closingText}
                            </p>

                            <p
                                data-aos="fade-up"
                                data-aos-delay="150"
                                className="text-base font-semibold"
                                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.headingText }}
                            >
                                {copy.openingGreeting}
                            </p>

                            <FloralDivider />

                            {/* Powered by */}
                            <div data-aos="fade-up" data-aos-delay="200" className="mt-4">
                                <p className="text-xs" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText }}>
                                    powered by
                                </p>
                                <p
                                    className="font-bold text-sm tracking-widest"
                                    style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.accent }}
                                >
                                    IKATANCINTA.IN
                                </p>
                            </div>
                        </section>

                        {/* ── FLOATING BOTTOM NAV ──────────────────────────── */}
                        <nav
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50"
                            style={{
                                width: "calc(100% - 32px)",
                                maxWidth: "390px",
                                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
                                bottom: 0,
                            }}
                        >
                            <div
                                className="flex items-center justify-around px-4 py-2.5 rounded-full mb-3"
                                style={{
                                    background: "rgba(255,255,255,0.92)",
                                    backdropFilter: "blur(16px)",
                                    boxShadow: "0 4px 24px rgba(36,59,85,0.14), 0 1px 4px rgba(36,59,85,0.08)",
                                    border: `1px solid ${tokens.colors.cardBorder}`,
                                }}
                            >
                                {navItem("hero", "favorite", "Couple")}
                                {navItem("acara", "calendar_month", "Acara")}
                                {navItem("galeri", "photo_library", "Galeri")}
                                {navItem("lovestory", "auto_stories", "Kisah")}
                                {features.rsvpEnabled
                                    ? navItem("rsvp", "edit_note", "Ucapan")
                                    : showInfoNav
                                        ? navItem("info", "info", "Info")
                                        : null}
                            </div>
                        </nav>

                        {/* ── WHATSAPP FLOAT BUTTON ───────────────────────── */}
                        <a
                            href={`https://wa.me/628567452717?text=${encodeURIComponent(`Halo Admin, saya tertarik dengan tema "Light Blue Floral".`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="fixed bottom-20 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                            style={{
                                background: tokens.colors.accent,
                                color: tokens.colors.white,
                                boxShadow: tokens.shadow.button,
                            }}
                            aria-label="Hubungi Admin"
                        >
                            <span className="material-symbols-outlined text-base">chat</span>
                        </a>
                    </>
                )}
            </div>

            {/* Bounce animation for scroll hint */}
            <style>{`
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
        </div>
    );
}
