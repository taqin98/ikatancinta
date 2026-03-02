export const tokens = {
    colors: {
        bgDark: "#424242",
        bgSoft: "#EFE0CD",
        bgIvory: "#F7EEE4",
        accentFloral: "#E8D3C3",
        accentFloralDark: "#C2A894",
        accentBorder: "#C9AC9A",
        textPrimary: "#3E3E3E",
        textSecondary: "#4F4F4F",
        white: "#FFFFFF",
        hadirBg: "#bde0bc",
        tidakHadirBg: "#f3b4b7",
    },
    fonts: {
        display: "'Playball', cursive",
        script: "'Allura', cursive",
        body: "'Comic Neue', 'Poppins', sans-serif",
        heading: "'Analogue', 'Great Vibes', cursive",
        sans: "'Montserrat', 'Poppins', sans-serif",
    },
    radius: {
        card: "20px",
        oval: "300px",
        pill: "999px",
    },
    shadow: {
        soft: "0 10px 30px rgba(0, 0, 0, 0.2)",
        photo: "0 8px 24px rgba(0, 0, 0, 0.35)",
    },
    layout: {
        maxWidth: "430px",
    },
    aos: {
        duration: 800,
        offset: 100,
        easing: "ease-out-cubic",
        once: false,
        mirror: true,
    },
};

export function aosPreset(type, index = 0) {
    if (type === "heading") return { aos: "fade-down", delay: 0 };
    if (type === "photo") return { aos: "zoom-in", delay: 80 };
    if (type === "title") return { aos: "fade-up", delay: 120 };
    if (type === "ornament") return { aos: "fade-in", delay: 0 };
    if (type === "card") return { aos: "fade-up", delay: index * 140 };
    if (type === "stagger") return { aos: "fade-up", delay: index * 100 };
    return { aos: "fade-up", delay: 0 };
}
