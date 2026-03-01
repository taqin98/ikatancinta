import { tokens } from "../tokens";
import OrnamentCorner from "./OrnamentCorner";
import PhotoFrameArch from "./PhotoFrameArch";

export default function ClosingFooter({ groomNick, brideNick, closingText, openingGreeting, heroPhoto }) {
    return (
        <section
            style={{
                position: "relative",
                overflow: "hidden",
                padding: "58px 20px calc(env(safe-area-inset-bottom, 0px) + 112px)",
                background: `linear-gradient(180deg, ${tokens.colors.white} 0%, ${tokens.colors.pageBg} 100%)`,
                textAlign: "center",
            }}
        >
            <div className="absolute bottom-0 left-0">
                <OrnamentCorner corner="bl" width="34vw" mirrorY style={{ maxWidth: 156 }} opacity={0.86} />
            </div>
            <div className="absolute bottom-0 right-0">
                <OrnamentCorner corner="br" width="34vw" mirrorY style={{ maxWidth: 156 }} opacity={0.86} />
            </div>

            <PhotoFrameArch src={heroPhoto} alt="Foto pasangan penutup" width="170px" height="225px" aos="zoom-in" />

            <p
                data-aos="fade-up"
                style={{
                    marginTop: "12px",
                    fontFamily: tokens.fonts.display,
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    fontSize: "0.68rem",
                    color: tokens.colors.textSoft,
                }}
            >
                Terima Kasih
            </p>

            <h2
                data-aos="zoom-in"
                style={{
                    fontFamily: tokens.fonts.script,
                    color: tokens.colors.primaryBrown,
                    fontSize: "2.5rem",
                    lineHeight: 1,
                    margin: "4px 0 12px",
                }}
            >
                {groomNick} &amp; {brideNick}
            </h2>

            <p
                data-aos="fade-up"
                style={{
                    fontFamily: tokens.fonts.sans,
                    fontSize: "0.84rem",
                    lineHeight: 1.8,
                    color: tokens.colors.textDark,
                    maxWidth: "320px",
                    margin: "0 auto 10px",
                }}
            >
                {closingText}
            </p>

            <p data-aos="fade-up" data-aos-delay="100" style={{ fontFamily: tokens.fonts.sans, fontWeight: 600, color: tokens.colors.primaryBrown, fontSize: "0.82rem" }}>
                {openingGreeting}
            </p>

            <div
                data-aos="fade-up"
                data-aos-delay="160"
                style={{
                    marginTop: "18px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.7)",
                    border: `1px solid ${tokens.colors.cardBorder}`,
                    padding: "10px 12px",
                    display: "inline-flex",
                    flexDirection: "column",
                    gap: "2px",
                }}
            >
                <span style={{ fontFamily: tokens.fonts.sans, fontSize: "0.68rem", color: tokens.colors.textMuted }}>powered by</span>
                <span style={{ fontFamily: tokens.fonts.display, fontSize: "0.72rem", color: tokens.colors.primaryBrown, letterSpacing: "0.14em" }}>
                    IKATANCINTA.IN
                </span>
            </div>
        </section>
    );
}
