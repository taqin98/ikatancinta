import { tokens } from "../tokens";

export default function CoupleCard({ role, nameFull, nickName, parentInfo, instagram, photo, aos, aosDelay }) {
    const initials = nameFull
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("");

    return (
        <div
            data-aos={aos}
            data-aos-delay={aosDelay}
            className="flex flex-col items-center text-center"
        >
            {/* Photo */}
            <div
                className="relative mb-4"
                style={{
                    width: "140px",
                    height: "168px",
                }}
            >
                {/* Decorative ring */}
                <div
                    className="absolute inset-0 rounded-[50%_50%_40%_40%/55%_55%_45%_45%]"
                    style={{ border: `2px solid ${tokens.colors.cardBorder}`, transform: "scale(1.06)" }}
                />
                {photo ? (
                    <img
                        src={photo}
                        alt={`Foto ${nameFull}`}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: "50% 50% 40% 40% / 55% 55% 45% 45%" }}
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                            background: tokens.colors.accentSoft,
                            borderRadius: "50% 50% 40% 40% / 55% 55% 45% 45%",
                            fontFamily: tokens.fonts.serif,
                            color: tokens.colors.accent,
                            fontSize: "2.5rem",
                            fontWeight: 700,
                        }}
                    >
                        {initials}
                    </div>
                )}
            </div>

            {/* Instagram chip */}
            {instagram && (
                <a
                    href={`https://instagram.com/${instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs mb-2 px-3 py-1 rounded-full"
                    style={{
                        color: tokens.colors.accent,
                        background: tokens.colors.accentSoft,
                        fontFamily: tokens.fonts.sans,
                        border: `1px solid ${tokens.colors.cardBorder}`,
                        textDecoration: "none",
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    @{nickName.toLowerCase()}
                </a>
            )}

            {/* Name */}
            <h3
                style={{
                    fontFamily: tokens.fonts.script,
                    color: tokens.colors.headingText,
                    fontSize: "1.85rem",
                    lineHeight: 1.1,
                }}
                className="mb-1"
            >
                {nameFull}
            </h3>

            {/* Role */}
            <p
                className="text-xs uppercase tracking-widest mb-2"
                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.accent }}
            >
                {role === "groom" ? "Mempelai Pria" : "Mempelai Wanita"}
            </p>

            {/* Parent info */}
            <p
                className="text-xs leading-relaxed"
                style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText, maxWidth: "220px" }}
            >
                {parentInfo}
            </p>
        </div>
    );
}
