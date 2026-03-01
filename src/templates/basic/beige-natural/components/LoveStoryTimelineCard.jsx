import { tokens } from "../tokens";

export default function LoveStoryTimelineCard({ items = [] }) {
    return (
        <article
            data-aos="fade-up"
            style={{
                borderRadius: tokens.radius.card,
                border: `1px solid ${tokens.colors.cardBorder}`,
                background: tokens.colors.white,
                boxShadow: tokens.shadow.card,
                padding: "22px 18px",
            }}
        >
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <div key={`${item.title}-${index}`} style={{ marginBottom: isLast ? 0 : "18px", paddingBottom: isLast ? 0 : "18px", borderBottom: isLast ? "none" : `1px dashed ${tokens.colors.divider}` }}>
                        <h4 style={{ fontFamily: tokens.fonts.script, color: tokens.colors.primaryBrown, fontSize: "1.7rem", lineHeight: 1.1, marginBottom: "4px" }}>
                            {item.title}
                        </h4>
                        {item.date ? (
                            <p style={{ fontFamily: tokens.fonts.display, fontSize: "0.72rem", color: tokens.colors.textSoft, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
                                {item.date}
                            </p>
                        ) : null}
                        <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.textDark, fontSize: "0.85rem", lineHeight: 1.75 }}>
                            {item.text}
                        </p>
                    </div>
                );
            })}
        </article>
    );
}
