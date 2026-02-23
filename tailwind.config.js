import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#ee2b8c",
        "primary-soft": "#fce7f1",
        secondary: "#8da399",
        "secondary-soft": "#e8f0eb",
        accent: "#dcb8bc",
        "accent-soft": "#fdf2f4",
        "background-light": "#f8f6f7",
        "background-dark": "#221019",
        surface: "#ffffff",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        serif: ['"Playfair Display"', "serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        full: "9999px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        soft: "0 20px 40px -10px rgba(0,0,0,0.05)",
        glow: "0 0 20px rgba(238, 43, 140, 0.3)",
      },
    },
  },
  plugins: [forms],
};
