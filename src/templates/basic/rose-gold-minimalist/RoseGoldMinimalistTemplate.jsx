import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { tokens } from "./tokens";
import { useInvitationData } from "../../../hooks/useInvitationData";

import OrnamentCornerTL from "./assets/ornaments/OrnamentCornerTL";
import OrnamentCornerTR from "./assets/ornaments/OrnamentCornerTR";
import OrnamentCornerBR from "./assets/ornaments/OrnamentCornerBR";

// ── Minimal geometric divider ────────────────────────────────
function GeoDivider() {
    return (
        <div
            className="flex items-center justify-center gap-3 my-5"
            aria-hidden="true"
        >
            <div style={{ height: "1px", width: "48px", background: tokens.colors.accentSoft }} />
            <div
                style={{
                    width: "7px",
                    height: "7px",
                    transform: "rotate(45deg)",
                    border: `1px solid ${tokens.colors.accent}`,
                    flexShrink: 0,
                }}
            />
            <div style={{ height: "1px", width: "48px", background: tokens.colors.accentSoft }} />
        </div>
    );
}

// ── Save The Date ICS ────────────────────────────────────────
function downloadICS(data) {
    const { akad } = data.event;
    const icsContent = [
        "BEGIN:VCALENDAR", "VERSION:2.0",
        "PRODID:-//IkatanCinta//RoseGoldMinimalist//EN",
        "BEGIN:VEVENT",
        `SUMMARY:Pernikahan ${data.couple.groom.nickName} & ${data.couple.bride.nickName}`,
        `DTSTART:${data.event.dateISO.replace(/[-:]/g, "").slice(0, 15)}`,
        `LOCATION:${akad.address}`,
        "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "save-the-date.ics"; a.click();
    URL.revokeObjectURL(url);
}

// ── Countdown Timer (same logic, Rose Gold style) ────────────
function CountdownRG({ targetISO }) {
    const [time, setTime] = useState({});
    const [done, setDone] = useState(false);

    useEffect(() => {
        function tick() {
            const diff = new Date(targetISO) - new Date();
            if (diff <= 0) { setDone(true); return; }
            setTime({
                d: Math.floor(diff / 86400000),
                h: Math.floor((diff % 86400000) / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
            });
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetISO]);

    if (done) return (
        <p style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.accent, fontSize: "1.1rem" }}>
            ✦ Hari Istimewa Telah Tiba ✦
        </p>
    );

    const box = (val, label) => (
        <div key={label} className="flex flex-col items-center">
            <span
                style={{
                    fontFamily: tokens.fonts.serif,
                    fontSize: "2rem",
                    fontWeight: 300,
                    color: tokens.colors.headingText,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                }}
            >
                {String(val).padStart(2, "0")}
            </span>
            <span
                style={{
                    fontFamily: tokens.fonts.sans,
                    fontSize: "0.55rem",
                    letterSpacing: "0.2em",
                    color: tokens.colors.mutedText,
                    textTransform: "uppercase",
                    marginTop: "4px",
                }}
            >
                {label}
            </span>
        </div>
    );

    return (
        <div data-aos="fade-up" className="flex items-end justify-center gap-5 my-4">
            {box(time.d, "Hari")}
            <span style={{ color: tokens.colors.accent, fontSize: "1.4rem", fontWeight: 300, paddingBottom: "18px" }}>:</span>
            {box(time.h, "Jam")}
            <span style={{ color: tokens.colors.accent, fontSize: "1.4rem", fontWeight: 300, paddingBottom: "18px" }}>:</span>
            {box(time.m, "Menit")}
            <span style={{ color: tokens.colors.accent, fontSize: "1.4rem", fontWeight: 300, paddingBottom: "18px" }}>:</span>
            {box(time.s, "Detik")}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
export default function RoseGoldMinimalistTemplate() {
    const { data, loading } = useInvitationData("rose-gold-minimalist");
    const [opened, setOpened] = useState(false);
    const [activeNav, setActiveNav] = useState("hero");
    const [giftOpen, setGiftOpen] = useState(false);
    const [copied, setCopied] = useState(null);

    const { guest, couple, event, copy, lovestory, gallery, features } = data || {};

    useEffect(() => {
        AOS.init({ duration: tokens.aos.duration, offset: tokens.aos.offset, easing: tokens.aos.easing, once: tokens.aos.once });
    }, []);
    useEffect(() => { if (opened) setTimeout(() => AOS.refresh(), 400); }, [opened]);
    useEffect(() => {
        if (!opened) return;
        const ids = ["hero", "mempelai", "acara", "galeri", "lovestory", "rsvp"];
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveNav(e.target.id.replace("section-", "")); }),
            { threshold: 0.3 }
        );
        ids.forEach((id) => { const el = document.getElementById(`section-${id}`); if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [opened]);

    if (loading || !data) {
        return (
            <div style={{ minHeight: "100dvh", background: tokens.colors.pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GeoDivider />
            </div>
        );
    }

    const sec = { width: "100%", padding: "56px 20px", position: "relative", overflow: "hidden" };
    const secAlt = { ...sec, background: tokens.colors.sectionAlt };
    const secWhite = { ...sec, background: tokens.colors.white };
    const btn = {
        background: tokens.colors.accent,
        color: "#FFF",
        fontFamily: tokens.fonts.sans,
        border: "none",
        borderRadius: tokens.radius.button,
        boxShadow: tokens.shadow.button,
        padding: "12px 28px",
        fontSize: "0.85rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        cursor: "pointer",
        transition: "transform 0.2s",
    };

    function navItem(id, icon, label) {
        const active = activeNav === id;
        return (
            <a
                key={id}
                href={`#section-${id}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" }); setActiveNav(id); }}
                style={{ textDecoration: "none" }}
                className="flex flex-col items-center gap-0.5"
                aria-label={label}
            >
                <span className="material-symbols-outlined" style={{ fontSize: "1.2rem", color: active ? tokens.colors.accent : tokens.colors.mutedText }}>{icon}</span>
                <span style={{ fontFamily: tokens.fonts.sans, fontSize: "0.52rem", letterSpacing: "0.06em", color: active ? tokens.colors.accent : tokens.colors.mutedText, fontWeight: active ? 700 : 400, textTransform: "uppercase" }}>{label}</span>
            </a>
        );
    }

    // ── COVER GATE ────────────────────────────────────────────
    if (!opened) {
        return (
            <div style={{ minHeight: "100dvh", background: tokens.colors.pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                    className="relative mx-auto overflow-hidden flex flex-col items-center justify-center"
                    style={{ maxWidth: "430px", minHeight: "100dvh", background: tokens.colors.pageBg, boxShadow: "0 0 60px rgba(92,61,46,0.1)" }}
                >
                    {/* Corner ornaments */}
                    <div className="absolute top-0 left-0 pointer-events-none"><OrnamentCornerTL size={130} /></div>
                    <div className="absolute top-0 right-0 pointer-events-none"><OrnamentCornerTR size={130} /></div>
                    <div className="absolute bottom-0 left-0 pointer-events-none" style={{ transform: "scaleY(-1)" }}><OrnamentCornerTL size={130} /></div>
                    <div className="absolute bottom-0 right-0 pointer-events-none"><OrnamentCornerBR size={130} /></div>

                    {/* Cover photo */}
                    <div style={{ width: "200px", height: "260px", borderRadius: "100px 100px 60px 60px", overflow: "hidden", boxShadow: tokens.shadow.photo, border: `4px solid #fff`, marginBottom: "28px" }}>
                        <img
                            src={couple.heroPhoto || "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=500&q=80"}
                            alt="Foto Couple" className="w-full h-full object-cover"
                        />
                    </div>

                    <p style={{ fontFamily: tokens.fonts.sans, letterSpacing: "0.3em", color: tokens.colors.mutedText, fontSize: "0.65rem", textTransform: "uppercase", marginBottom: "8px" }}>
                        Wedding Invitation
                    </p>

                    <h1 style={{ fontFamily: tokens.fonts.script, color: tokens.colors.headingText, fontSize: "clamp(2.4rem, 8vw, 3.2rem)", lineHeight: 1.1, textAlign: "center" }}>
                        {couple.groom.nickName}
                    </h1>
                    <p style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.mutedText, fontSize: "1.4rem", margin: "2px 0" }}>&amp;</p>
                    <h1 style={{ fontFamily: tokens.fonts.script, color: tokens.colors.headingText, fontSize: "clamp(2.4rem, 8vw, 3.2rem)", lineHeight: 1.1, textAlign: "center", marginBottom: "20px" }}>
                        {couple.bride.nickName}
                    </h1>

                    <GeoDivider />

                    <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.75rem", color: tokens.colors.bodyText, textAlign: "center", marginBottom: "4px" }}>
                        Kepada Yth.
                    </p>
                    <p style={{ fontFamily: tokens.fonts.serif, fontSize: "1.2rem", color: tokens.colors.headingText, textAlign: "center", marginBottom: "32px" }}>
                        {guest.greetingLabel} {guest.name}
                    </p>

                    <button
                        onClick={() => setOpened(true)}
                        style={{ ...btn, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <span className="material-symbols-outlined text-sm">mail_open</span>
                        Buka Undangan
                    </button>
                </div>

                {/* Cormorant Garamond + Lato */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Lato:wght@300;400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
            </div>
        );
    }

    // ── MAIN CONTENT ─────────────────────────────────────────
    return (
        <div style={{ minHeight: "100dvh", background: tokens.colors.pageBg, fontFamily: tokens.fonts.sans }}>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Lato:wght@300;400;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />

            <div className="relative mx-auto overflow-hidden" style={{ maxWidth: "430px", minHeight: "100dvh", background: tokens.colors.pageBg, boxShadow: "0 0 60px rgba(92,61,46,0.1)" }}>

                {/* SECTION 1 — HERO */}
                <section id="section-hero" style={{ ...sec, background: `linear-gradient(180deg, ${tokens.colors.sectionAlt} 0%, ${tokens.colors.white} 100%)`, textAlign: "center", paddingTop: "64px" }}>
                    <div className="absolute top-0 left-0 pointer-events-none"><OrnamentCornerTL size={120} /></div>
                    <div className="absolute top-0 right-0 pointer-events-none"><OrnamentCornerTR size={120} /></div>

                    <p data-aos="fade-down" style={{ fontFamily: tokens.fonts.sans, letterSpacing: "0.3em", color: tokens.colors.mutedText, fontSize: "0.6rem", textTransform: "uppercase", marginBottom: "16px" }}>
                        Wedding Of
                    </p>

                    <div data-aos="zoom-in" data-aos-delay="100" style={{ width: "170px", height: "215px", borderRadius: "85px 85px 50px 50px", overflow: "hidden", boxShadow: tokens.shadow.photo, border: "4px solid #fff", margin: "0 auto 24px" }}>
                        <img src={couple.heroPhoto || "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=500&q=80"} alt="Foto Couple" className="w-full h-full object-cover" />
                    </div>

                    <h1 data-aos="fade-up" data-aos-delay="150" style={{ fontFamily: tokens.fonts.script, color: tokens.colors.headingText, fontSize: "clamp(2.2rem, 7vw, 3rem)", lineHeight: 1.1, fontWeight: 400 }}>
                        {couple.groom.nickName}
                    </h1>
                    <p data-aos="fade-up" data-aos-delay="170" style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.mutedText, fontSize: "1.4rem", margin: "2px 0" }}>&amp;</p>
                    <h1 data-aos="fade-up" data-aos-delay="190" style={{ fontFamily: tokens.fonts.script, color: tokens.colors.headingText, fontSize: "clamp(2.2rem, 7vw, 3rem)", lineHeight: 1.1, fontWeight: 400, marginBottom: "24px" }}>
                        {couple.bride.nickName}
                    </h1>

                    <GeoDivider />

                    {features.countdownEnabled && <CountdownRG targetISO={event.dateISO} />}

                    <p data-aos="fade-up" data-aos-delay="250" style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.bodyText, fontSize: "0.9rem", marginTop: "8px" }}>
                        {event.akad.date}
                    </p>

                    {features.saveTheDateEnabled && (
                        <button data-aos="fade-up" data-aos-delay="300" onClick={() => downloadICS(data)} style={{ ...btn, marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                            Save The Date
                        </button>
                    )}
                </section>

                {/* SECTION 2 — PEMBUKA + MEMPELAI */}
                <section id="section-mempelai" style={secAlt}>
                    <div data-aos="fade-up" className="text-center mb-8">
                        <p style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.headingText, fontSize: "1rem", fontWeight: 600, marginBottom: "8px" }}>{copy.openingGreeting}</p>
                        <GeoDivider />
                        <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.bodyText, fontSize: "0.85rem", lineHeight: 1.7, maxWidth: "320px", margin: "0 auto" }}>{copy.openingText}</p>
                    </div>

                    <div data-aos="fade-up" style={{ textAlign: "center", marginBottom: "32px" }}>
                        <p style={{ fontFamily: tokens.fonts.sans, letterSpacing: "0.2em", color: tokens.colors.mutedText, fontSize: "0.6rem", textTransform: "uppercase", marginBottom: "4px" }}>Mempelai</p>
                        <div style={{ width: "40px", height: "1px", background: tokens.colors.accent, margin: "0 auto" }} />
                    </div>

                    {/* Groom card */}
                    {[
                        { role: "Mempelai Pria", person: couple.groom },
                        { role: "Mempelai Wanita", person: couple.bride },
                    ].map(({ role, person }, i) => (
                        <div key={i} data-aos={i === 0 ? "fade-right" : "fade-left"} data-aos-delay={i * 100}
                            style={{ background: tokens.colors.cardBg, border: `1px solid ${tokens.colors.cardBorder}`, borderRadius: "16px", padding: "24px 20px", marginBottom: "16px", textAlign: "center", boxShadow: tokens.shadow.card }}
                        >
                            {person.photo ? (
                                <div style={{ width: "80px", height: "100px", borderRadius: "40px 40px 20px 20px", overflow: "hidden", margin: "0 auto 16px", border: `3px solid ${tokens.colors.accentSoft}` }}>
                                    <img src={person.photo} alt={person.nickName} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: tokens.colors.accentSoft, border: `2px solid ${tokens.colors.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontFamily: tokens.fonts.script, fontSize: "2rem", color: tokens.colors.accent }}>
                                    {person.nickName?.charAt(0)}
                                </div>
                            )}
                            <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: tokens.colors.mutedText, marginBottom: "4px", textTransform: "uppercase" }}>{role}</p>
                            <h3 style={{ fontFamily: tokens.fonts.script, fontSize: "1.8rem", color: tokens.colors.headingText, fontWeight: 400, lineHeight: 1.2 }}>{person.nameFull}</h3>
                            {person.instagram && (
                                <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.75rem", color: tokens.colors.accent, marginTop: "6px" }}>@{person.instagram}</p>
                            )}
                            {person.parentInfo && (
                                <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.78rem", color: tokens.colors.bodyText, marginTop: "10px", lineHeight: 1.5 }}>Putra/Putri dari:<br /><strong>{person.parentInfo}</strong></p>
                            )}
                        </div>
                    ))}

                    <div className="absolute bottom-0 left-0 pointer-events-none" style={{ transform: "scaleY(-1)" }}><OrnamentCornerTL size={100} /></div>
                    <div className="absolute bottom-0 right-0 pointer-events-none"><OrnamentCornerBR size={100} /></div>
                </section>

                {/* SECTION 3 — QUOTE */}
                <section style={{ ...secWhite, textAlign: "center", background: `linear-gradient(135deg, ${tokens.colors.accentSoft} 0%, ${tokens.colors.white} 100%)` }}>
                    <div data-aos="fade-up" style={{ padding: "0 16px" }}>
                        <p style={{ fontFamily: tokens.fonts.serif, fontStyle: "italic", color: tokens.colors.bodyText, fontSize: "1rem", lineHeight: 1.8, marginBottom: "12px" }}>{copy.quote}</p>
                        <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.7rem", letterSpacing: "0.1em", color: tokens.colors.accent }}>— {copy.quoteSource}</p>
                    </div>
                    <GeoDivider />
                </section>

                {/* SECTION 4 — JADWAL ACARA */}
                <section id="section-acara" style={secAlt}>
                    <div data-aos="fade-up" className="text-center mb-6">
                        <p style={{ fontFamily: tokens.fonts.sans, letterSpacing: "0.2em", color: tokens.colors.mutedText, fontSize: "0.6rem", textTransform: "uppercase", marginBottom: "4px" }}>Jadwal Acara</p>
                        <div style={{ width: "40px", height: "1px", background: tokens.colors.accent, margin: "0 auto 16px" }} />
                    </div>

                    {[
                        { type: "Akad Nikah", icon: "mosque", ev: event.akad },
                        { type: "Resepsi", icon: "celebration", ev: event.resepsi },
                    ].map(({ type, icon, ev }, i) => (
                        ev && (
                            <div key={i} data-aos="fade-up" data-aos-delay={i * 100}
                                style={{ background: tokens.colors.white, border: `1px solid ${tokens.colors.cardBorder}`, borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: tokens.shadow.card }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                    <span className="material-symbols-outlined" style={{ color: tokens.colors.accent, fontSize: "1.1rem" }}>{icon}</span>
                                    <h3 style={{ fontFamily: tokens.fonts.serif, fontSize: "1.1rem", color: tokens.colors.headingText, fontWeight: 600 }}>{type}</h3>
                                </div>
                                <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.85rem", color: tokens.colors.bodyText, marginBottom: "4px" }}>{ev.date}</p>
                                <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.8rem", color: tokens.colors.mutedText, marginBottom: "10px" }}>{ev.time}</p>
                                {ev.address && <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.78rem", color: tokens.colors.bodyText, marginBottom: "12px", lineHeight: 1.5 }}>{ev.address}</p>}
                                {ev.mapsUrl && (
                                    <a href={ev.mapsUrl} target="_blank" rel="noreferrer"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: tokens.fonts.sans, fontSize: "0.75rem", color: tokens.colors.accent, textDecoration: "none", border: `1px solid ${tokens.colors.cardBorder}`, borderRadius: "999px", padding: "6px 14px" }}>
                                        <span className="material-symbols-outlined text-sm">map</span>Lihat Lokasi
                                    </a>
                                )}
                            </div>
                        )
                    ))}
                </section>

                {/* SECTION 5 — GALERI */}
                <section id="section-galeri" style={secWhite}>
                    <div data-aos="fade-up" className="text-center mb-6">
                        <p style={{ fontFamily: tokens.fonts.sans, letterSpacing: "0.2em", color: tokens.colors.mutedText, fontSize: "0.6rem", textTransform: "uppercase", marginBottom: "4px" }}>Galeri Foto</p>
                        <div style={{ width: "40px", height: "1px", background: tokens.colors.accent, margin: "0 auto" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {(gallery.length > 0 ? gallery : [
                            "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=300&q=60",
                            "https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=300&q=60",
                            "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?auto=format&fit=crop&w=300&q=60",
                            "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=300&q=60",
                        ]).slice(0, 6).map((src, i) => (
                            <div key={i} data-aos="zoom-in" data-aos-delay={i * 60}
                                style={{ aspectRatio: "1", borderRadius: "12px", overflow: "hidden", boxShadow: tokens.shadow.card }}>
                                <img src={src} alt={`Galeri ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 6 — LOVE STORY */}
                <section id="section-lovestory" style={secAlt}>
                    <div data-aos="fade-up" className="text-center mb-6">
                        <p style={{ fontFamily: tokens.fonts.script, fontSize: "1.6rem", color: tokens.colors.headingText, fontWeight: 400 }}>Our Story</p>
                        <GeoDivider />
                    </div>
                    {lovestory.map((item, i) => (
                        <div key={i} data-aos={i % 2 === 0 ? "fade-right" : "fade-left"} data-aos-delay={i * 80}
                            style={{ display: "flex", gap: "16px", marginBottom: "28px", alignItems: "flex-start" }}>
                            <div style={{ flexShrink: 0, width: "36px", height: "36px", borderRadius: "50%", background: tokens.colors.accentSoft, border: `1.5px solid ${tokens.colors.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: tokens.colors.accent }}>favorite</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                {item.date && <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.65rem", color: tokens.colors.accent, letterSpacing: "0.1em", marginBottom: "2px" }}>{item.date}</p>}
                                <p style={{ fontFamily: tokens.fonts.serif, fontSize: "1rem", color: tokens.colors.headingText, fontWeight: 600, marginBottom: "4px" }}>{item.title}</p>
                                <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.8rem", color: tokens.colors.bodyText, lineHeight: 1.6 }}>{item.text}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* SECTION 7 — GIFT (if enabled) */}
                {features.digitalEnvelopeEnabled && (
                    <section style={secWhite}>
                        <div data-aos="fade-up" style={{ textAlign: "center" }}>
                            <p style={{ fontFamily: tokens.fonts.script, fontSize: "1.6rem", color: tokens.colors.headingText, fontWeight: 400 }}>Amplop Digital</p>
                            <GeoDivider />
                            <button onClick={() => setGiftOpen(true)} style={{ ...btn, display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                <span className="material-symbols-outlined text-sm">redeem</span>
                                Kirim Gift
                            </button>
                        </div>
                        {giftOpen && (
                            <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(92,61,46,0.4)" }} onClick={() => setGiftOpen(false)}>
                                <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "430px", margin: "0 auto", background: "#FFF", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px" }}>
                                    <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-6" />
                                    <p style={{ fontFamily: tokens.fonts.script, fontSize: "1.4rem", color: tokens.colors.headingText, textAlign: "center", marginBottom: "16px" }}>Rekening Gift</p>
                                    {features.digitalEnvelopeInfo.bankList.map((bank, i) => (
                                        <div key={i} style={{ background: tokens.colors.sectionAlt, borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                                            <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.7rem", color: tokens.colors.mutedText, marginBottom: "4px" }}>{bank.bank}</p>
                                            <p style={{ fontFamily: tokens.fonts.sans, fontSize: "1rem", color: tokens.colors.headingText, fontWeight: 700, letterSpacing: "0.06em", marginBottom: "2px" }}>{bank.number}</p>
                                            <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.8rem", color: tokens.colors.bodyText }}>{bank.name}</p>
                                            <button onClick={() => { navigator.clipboard.writeText(bank.number); setCopied(i); setTimeout(() => setCopied(null), 2000); }}
                                                style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: tokens.fonts.sans, fontSize: "0.72rem", color: tokens.colors.accent, background: "transparent", border: `1px solid ${tokens.colors.cardBorder}`, borderRadius: "999px", padding: "4px 12px", cursor: "pointer" }}>
                                                <span className="material-symbols-outlined text-xs">{copied === i ? "check" : "content_copy"}</span>
                                                {copied === i ? "Disalin!" : "Salin"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* SECTION 8 — RSVP / UCAPAN */}
                {features.rsvpEnabled && (
                    <section id="section-rsvp" style={secAlt}>
                        <div data-aos="fade-up" className="text-center mb-6">
                            <p style={{ fontFamily: tokens.fonts.script, fontSize: "1.6rem", color: tokens.colors.headingText, fontWeight: 400 }}>Ucapan &amp; Doa</p>
                            <GeoDivider />
                        </div>
                        <RSVPInline groomNick={couple.groom.nickName} brideNick={couple.bride.nickName} tokens={tokens} btn={btn} />
                    </section>
                )}

                {/* SECTION 9 — PENUTUP */}
                <section style={{ ...sec, background: `linear-gradient(180deg, ${tokens.colors.white} 0%, ${tokens.colors.sectionAlt} 100%)`, textAlign: "center", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)" }}>
                    <div className="absolute top-0 left-0 pointer-events-none"><OrnamentCornerTL size={110} /></div>
                    <div className="absolute top-0 right-0 pointer-events-none"><OrnamentCornerTR size={110} /></div>

                    <div data-aos="zoom-in" style={{ width: "140px", height: "180px", borderRadius: "70px 70px 35px 35px", overflow: "hidden", boxShadow: tokens.shadow.photo, border: "4px solid #fff", margin: "0 auto 20px" }}>
                        <img src={couple.heroPhoto || "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=500&q=80"} alt="Penutup" className="w-full h-full object-cover" />
                    </div>

                    <GeoDivider />

                    <h2 data-aos="fade-up" style={{ fontFamily: tokens.fonts.script, fontSize: "2rem", color: tokens.colors.headingText, fontWeight: 400, marginBottom: "12px" }}>
                        {couple.groom.nickName} &amp; {couple.bride.nickName}
                    </h2>
                    <p data-aos="fade-up" data-aos-delay="100" style={{ fontFamily: tokens.fonts.sans, fontSize: "0.82rem", color: tokens.colors.bodyText, maxWidth: "280px", margin: "0 auto 20px", lineHeight: 1.7 }}>{copy.closingText}</p>
                    <p data-aos="fade-up" data-aos-delay="150" style={{ fontFamily: tokens.fonts.sans, fontWeight: 700, color: tokens.colors.headingText, fontSize: "0.85rem" }}>{copy.openingGreeting}</p>

                    <GeoDivider />

                    <div data-aos="fade-up" data-aos-delay="200">
                        <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.6rem", color: tokens.colors.mutedText, marginBottom: "2px" }}>powered by</p>
                        <p style={{ fontFamily: tokens.fonts.sans, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", color: tokens.colors.accent }}>IKATANCINTA.IN</p>
                    </div>
                </section>

                {/* ── FLOATING BOTTOM NAV ────────────────────────── */}
                <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50"
                    style={{ width: "calc(100% - 32px)", maxWidth: "390px", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
                    <div className="flex items-center justify-around px-4 py-2.5 rounded-full mb-3"
                        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", boxShadow: "0 4px 24px rgba(92,61,46,0.12)", border: `1px solid ${tokens.colors.cardBorder}` }}>
                        {navItem("hero", "favorite", "Couple")}
                        {navItem("acara", "calendar_month", "Acara")}
                        {navItem("galeri", "photo_library", "Galeri")}
                        {navItem("lovestory", "auto_stories", "Kisah")}
                        {navItem("rsvp", "edit_note", "Ucapan")}
                    </div>
                </nav>
            </div>
        </div>
    );
}

// ── Inline RSVP (simple local state) ─────────────────────────
function RSVPInline({ groomNick, brideNick, tokens, btn }) {
    const [name, setName] = useState("");
    const [msg, setMsg] = useState("");
    const [hadir, setHadir] = useState(null);
    const [comments, setComments] = useState([
        { name: "Kinan & Nanda", msg: `Selamat ya ${groomNick} & ${brideNick}! Semoga selalu bahagia.`, hadir: true },
    ]);

    function submit(e) {
        e.preventDefault();
        if (!name || !msg || hadir === null) return;
        setComments([{ name, msg, hadir }, ...comments]);
        setName(""); setMsg(""); setHadir(null);
    }

    const input = {
        width: "100%", fontFamily: tokens.fonts.sans, fontSize: "0.85rem", background: tokens.colors.sectionAlt,
        border: `1px solid ${tokens.colors.cardBorder}`, borderRadius: "10px", padding: "12px 14px",
        color: tokens.colors.bodyText, outline: "none",
    };

    return (
        <div>
            <form onSubmit={submit} className="flex flex-col gap-3 mb-6">
                <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" required />
                <textarea style={{ ...input, resize: "none" }} rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Tulis ucapan..." required />
                <div className="flex gap-2">
                    {["Hadir", "Tidak Hadir"].map((label, i) => (
                        <button key={label} type="button" onClick={() => setHadir(i === 0)}
                            style={{ flex: 1, padding: "10px", borderRadius: "10px", fontFamily: tokens.fonts.sans, fontSize: "0.8rem", fontWeight: 600, border: `1px solid ${tokens.colors.cardBorder}`, cursor: "pointer", transition: "all 0.2s", background: hadir === (i === 0) ? tokens.colors.accent : tokens.colors.sectionAlt, color: hadir === (i === 0) ? "#fff" : tokens.colors.bodyText }}>
                            {label}
                        </button>
                    ))}
                </div>
                <button type="submit" style={{ ...btn, width: "100%", justifyContent: "center", display: "flex" }}>Kirim Ucapan</button>
            </form>

            <div className="flex flex-col gap-3">
                {comments.map((c, i) => (
                    <div key={i} style={{ background: tokens.colors.white, border: `1px solid ${tokens.colors.cardBorder}`, borderRadius: "12px", padding: "14px 16px" }}>
                        <div className="flex items-center justify-between mb-1">
                            <span style={{ fontFamily: tokens.fonts.sans, fontWeight: 700, fontSize: "0.82rem", color: tokens.colors.headingText }}>{c.name}</span>
                            <span style={{ fontFamily: tokens.fonts.sans, fontSize: "0.65rem", color: c.hadir ? tokens.colors.accent : "#999", background: c.hadir ? tokens.colors.accentSoft : "#f5f5f5", padding: "2px 8px", borderRadius: "999px" }}>
                                {c.hadir ? "Hadir" : "Tidak Hadir"}
                            </span>
                        </div>
                        <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.8rem", color: tokens.colors.bodyText, lineHeight: 1.6 }}>{c.msg}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
