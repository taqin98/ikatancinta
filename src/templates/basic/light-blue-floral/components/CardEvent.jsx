import { tokens } from "../tokens";

export default function CardEvent({ type = "akad", date, time, address, mapsUrl, aos, aosDelay }) {
    const isAkad = type === "akad";
    const icon = isAkad ? "mosque" : "celebration";
    const label = isAkad ? "Akad Nikah" : "Resepsi";

    return (
        <div
            data-aos={aos}
            data-aos-delay={aosDelay}
            style={{
                background: tokens.colors.cardBg,
                border: `1px solid ${tokens.colors.cardBorder}`,
                borderRadius: tokens.radius.card,
                boxShadow: tokens.shadow.card,
            }}
            className="p-6 text-center"
        >
            {/* Icon badge */}
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: tokens.colors.accentSoft }}
            >
                <span className="material-symbols-outlined text-xl" style={{ color: tokens.colors.accent }}>
                    {icon}
                </span>
            </div>

            {/* Label */}
            <h3
                style={{
                    fontFamily: tokens.fonts.serif,
                    color: tokens.colors.headingText,
                    fontSize: "1.35rem",
                    fontWeight: 700,
                }}
                className="mb-3 italic"
            >
                {label}
            </h3>

            {/* Divider */}
            <div
                className="h-px w-16 mx-auto mb-3"
                style={{ background: tokens.colors.divider }}
            />

            {/* Date */}
            <p
                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.headingText, fontWeight: 600 }}
                className="text-sm mb-1"
            >
                {date}
            </p>

            {/* Time */}
            <p
                className="text-sm mb-2 inline-flex items-center gap-1"
                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.bodyText }}
            >
                <span className="material-symbols-outlined text-sm" style={{ color: tokens.colors.accent }}>
                    schedule
                </span>
                {time}
            </p>

            {/* Address */}
            <p
                className="text-xs leading-relaxed mb-4"
                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText }}
            >
                <span className="material-symbols-outlined text-xs" style={{ color: tokens.colors.accent }}>
                    location_on
                </span>{" "}
                {address}
            </p>

            {/* Map button */}
            {mapsUrl && (
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full transition-all"
                    style={{
                        background: tokens.colors.accent,
                        color: tokens.colors.white,
                        fontFamily: tokens.fonts.sans,
                        boxShadow: tokens.shadow.button,
                    }}
                >
                    <span className="material-symbols-outlined text-sm">map</span>
                    Lihat Lokasi
                </a>
            )}
        </div>
    );
}
