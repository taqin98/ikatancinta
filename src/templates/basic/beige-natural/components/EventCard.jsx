import ButtonPill from "./ButtonPill";
import { tokens } from "../tokens";

export default function EventCard({ title, date, time, address, mapsUrl, delay = 0 }) {
    return (
        <article
            data-aos="fade-up"
            data-aos-delay={delay}
            style={{
                borderRadius: tokens.radius.card,
                background: tokens.colors.cardBg,
                border: `1px solid ${tokens.colors.cardBorder}`,
                boxShadow: tokens.shadow.card,
                padding: "20px",
            }}
        >
            <h3
                style={{
                    fontFamily: tokens.fonts.script,
                    color: tokens.colors.primaryBrown,
                    fontSize: "2rem",
                    lineHeight: 1,
                    marginBottom: "8px",
                    textAlign: "center",
                }}
            >
                {title}
            </h3>
            <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.textDark, fontSize: "0.9rem", fontWeight: 600, textAlign: "center" }}>
                {date}
            </p>
            <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.textMuted, fontSize: "0.82rem", textAlign: "center", marginBottom: "8px" }}>
                {time}
            </p>
            <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.textDark, fontSize: "0.82rem", lineHeight: 1.7, textAlign: "center", marginBottom: "14px" }}>
                {address}
            </p>
            {mapsUrl ? (
                <div className="text-center">
                    <ButtonPill href={mapsUrl} icon="location_on" style={{ padding: "10px 18px", fontSize: "0.78rem" }}>
                        Lihat Lokasi
                    </ButtonPill>
                </div>
            ) : null}
        </article>
    );
}
