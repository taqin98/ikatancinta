import { tokens } from "../tokens";

export default function LiveStreaming({ date, time, platformLabel, url, aos }) {
    return (
        <div
            data-aos={aos}
            className="rounded-2xl p-6 text-center"
            style={{
                background: tokens.colors.cardBg,
                border: `1px solid ${tokens.colors.cardBorder}`,
                boxShadow: tokens.shadow.card,
            }}
        >
            {/* Icon */}
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: tokens.colors.accentSoft }}
            >
                <span className="material-symbols-outlined text-2xl" style={{ color: tokens.colors.accent }}>
                    live_tv
                </span>
            </div>

            <h3
                style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.headingText, fontSize: "1.2rem" }}
                className="font-bold italic mb-2"
            >
                Live Streaming
            </h3>

            <p className="text-xs leading-relaxed mb-3" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText }}>
                Bagi Bapak/Ibu/Saudara/i yang tidak dapat hadir, saksikan prosesi pernikahan kami secara langsung melalui:
            </p>

            <p className="text-sm font-semibold mb-0.5" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.headingText }}>
                {platformLabel}
            </p>
            <p className="text-xs mb-1" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.bodyText }}>
                {date}
            </p>
            <p className="text-xs mb-4 inline-flex items-center gap-1" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText }}>
                <span className="material-symbols-outlined text-xs" style={{ color: tokens.colors.accent }}>schedule</span>
                {time}
            </p>

            <div>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                        background: tokens.colors.accent,
                        color: tokens.colors.white,
                        fontFamily: tokens.fonts.sans,
                        boxShadow: tokens.shadow.button,
                        textDecoration: "none",
                    }}
                >
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                    Klik Disini
                </a>
            </div>
        </div>
    );
}
