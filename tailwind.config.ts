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
      corporate: {
          rose: '#E8C7C3',
          charcoal: '#1E1E1E',
          beige: '#F5EDEB',
          white: '#FFFFFF',
          grey: '#8A8A8A',
        },
        // Keep barber colors for backward compatibility
        barber: {
          red: '#dc2626',
          'dark-red': '#991b1b',
          gold: '#d4af37',
          cream: '#F5EDEB', // Map to corporate beige
          black: '#1E1E1E', // Map to corporate charcoal
          grey: {
            50: '#F5EDEB', // Map to corporate beige
            100: '#F0E6E4',
            200: '#E8C7C3', // Map to corporate rose
            300: '#D8B0AC',
            400: '#C09995',
            500: '#A8827E',
            600: '#8A8A8A', // Map to corporate grey
            700: '#6B6B6B',
            800: '#4C4C4C',
            900: '#1E1E1E', // Map to corporate charcoal
          },
        }
      },
      backgroundImage: {
        "barber-stripes":
          "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(220, 38, 38, 0.03) 10px, rgba(220, 38, 38, 0.03) 20px)",
      },
      animation: {
        "float-slow": "float 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};

export default config;
