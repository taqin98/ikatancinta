import { tokens } from "../tokens";

const PLACEHOLDER_PHOTOS = [
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=500&q=80",
    "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=500&q=80",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=500&q=80",
];

export default function LoveStoryItem({ title, date, text, photo, index }) {
    const isLeft = index % 2 === 0;
    const photoSrc = photo || PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length];

    return (
        <div
            className="flex flex-col items-center mb-10"
            data-aos={isLeft ? "fade-right" : "fade-left"}
            data-aos-delay={index * 100}
        >
            {/* Photo — portrait "door" shape */}
            <div
                className="relative mb-4 overflow-hidden"
                style={{
                    width: "150px",
                    height: "210px",
                    borderRadius: "75px 75px 16px 16px",
                    boxShadow: tokens.shadow.photo,
                    border: `3px solid ${tokens.colors.white}`,
                }}
            >
                <img
                    src={photoSrc}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                {/* Subtle overlay */}
                <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to bottom, rgba(91,141,184,0.08), rgba(36,59,85,0.12))" }}
                />
            </div>

            {/* Date badge */}
            {date && (
                <span
                    className="text-xs px-3 py-0.5 rounded-full mb-2"
                    style={{
                        background: tokens.colors.accentSoft,
                        color: tokens.colors.accent,
                        fontFamily: tokens.fonts.sans,
                        border: `1px solid ${tokens.colors.cardBorder}`,
                        fontWeight: 600,
                    }}
                >
                    {date}
                </span>
            )}

            {/* Title */}
            <h3
                style={{
                    fontFamily: tokens.fonts.serif,
                    color: tokens.colors.headingText,
                    fontSize: "1.2rem",
                    fontWeight: 700,
                }}
                className="italic mb-2 text-center"
            >
                {title}
            </h3>

            {/* Timeline line dot */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-px" style={{ background: tokens.colors.divider }} />
                <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: tokens.colors.accent }}
                />
                <div className="w-10 h-px" style={{ background: tokens.colors.divider }} />
            </div>

            {/* Text */}
            <p
                className="text-center text-xs leading-relaxed max-w-[260px]"
                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.bodyText }}
            >
                {text}
            </p>
        </div>
    );
}
