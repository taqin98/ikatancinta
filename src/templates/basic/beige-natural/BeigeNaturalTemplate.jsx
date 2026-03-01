import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { useInvitationData } from "../../../hooks/useInvitationData";
import { tokens } from "./tokens";

import SectionShell from "./components/SectionShell";
import ButtonPill from "./components/ButtonPill";
import PhotoFrameArch from "./components/PhotoFrameArch";
import PhotoFrameOval from "./components/PhotoFrameOval";
import OrnamentCorner from "./components/OrnamentCorner";
import WaveDivider from "./components/WaveDivider";
import CoverGate from "./components/CoverGate";
import CountdownPills from "./components/CountdownPills";
import EventCard from "./components/EventCard";
import GalleryGrid from "./components/GalleryGrid";
import LoveStoryTimelineCard from "./components/LoveStoryTimelineCard";
import GiftCard from "./components/GiftCard";
import RSVPForm from "./components/RSVPForm";
import ClosingFooter from "./components/ClosingFooter";
import Flower03 from "./assets/decorations/flower-03.webp";
import Flower04 from "./assets/decorations/flower-04.webp";
import Flower05 from "./assets/decorations/flower-05.webp";
import Flower06 from "./assets/decorations/flower-06.webp";

function aosPreset(type, index = 0) {
    const stagger = index * 100;
    if (type === "headingSmall") return { aos: "fade-down", delay: 0 };
    if (type === "heroPhoto") return { aos: "zoom-in", delay: 80 };
    if (type === "title") return { aos: "fade-up", delay: 120 };
    if (type === "card") return { aos: "fade-up", delay: 120 + stagger };
    if (type === "ornament") return { aos: "fade-in", delay: 0 };
    return { aos: "fade-up", delay: stagger };
}

