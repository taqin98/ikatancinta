import { useEffect, useState } from "react";
import { tokens } from "../tokens";

function getTimeLeft(targetISO) {
    const diff = new Date(targetISO) - Date.now();
    if (diff <= 0) {
        return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const total = Math.floor(diff / 1000);
    return {
        done: false,
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    };
}

function box(value, label, delay) {
    return (
        <div
            key={label}
            data-aos="fade-up"
            data-aos-delay={delay}
            style={{
                borderRadius: tokens.radius.pill,
                border: `1px solid ${tokens.colors.cardBorder}`,
                background: tokens.colors.white,
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                padding: "11px 6px",
                textAlign: "center",
                minHeight: "72px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            <span style={{ fontFamily: tokens.fonts.display, color: tokens.colors.primaryBrown, fontWeight: 700, fontSize: "1.15rem", lineHeight: 1 }}>
                {String(value).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: tokens.fonts.sans, fontSize: "0.62rem", color: tokens.colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {label}
            </span>
        </div>
    );
}

export default function CountdownPills({ targetISO }) {
    const [time, setTime] = useState(() => getTimeLeft(targetISO));

    useEffect(() => {
        const id = setInterval(() => setTime(getTimeLeft(targetISO)), 1000);
        return () => clearInterval(id);
    }, [targetISO]);

    if (time.done) {
        return (
            <p data-aos="fade-up" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.primaryBrown, fontWeight: 600 }}>
                Hari istimewa telah tiba.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-2.5" style={{ width: "100%", maxWidth: "390px", margin: "0 auto" }}>
            {box(time.days, "Hari", 0)}
            {box(time.hours, "Jam", 100)}
            {box(time.minutes, "Menit", 200)}
            {box(time.seconds, "Detik", 300)}
        </div>
    );
}
