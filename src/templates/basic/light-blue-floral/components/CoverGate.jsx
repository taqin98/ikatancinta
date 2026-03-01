import { useEffect, useRef, useState } from "react";
import { tokens } from "../tokens";

const DEC_TL = new URL("../assets/decorations/flower-top-left.webp", import.meta.url).href;
const DEC_TR = new URL("../assets/decorations/flower-top-right.webp", import.meta.url).href;
const DEC_BL = new URL("../assets/decorations/flower-bottom-1.webp", import.meta.url).href;
const DEC_BR = new URL("../assets/decorations/flower-bottom-2.webp", import.meta.url).href;
const DEC_FR = new URL("../assets/decorations/flower-frame-left.webp", import.meta.url).href;

const COVER_IMAGE =
    "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=800&q=85";

export default function CoverGate({ guestName = "Tamu Undangan", greetingLabel = "Kepada Bapak/Ibu/Saudara/i", groomNick, brideNick, onOpen }) {
    const [fading, setFading] = useState(false);
    const coverRef = useRef(null);

    function handleOpen() {
        setFading(true);
        setTimeout(() => {
            if (onOpen) onOpen();
            const hero = document.getElementById("section-hero");
            if (hero) {
                hero.scrollIntoView({ behavior: "smooth" });
            }
        }, 600);
    }

    // Entrance animations via CSS
    useEffect(() => {
        const elements = coverRef.current?.querySelectorAll("[data-entrance]") || [];
        elements.forEach((el, i) => {
            el.style.opacity = "0";
            el.style.transform = "translateY(24px)";
            el.style.transition = "opacity 0.7s ease-out, transform 0.7s ease-out";
            el.style.transitionDelay = `${0.3 + i * 0.15}s`;
            setTimeout(() => {
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
            }, 100);
        });
    }, []);

    return (
        <div
            ref={coverRef}
            id="section-cover"
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
            style={{
                transition: "opacity 0.6s ease-out",
                opacity: fading ? 0 : 1,
                pointerEvents: fading ? "none" : "auto",
            }}
        >
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${COVER_IMAGE}')` }}
                aria-hidden="true"
            />
            {/* Overlay gradient */}
            <div
                className="absolute inset-0"
                style={{ background: tokens.colors.coverOverlay }}
                aria-hidden="true"
            />

            {/* Real floral ornaments on cover */}
            <img src={DEC_TL} alt="" aria-hidden="true" className="absolute top-0 left-0 pointer-events-none select-none" style={{ width: 170, opacity: 0.75, mixBlendMode: "screen" }} />
            <img src={DEC_TR} alt="" aria-hidden="true" className="absolute top-0 right-0 pointer-events-none select-none" style={{ width: 190, opacity: 0.7, mixBlendMode: "screen" }} />
            <img src={DEC_BL} alt="" aria-hidden="true" className="absolute bottom-0 left-0 pointer-events-none select-none" style={{ width: 170, opacity: 0.6, mixBlendMode: "screen", transform: "scaleY(-1)" }} />
            <img src={DEC_BR} alt="" aria-hidden="true" className="absolute bottom-0 right-0 pointer-events-none select-none" style={{ width: 90, opacity: 0.6, mixBlendMode: "screen", transform: "scaleX(-1) scaleY(-1)" }} />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 py-12">
                {/* The wedding of */}
                <p
                    data-entrance
                    style={{ fontFamily: tokens.fonts.sans, color: "rgba(255,255,255,0.8)", letterSpacing: "0.25em" }}
                    className="text-xs uppercase mb-2"
                >
                    THE WEDDING OF
                </p>

                {/* Couple name in script */}
                <h1
                    data-entrance
                    style={{
                        fontFamily: tokens.fonts.script,
                        color: tokens.colors.white,
                        fontSize: "clamp(2.4rem, 8vw, 3.5rem)",
                        lineHeight: 1.15,
                        textShadow: "0 2px 16px rgba(10,30,60,0.4)",
                    }}
                    className="mb-1"
                >
                    {groomNick}
                </h1>
                <p
                    data-entrance
                    style={{ fontFamily: tokens.fonts.sans, color: "rgba(255,255,255,0.65)", fontSize: "1.1rem" }}
                    className="mb-1"
                >
                    &amp;
                </p>
                <h1
                    data-entrance
                    style={{
                        fontFamily: tokens.fonts.script,
                        color: tokens.colors.white,
                        fontSize: "clamp(2.4rem, 8vw, 3.5rem)",
                        lineHeight: 1.15,
                        textShadow: "0 2px 16px rgba(10,30,60,0.4)",
                    }}
                    className="mb-8"
                >
                    {brideNick}
                </h1>

                {/* Divider line */}
                <div
                    data-entrance
                    className="w-20 h-px mb-6"
                    style={{ background: "rgba(255,255,255,0.4)" }}
                />

                {/* Guest label */}
                <p
                    data-entrance
                    style={{ fontFamily: tokens.fonts.sans, color: "rgba(255,255,255,0.7)", fontSize: "0.78rem" }}
                    className="mb-1 uppercase tracking-wider"
                >
                    {greetingLabel}
                </p>
                <p
                    data-entrance
                    style={{
                        fontFamily: tokens.fonts.serif,
                        color: tokens.colors.white,
                        fontSize: "1.3rem",
                        fontWeight: 600,
                        textShadow: "0 1px 8px rgba(10,30,60,0.3)",
                    }}
                    className="mb-10 italic"
                >
                    {guestName}
                </p>

                {/* Open button */}
                <button
                    data-entrance
                    onClick={handleOpen}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{
                        background: "rgba(255,255,255,0.18)",
                        color: tokens.colors.white,
                        border: "1.5px solid rgba(255,255,255,0.55)",
                        fontFamily: tokens.fonts.sans,
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                        letterSpacing: "0.04em",
                    }}
                >
                    <span className="material-symbols-outlined text-base">mail</span>
                    Buka Undangan
                </button>

                {/* Scroll hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50" aria-hidden="true">
                    <span className="material-symbols-outlined text-white text-sm" style={{ animation: "bounce 2s infinite" }}>keyboard_arrow_down</span>
                </div>
            </div>
        </div>
    );
}