function downloadICS(data) {
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//IkatanCinta//BeigeNatural//EN",
        "BEGIN:VEVENT",
        `SUMMARY:Pernikahan ${data.couple.groom.nickName} & ${data.couple.bride.nickName}`,
        `DTSTART:${data.event.dateISO.replace(/[-:]/g, "").slice(0, 15)}`,
        `DESCRIPTION:${data.copy.openingGreeting}`,
        `LOCATION:${data.event.akad.address}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "save-the-date.ics";
    anchor.click();
    URL.revokeObjectURL(url);
}

function SectionHeading({ overline, title, subtitle, light = false, aos = "fade-up", delay = 0 }) {
    return (
        <div className="text-center mb-7" data-aos={aos} data-aos-delay={delay}>
            {overline ? (
                <p
                    style={{
                        fontFamily: tokens.fonts.display,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        fontSize: "0.68rem",
                        color: light ? "rgba(255,255,255,0.84)" : tokens.colors.primaryBrown,
                    }}
                >
                    {overline}
                </p>
            ) : null}
            <h2
                style={{
                    fontFamily: tokens.fonts.script,
                    fontSize: "2.3rem",
                    color: light ? tokens.colors.white : tokens.colors.primaryBrownDark,
                    lineHeight: 1,
                }}
            >
                {title}
            </h2>
            {subtitle ? (
                <p
                    style={{
                        fontFamily: tokens.fonts.sans,
                        fontSize: "0.84rem",
                        color: light ? "rgba(255,255,255,0.86)" : tokens.colors.textDark,
                        maxWidth: "320px",
                        margin: "8px auto 0",
                        lineHeight: 1.7,
                    }}
                >
                    {subtitle}
                </p>
            ) : null}
        </div>
    );
}

export default function BeigeNaturalTemplate() {
    const { data, loading } = useInvitationData("beige-natural");
    const [opened, setOpened] = useState(false);
    const [activeNav, setActiveNav] = useState("hero");

    const { guest, couple, event, copy, lovestory, gallery, features } = data || {};

    useEffect(() => {
        AOS.init({
            duration: tokens.aos.duration,
            offset: tokens.aos.offset,
            easing: tokens.aos.easing,
            once: tokens.aos.once,
        });
    }, []);

    useEffect(() => {
        if (!opened) return;
        setTimeout(() => AOS.refresh(), 420);
    }, [opened]);

    useEffect(() => {
        if (!opened) return;
        const ids = ["hero", "acara", "galeri", "lovestory", "rsvp"];
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveNav(entry.target.id.replace("section-", ""));
                    }
                });
            },
            { threshold: 0.3 }
        );

        ids.forEach((id) => {
            const el = document.getElementById(`section-${id}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [opened, features?.rsvpEnabled]);

    if (loading || !data) {
        return (
            <div
                style={{
                    minHeight: "100dvh",
                    background: tokens.colors.pageBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: tokens.fonts.sans,
                    color: tokens.colors.textMuted,
                }}
            >
                Memuat undangan...
            </div>
        );
    }

    function navItem(id, icon, label) {
        const active = activeNav === id;

        return (
            <a
                key={id}
                href={`#section-${id}`}
                onClick={(eventClick) => {
                    eventClick.preventDefault();
                    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
                    setActiveNav(id);
                }}
                style={{ textDecoration: "none" }}
                className="flex flex-col items-center gap-0.5"
                aria-label={label}
            >
                <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "1.15rem", color: active ? tokens.colors.primaryBrown : tokens.colors.textMuted }}
                >
                    {icon}
                </span>
                <span
                    style={{
                        fontFamily: tokens.fonts.sans,
                        color: active ? tokens.colors.primaryBrown : tokens.colors.textMuted,
                        fontSize: "0.53rem",
                        letterSpacing: "0.08em",
                        fontWeight: active ? 600 : 500,
                        textTransform: "uppercase",
                    }}
                >
                    {label}
                </span>
            </a>
        );
    }

    return (
        <div style={{ minHeight: "100dvh", background: tokens.colors.pageBg, color: tokens.colors.textDark, fontFamily: tokens.fonts.sans }}>
            <div
                className="relative mx-auto overflow-hidden"
                style={{ maxWidth: "430px", minHeight: "100dvh", background: tokens.colors.pageBg, boxShadow: "0 0 60px rgba(60,40,28,0.12)" }}
            >
                {!opened ? (
                    <CoverGate
                        guestName={guest.name}
                        greetingLabel={guest.greetingLabel}
                        groomNick={couple.groom.nickName}
                        brideNick={couple.bride.nickName}
                        onOpen={() => {
                            setOpened(true);
                            setTimeout(() => {
                                document.getElementById("section-hero")?.scrollIntoView({ behavior: "smooth" });
                            }, 100);
                        }}
                    />
                ) : (
                    <>
                        <SectionShell
                            id="section-hero"
                            style={{
                                background: `linear-gradient(180deg, ${tokens.colors.pageBg} 0%, ${tokens.colors.white} 100%)`,
                                textAlign: "center",
                            }}
                        >
                            <div className="absolute" style={{ top: "-0.8%", left: "-1.3%", width: "24%", maxWidth: 110 }} data-aos={aosPreset("ornament").aos}>
                                <OrnamentCorner corner="tl" width="100%" opacity={0.86} />
                            </div>
                            <div className="absolute" style={{ top: "-0.8%", right: "-1.3%", width: "24%", maxWidth: 110 }} data-aos={aosPreset("ornament").aos}>
                                <OrnamentCorner corner="tr" width="100%" opacity={0.86} />
                            </div>

                            <SectionHeading overline="Save The Date" title="The Wedding Of" aos={aosPreset("headingSmall").aos} />

                            <PhotoFrameOval
                                src={couple.heroPhoto}
                                alt="Foto pasangan"
                                width="56%"
                                height="39dvh"
                                aos={aosPreset("heroPhoto").aos}
                                aosDelay={aosPreset("heroPhoto").delay}
                            />

                            <h1
                                data-aos={aosPreset("title").aos}
                                data-aos-delay={aosPreset("title").delay}
                                style={{
                                    marginTop: "18px",
                                    fontFamily: tokens.fonts.script,
                                    fontSize: "2.65rem",
                                    color: tokens.colors.primaryBrown,
                                    lineHeight: 1.05,
                                }}
                            >
                                {couple.groom.nickName} &amp; {couple.bride.nickName}
                            </h1>

                            <p
                                data-aos="fade-up"
                                data-aos-delay="180"
                                style={{ maxWidth: "320px", margin: "10px auto 16px", fontSize: "0.82rem", color: tokens.colors.textMuted, lineHeight: 1.7 }}
                            >
                                {copy.openingText}
                            </p>

                            {features.countdownEnabled ? <CountdownPills targetISO={event.dateISO} /> : null}

                            {features.saveTheDateEnabled ? (
                                <div className="mt-4" data-aos="fade-up" data-aos-delay="360">
                                    <ButtonPill onClick={() => downloadICS(data)} icon="calendar_add_on">
                                        Save The Date
                                    </ButtonPill>
                                </div>
                            ) : null}
                        </SectionShell>

                        <SectionShell
                            id="section-quote"
                            alt
                            style={{ textAlign: "center", paddingTop: "52px", paddingBottom: "52px", background: tokens.colors.primaryBrown }}
                        >
                            <div className="absolute left-0" style={{ top: "12%", opacity: 0.28 }}>
                                <img src={Flower03} alt="" aria-hidden="true" style={{ width: "24vw", maxWidth: 112 }} />
                            </div>
                            <div className="absolute right-0" style={{ bottom: "10%", opacity: 0.28 }}>
                                <img src={Flower04} alt="" aria-hidden="true" style={{ width: "22vw", maxWidth: 102 }} />
                            </div>

                            <p
                                data-aos="fade-up"
                                style={{
                                    fontFamily: tokens.fonts.display,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    fontSize: "0.66rem",
                                    color: "rgba(255,255,255,0.86)",
                                    marginBottom: "8px",
                                }}
                            >
                                Quote
                            </p>
                            <p
                                data-aos="fade-up"
                                data-aos-delay="100"
                                style={{
                                    fontFamily: tokens.fonts.sans,
                                    fontWeight: 500,
                                    color: "rgba(255,255,255,0.93)",
                                    lineHeight: 1.95,
                                    fontSize: "0.98rem",
                                    maxWidth: "330px",
                                    margin: "0 auto",
                                }}
                            >
                                {copy.quote}
                            </p>
                            <p data-aos="fade-up" data-aos-delay="180" style={{ marginTop: "8px", fontSize: "0.72rem", color: "rgba(255,255,255,0.9)" }}>
                                ({copy.quoteSource})
                            </p>
                        </SectionShell>

                        <SectionShell id="section-pria" style={{ textAlign: "center" }}>
                            <SectionHeading overline="Mempelai Pria" title={couple.groom.nickName} subtitle={couple.groom.nameFull} />
                            <PhotoFrameOval src={couple.groom.photo || couple.heroPhoto} alt={couple.groom.nameFull} aos="zoom-in" />
                            <p data-aos="fade-up" style={{ marginTop: "16px", fontFamily: tokens.fonts.sans, color: tokens.colors.textDark, lineHeight: 1.75, fontSize: "0.85rem" }}>
                                {couple.groom.parentInfo}
                            </p>
                            {couple.groom.instagram ? (
                                <p data-aos="fade-up" data-aos-delay="120" style={{ fontSize: "0.78rem", color: tokens.colors.primaryBrown, marginTop: "10px" }}>
                                    @{couple.groom.instagram}
                                </p>
                            ) : null}
                        </SectionShell>

                        <SectionShell id="section-wanita" alt style={{ textAlign: "center", paddingBottom: "18px" }}>
                            <SectionHeading overline="Mempelai Wanita" title={couple.bride.nickName} subtitle={couple.bride.nameFull} />
                            <PhotoFrameOval src={couple.bride.photo || couple.heroPhoto} alt={couple.bride.nameFull} aos="zoom-in" />
                            <p data-aos="fade-up" style={{ marginTop: "16px", fontFamily: tokens.fonts.sans, color: tokens.colors.textDark, lineHeight: 1.75, fontSize: "0.85rem" }}>
                                {couple.bride.parentInfo}
                            </p>
                            {couple.bride.instagram ? (
                                <p data-aos="fade-up" data-aos-delay="120" style={{ fontSize: "0.78rem", color: tokens.colors.primaryBrown, marginTop: "10px", marginBottom: "14px" }}>
                                    @{couple.bride.instagram}
                                </p>
                            ) : null}
                            <WaveDivider />
                        </SectionShell>

                        <SectionShell id="section-acara" style={{ paddingTop: "28px" }}>
                            <img
                                src={Flower03}
                                alt=""
                                aria-hidden="true"
                                className="absolute pointer-events-none select-none"
                                style={{ bottom: -8, left: -8, width: 110, opacity: 0.72 }}
                            />
                            <img
                                src={Flower04}
                                alt=""
                                aria-hidden="true"
                                className="absolute pointer-events-none select-none"
                                style={{ bottom: -8, right: -8, width: 95, opacity: 0.7 }}
                            />
                            <SectionHeading
                                overline="Save The Date"
                                title="Detail Acara"
                                subtitle="Dengan segala kerendahan hati, kami mengundang Bapak/Ibu/Saudara/i untuk hadir"
                            />
                            <div className="space-y-4" style={{ paddingLeft: "2px", paddingRight: "2px" }}>
                                <EventCard title="Akad" date={event.akad.date} time={event.akad.time} address={event.akad.address} mapsUrl={event.akad.mapsUrl} delay={0} />
                                <EventCard title="Resepsi" date={event.resepsi.date} time={event.resepsi.time} address={event.resepsi.address} mapsUrl={event.resepsi.mapsUrl} delay={150} />
                            </div>
                        </SectionShell>

                        {features.livestreamEnabled && event.livestream ? (
                            <SectionShell
                                id="section-live"
                                style={{
                                    background: tokens.colors.liveBg,
                                    textAlign: "center",
                                }}
                            >
                                <SectionHeading
                                    overline="Live Streaming"
                                    title="Siaran Langsung"
                                    subtitle={`${event.livestream.date} - ${event.livestream.time}`}
                                    light
                                    aos="fade-down"
                                />
                                <p
                                    data-aos="fade-up"
                                    style={{ fontFamily: tokens.fonts.sans, color: "rgba(255,255,255,0.82)", fontSize: "0.82rem", marginBottom: "14px" }}
                                >
                                    {event.livestream.platformLabel}
                                </p>
                                <ButtonPill
                                    href={event.livestream.url}
                                    icon="live_tv"
                                    dataAos="zoom-in"
                                    style={{
                                        background: tokens.colors.white,
                                        color: tokens.colors.primaryBrown,
                                    }}
                                >
                                    Buka Streaming
                                </ButtonPill>
                            </SectionShell>
                        ) : null}

                        <SectionShell id="section-galeri" alt>
                            <img
                                src={Flower05}
                                alt=""
                                aria-hidden="true"
                                className="absolute pointer-events-none select-none"
                                style={{ top: -6, left: -8, width: 112, opacity: 0.75 }}
                            />
                            <img
                                src={Flower06}
                                alt=""
                                aria-hidden="true"
                                className="absolute pointer-events-none select-none"
                                style={{ bottom: -6, right: -8, width: 112, opacity: 0.75 }}
                            />
                            <SectionHeading overline="Gallery" title="Galeri Foto" subtitle="Momen terbaik perjalanan kami" />
                            <GalleryGrid photos={gallery} />
                        </SectionShell>

                        <SectionShell id="section-story-hero" style={{ textAlign: "center" }}>
                            <img
                                src={Flower03}
                                alt=""
                                aria-hidden="true"
                                className="absolute pointer-events-none select-none"
                                style={{ top: 14, right: -8, width: 98, opacity: 0.64 }}
                            />
                            <img
                                src={Flower04}
                                alt=""
                                aria-hidden="true"
                                className="absolute pointer-events-none select-none"
                                style={{ bottom: 16, left: -6, width: 92, opacity: 0.62 }}
                            />
                            <SectionHeading overline="Love Story" title="Our Love Story" />
                            <PhotoFrameArch src={couple.heroPhoto} width="78%" height="355px" aos="zoom-in" />
                        </SectionShell>

                        <SectionShell id="section-lovestory" alt>
                            <SectionHeading overline="Timeline" title="Perjalanan Kami" />
                            <LoveStoryTimelineCard items={lovestory} />
                        </SectionShell>

                        {features.digitalEnvelopeEnabled ? (
                            <SectionShell id="section-gift">
                                <SectionHeading
                                    overline="Wedding Gift"
                                    title="Amplop Digital"
                                    subtitle="Doa restu Anda adalah hadiah terbaik. Jika berkenan berbagi, dapat melalui rekening berikut"
                                />
                                <GiftCard bankList={features.digitalEnvelopeInfo?.bankList || []} />
                            </SectionShell>
                        ) : null}

                        {features.rsvpEnabled ? (
                            <SectionShell id="section-rsvp" style={{ background: tokens.colors.primaryBrown }}>
                                <img
                                    src={Flower03}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute pointer-events-none select-none"
                                    style={{ top: -4, left: -8, width: 92, opacity: 0.42 }}
                                />
                                <img
                                    src={Flower04}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute pointer-events-none select-none"
                                    style={{ top: -4, right: -8, width: 82, opacity: 0.42 }}
                                />
                                <SectionHeading overline="RSVP" title="Ucapan & Kehadiran" subtitle="Berikan ucapan dan doa terbaik untuk kami" light />
                                <RSVPForm />
                            </SectionShell>
                        ) : null}

                        <ClosingFooter
                            groomNick={couple.groom.nickName}
                            brideNick={couple.bride.nickName}
                            closingText={copy.closingText}
                            openingGreeting={copy.openingGreeting}
                            heroPhoto={couple.heroPhoto}
                        />

                        <nav
                            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50"
                            style={{
                                width: "calc(100% - 32px)",
                                maxWidth: "390px",
                                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
                            }}
                        >
                            <div
                                className="flex items-center justify-around px-4 py-2.5 rounded-full mb-3"
                                style={{
                                    background: "rgba(255,255,255,0.94)",
                                    backdropFilter: "blur(12px)",
                                    boxShadow: "0 10px 28px rgba(43,43,43,0.18)",
                                    border: `1px solid ${tokens.colors.cardBorder}`,
                                }}
                            >
                                {navItem("hero", "favorite", "Home")}
                                {navItem("acara", "calendar_month", "Acara")}
                                {navItem("galeri", "photo_library", "Galeri")}
                                {navItem("lovestory", "auto_stories", "Kisah")}
                                {features.rsvpEnabled
                                    ? navItem("rsvp", "edit_note", "RSVP")
                                    : features.digitalEnvelopeEnabled
                                        ? navItem("gift", "redeem", "Gift")
                                        : navItem("hero", "favorite", "Home")}
                            </div>
                        </nav>

                        <a
                            href={`https://wa.me/628567452717?text=${encodeURIComponent('Halo Admin, saya tertarik dengan tema "Beige Natural".')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="fixed bottom-20 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center"
                            style={{ background: tokens.colors.primaryBrown, color: tokens.colors.white, boxShadow: tokens.shadow.button }}
                            aria-label="Hubungi Admin"
                        >
                            <span className="material-symbols-outlined text-base">chat</span>
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}
