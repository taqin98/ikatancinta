import { useState } from "react";
import { tokens } from "../tokens";
import ButtonPill from "./ButtonPill";
import OrnamentCorner from "./OrnamentCorner";
import CoverImage from "../assets/decorations/cover.webp";
import AccentLeafLeft from "../assets/decorations/flower-03.webp";
import AccentLeafRight from "../assets/decorations/flower-04.webp";

const COVER_COORDS = {
    topLeft: { width: "28%", maxWidth: 132, top: "-0.4%", left: "-0.8%" },
    topRight: { width: "28%", maxWidth: 134, top: "-0.4%", right: "-0.8%" },
    bottomLeft: { width: "34%", maxWidth: 156, bottom: "-0.8%", left: "-1.2%" },
    bottomRight: { width: "34%", maxWidth: 156, bottom: "-0.8%", right: "-1.2%" },
    headingTop: "52%",
    namesTop: "58.5%",
    greetingTop: "64%",
    guestTop: "69%",
    buttonTop: "76%",
};

export default function CoverGate({
    guestName = "Nama Tamu",
    greetingLabel = "Kepada Bapak/Ibu/Saudara/i",
    groomNick = "Habib",
    brideNick = "Adiba",
    onOpen,
}) {
    const [fading, setFading] = useState(false);

    function handleOpen() {
        setFading(true);
        setTimeout(() => {
            if (onOpen) onOpen();
        }, 520);
    }

    return (
        <section
            id="section-cover"
            className="relative overflow-hidden"
            style={{
                minHeight: "100dvh",
                background: tokens.colors.pageBg,
                opacity: fading ? 0 : 1,
                pointerEvents: fading ? "none" : "auto",
                transition: "opacity 0.52s ease",
            }}
        >
            <div
                className="absolute left-0 top-0 w-full"
                style={{
                    height: "48%",
                    backgroundImage: `url('${CoverImage}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center top",
                }}
                aria-hidden="true"
            />

            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(246,240,230,0) 36%, rgba(246,240,230,0.52) 52%, rgba(246,240,230,0.95) 74%, #F6F0E6 100%)",
                }}
                aria-hidden="true"
            />

            <div
                className="absolute"
                style={{ top: COVER_COORDS.topLeft.top, left: COVER_COORDS.topLeft.left, width: COVER_COORDS.topLeft.width, maxWidth: COVER_COORDS.topLeft.maxWidth }}
            >
                <OrnamentCorner corner="tl" width="100%" opacity={0.94} />
            </div>
            <div
                className="absolute"
                style={{ top: COVER_COORDS.topRight.top, right: COVER_COORDS.topRight.right, width: COVER_COORDS.topRight.width, maxWidth: COVER_COORDS.topRight.maxWidth }}
            >
                <OrnamentCorner corner="tr" width="100%" opacity={0.94} />
            </div>
            <div
                className="absolute"
                style={{ bottom: COVER_COORDS.bottomLeft.bottom, left: COVER_COORDS.bottomLeft.left, width: COVER_COORDS.bottomLeft.width, maxWidth: COVER_COORDS.bottomLeft.maxWidth }}
            >
                <OrnamentCorner corner="bl" width="100%" mirrorY opacity={0.9} />
            </div>
            <div
                className="absolute"
                style={{ bottom: COVER_COORDS.bottomRight.bottom, right: COVER_COORDS.bottomRight.right, width: COVER_COORDS.bottomRight.width, maxWidth: COVER_COORDS.bottomRight.maxWidth }}
            >
                <OrnamentCorner corner="br" width="100%" mirrorY opacity={0.9} />
            </div>
            <img
                src={AccentLeafLeft}
                alt=""
                aria-hidden="true"
                className="absolute pointer-events-none select-none"
                style={{ bottom: "10.5%", left: "8.5%", width: "12.5%", maxWidth: 58, opacity: 0.56 }}
            />
            <img
                src={AccentLeafRight}
                alt=""
                aria-hidden="true"
                className="absolute pointer-events-none select-none"
                style={{ bottom: "10%", right: "8%", width: "10.8%", maxWidth: 50, opacity: 0.52 }}
            />

            <div className="absolute inset-0 text-center px-6">
                <p
                    data-aos="fade-down"
                    style={{
                        position: "absolute",
                        top: COVER_COORDS.headingTop,
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontFamily: tokens.fonts.display,
                        letterSpacing: "0.24em",
                        fontSize: "0.68rem",
                        color: tokens.colors.primaryBrown,
                        textTransform: "uppercase",
                        width: "90%",
                    }}
                >
                    The Wedding Of
                </p>

                <div
                    style={{
                        position: "absolute",
                        top: COVER_COORDS.namesTop,
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "90%",
                    }}
                >
                    <h1
                        data-aos="fade-up"
                        style={{
                            fontFamily: tokens.fonts.script,
                            color: tokens.colors.primaryBrown,
                            fontSize: "clamp(2.5rem, 10vw, 3.4rem)",
                            lineHeight: 1.06,
                        }}
                    >
                        {groomNick} &amp; {brideNick}
                    </h1>
                </div>

                <p
                    data-aos="fade-up"
                    data-aos-delay="100"
                    style={{
                        position: "absolute",
                        top: COVER_COORDS.greetingTop,
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontFamily: tokens.fonts.sans,
                        fontSize: "0.84rem",
                        color: tokens.colors.textMuted,
                        width: "90%",
                    }}
                >
                    {greetingLabel}
                </p>

                <p
                    data-aos="fade-up"
                    data-aos-delay="160"
                    style={{
                        position: "absolute",
                        top: COVER_COORDS.guestTop,
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontFamily: tokens.fonts.sans,
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: tokens.colors.textDark,
                        width: "90%",
                    }}
                >
                    {guestName}
                </p>

                <div
                    style={{
                        position: "absolute",
                        top: COVER_COORDS.buttonTop,
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "clamp(210px, 42%, 250px)",
                    }}
                >
                    <ButtonPill onClick={handleOpen} icon="mail" dataAos="zoom-in" dataAosDelay="200" style={{ width: "100%", whiteSpace: "nowrap" }}>
                        Buka Undangan
                    </ButtonPill>
                </div>
            </div>
        </section>
    );
}
