export const tokens = {
    colors: {
        primary: "#6EC1E4",
        secondary: "#54595F",
        text: "#7A7A7A",
        accent: "#61CE70",
        white: "#FFFFFF",
        black: "#000000",
        overlayDark: "#1418149E",
        coverOverlay: "#0000009C",
    },
    fonts: {
        heading: '"Cormorant Garamond", serif',
        display: '"Cormorant Upright", serif',
        body: '"Times New Roman", serif',
        sans: '"Jura", sans-serif',
    },
    layout: {
        maxWidth: "500px",
    },
    aos: {
        duration: 1200,
        offset: 10,
        easing: "ease",
        once: false,
        mirror: true,
    },
};

export function aosPreset(type, index = 0) {
    if (type === "heading") return { aos: "fade-up", delay: 0 };
    if (type === "photo") return { aos: "zoom-in", delay: 120 };
    if (type === "title") return { aos: "fade-up", delay: 160 };
    if (type === "ornament") return { aos: "fade-in", delay: 0 };
    if (type === "card") return { aos: "fade-up", delay: index * 120 };
    if (type === "stagger") return { aos: "fade-up", delay: index * 100 };
    return { aos: "fade-up", delay: 0 };
}
