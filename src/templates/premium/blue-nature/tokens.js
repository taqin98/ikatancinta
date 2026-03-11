export const tokens = {
    colors: {
        primary: "#4A5A74",
        primaryDark: "#2E3F54",
        primaryDarker: "#152648",
        accentGold: "#D7AC64",
        accentGoldDark: "#D5AF6F",
        textDark: "#404F6A",
        textBody: "#40506B",
        textBlack: "#242424",
        bgLight: "#EAF0F4",
        white: "#FFFFFF",
        cardBorder: "rgba(64, 79, 106, 0.2)",
    },
    fonts: {
        display: "analogue, serif",
        script: "laluxesscript-regula, cursive",
        heading: "Cinzel, serif",
        body: "bodebeck, serif",
        serif: "Newsreader, serif",
        slab: "Roboto Slab, serif",
        system: "Montserrat, sans-serif",
        mono: "Roboto Slab, serif",
        edensor: "edensor, serif",
        strawberry: "strawberrycupcakes, cursive",
    },
    radius: {
        card: "20px",
        pill: "999px",
    },
    shadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
        photo: "0 0 10px rgba(0,0,0,0.35)",
    },
    layout: {
        maxWidth: "430px",
    },
    aos: {
        duration: 800,
        offset: 100,
        easing: "ease-out-cubic",
        once: true,
    },
};

export function aosPreset(type, index = 0) {
    if (type === "heading") return { aos: "fade-down", delay: 0 };
    if (type === "photo") return { aos: "zoom-in", delay: 100 };
    if (type === "title") return { aos: "fade-up", delay: 120 };
    if (type === "ornament") return { aos: "fade-in", delay: 0 };
    if (type === "card") return { aos: "fade-up", delay: index * 120 };
    if (type === "stagger") return { aos: "fade-up", delay: index * 100 };
    return { aos: "fade-up", delay: 0 };
}
