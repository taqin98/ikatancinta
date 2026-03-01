/**
 * Design tokens for "Light Blue Floral" Basic Theme
 * Import and use these in components to ensure visual consistency.
 */
export const tokens = {
    colors: {
        /** Page background — very soft blue-white */
        pageBg: "#EEF4FB",
        /** Section alternating bg — near-white with warm blue tint */
        sectionAlt: "#F7FAFF",
        /** Card background */
        cardBg: "rgba(255,255,255,0.88)",
        /** Primary accent — dusty blue */
        accent: "#5B8DB8",
        /** Accent hover / darker */
        accentDark: "#3E6F9A",
        /** Accent ultra-light for backgrounds */
        accentSoft: "rgba(91,141,184,0.12)",
        /** Main headline text color */
        headingText: "#243B55",
        /** Body text */
        bodyText: "#3E4E5E",
        /** Muted/secondary text */
        mutedText: "#7A92A8",
        /** Floral ornament stroke */
        ornamentStroke: "rgba(91,141,184,0.35)",
        /** White */
        white: "#ffffff",
        /** Card border */
        cardBorder: "rgba(91,141,184,0.18)",
        /** Divider line */
        divider: "rgba(91,141,184,0.25)",
        /** Hadir (green) */
        hadirBg: "rgba(34,197,94,0.12)",
        hadirText: "#16a34a",
        /** Tidak hadir (red) */
        tidakHadirBg: "rgba(239,68,68,0.10)",
        tidakHadirText: "#dc2626",
        /** Cover overlay gradient */
        coverOverlay: "linear-gradient(to bottom, rgba(20,50,80,0.45) 0%, rgba(10,30,55,0.75) 100%)",
    },
    fonts: {
        script: "'Great Vibes', cursive",
        serif: "'Playfair Display', Georgia, serif",
        sans: "'Poppins', 'Plus Jakarta Sans', sans-serif",
    },
    radius: {
        card: "1.25rem",   // 20px
        button: "9999px",  // pill
        photo: "1rem",     // 16px
        photoTop: "50% 50% 0 0 / 60% 60% 0 0", // portrait top-rounded
    },
    shadow: {
        card: "0 4px 24px 0 rgba(91,141,184,0.10), 0 1px 4px 0 rgba(36,59,85,0.07)",
        button: "0 2px 12px 0 rgba(91,141,184,0.25)",
        photo: "0 8px 32px 0 rgba(36,59,85,0.15)",
        countdown: "0 4px 16px 0 rgba(91,141,184,0.18)",
    },
    aos: {
        duration: 700,
        offset: 90,
        easing: "ease-out",
        once: true,
    },
};

export default tokens;
