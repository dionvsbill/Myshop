import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        shop: {
          ink: "#171717",
          muted: "#737373",
          soft: "#f6f6f4",
          line: "#e7e5e4",
          cream: "#faf9f6",
        },
      },
      borderRadius: {
        shop: "14px",
        "shop-lg": "20px",
      },
      boxShadow: {
        shop: "0 1px 2px rgba(0,0,0,.04), 0 8px 30px rgba(0,0,0,.04)",
        "shop-hover": "0 14px 40px rgba(0,0,0,.09)",
        "shop-card": "0 1px 3px rgba(0,0,0,.05), 0 12px 35px rgba(0,0,0,.06)",
      },
      transitionTimingFunction: {
        shop: "cubic-bezier(.2,.65,.2,1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-scale": {
          "0%": { opacity: "0", transform: "scale(.985)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up .55s cubic-bezier(.2,.65,.2,1) both",
        "soft-scale": "soft-scale .5s cubic-bezier(.2,.65,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
