import { useEffect, useState } from "react";
import { tokens } from "../tokens";

function pad(n) {
    return String(n).padStart(2, "0");
}

function getTimeLeft(targetISO) {
    const diff = new Date(targetISO) - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, over: true };
    const totalSec = Math.floor(diff / 1000);
    return {
        days: Math.floor(totalSec / 86400),
        hours: Math.floor((totalSec % 86400) / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
        over: false,
    };
}

function Box({ value, label }) {
    return (
        <div
            className="flex flex-col items-center"
            style={{
                minWidth: "62px",
                background: tokens.colors.cardBg,
                borderRadius: "0.875rem",
                boxShadow: tokens.shadow.countdown,
                border: `1px solid ${tokens.colors.cardBorder}`,
                padding: "10px 8px 8px",
            }}
        >
            <span
                style={{
                    fontFamily: tokens.fonts.serif,
                    color: tokens.colors.accent,
                    fontSize: "2rem",
                    fontWeight: 700,
                    lineHeight: 1,
                }}
            >
                {pad(value)}
            </span>
            <span
                style={{
                    fontFamily: tokens.fonts.sans,
                    color: tokens.colors.mutedText,
                    fontSize: "0.625rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: "4px",
                }}
            >
                {label}
            </span>
        </div>
    );
}

export default function CountdownTimer({ targetISO, aos, aosDelay }) {
    const [time, setTime] = useState(() => getTimeLeft(targetISO));

    useEffect(() => {
        const id = setInterval(() => setTime(getTimeLeft(targetISO)), 1000);
        return () => clearInterval(id);
    }, [targetISO]);

    if (time.over) {
        return (
            <p
                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.accent }}
                className="text-center text-sm font-semibold py-4"
            >
                ✨ Hari Pernikahan telah tiba!
            </p>
        );
    }

    return (
        <div className="flex justify-center gap-3" data-aos={aos} data-aos-delay={aosDelay}>
            <Box value={time.days} label="Hari" />
            <Box value={time.hours} label="Jam" />
            <Box value={time.minutes} label="Menit" />
            <Box value={time.seconds} label="Detik" />
        </div>
    );
}
