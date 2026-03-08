export const tokens = {
    palette: {
        surface: "#ffffff",
        surfaceAlt: "#f8f8f8",
        text: "#473025",
        textMuted: "#6e5a4e",
        accent: "#3d9a62",
        accentSoft: "#d9f9d3",
        dangerSoft: "#fdbcbc",
    },
    typography: {
        serif: "trajan, 'Times New Roman', serif",
        script: "photograph, cursive",
        sans: "Poppins, Arial, sans-serif",
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 20,
        pill: 999,
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    zIndex: {
        cover: 999,
        floatingAudio: 120,
        floatingNav: 110,
        lightbox: 2000,
    },
    breakpoints: {
        mobile: 767,
        tablet: 1024,
        desktop: 1366,
    },
    aos: {
        duration: 1200,
        offset: 10,
        easing: "ease",
        once: false,
        mirror: true,
        debounceDelay: 50,
    },
};

export function aosPreset(name = "fade-up", delay = 0) {
    return {
        aos: name,
        delay,
    };
}
