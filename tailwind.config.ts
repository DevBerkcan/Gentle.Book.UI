import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:       '#6355E4',
          hover:         '#5646D6',
          active:        '#4A3BC2',
          soft:          '#EEEBFC',
          secondary:     '#17A398',
          secondarySoft: '#E4F5F2',
        },
        gb: {
          navy:          '#14162B',
          offwhite:      '#F6F5FA',
          surface:       '#FFFFFF',
          surfaceAlt:    '#FAFAFC',
          border:        '#ECEBF2',
          borderStrong:  '#D8D7E2',
          textSecondary: '#565A72',
          textMuted:     '#8B8FA6',
          success:       '#17936B',
          warning:       '#C77A16',
          error:         '#D64550',
          info:          '#3B71D9',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        ui:      ['var(--font-ui)', 'sans-serif'],
      },
      animation: {
        "float-slow":    "float 3s ease-in-out infinite",
        "fade-in":       "fadeIn 0.5s ease-in-out",
        "slide-up":      "slideUp 0.5s ease-out",
        "shimmer-slide": "shimmer-slide var(--speed) ease-in-out infinite alternate",
        "spin-around":   "spin-around calc(var(--speed) * 2) infinite linear",
        "glow-pulse":    "glow-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        "shimmer-slide": {
          to: { transform: "translate(calc(100cqw - 100%), 0)" },
        },
        "spin-around": {
          "0%":        { transform: "translateZ(0) rotate(0)" },
          "15%, 35%":  { transform: "translateZ(0) rotate(90deg)" },
          "65%, 85%":  { transform: "translateZ(0) rotate(270deg)" },
          "100%":      { transform: "translateZ(0) rotate(360deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%":      { opacity: "1" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};

export default config;
