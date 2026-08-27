import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#D4AF37", // Gold
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#1A1A1A", // Dark Grey
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#C5A028", // Slightly darker gold
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#71717a",
          foreground: "#71717a",
        },
        gold: {
          50: "#FDFBF7",
          100: "#F7F2E8",
          200: "#EFE4D1",
          300: "#E3D0B5",
          400: "#D4AF37", // Main Gold
          500: "#C5A028",
          600: "#B38C21",
          700: "#9A751B",
          800: "#826116",
          900: "#6B4D11",
          // Darker gold for depth
        },
        luxury: {
          black: "#0a0a0a",
          dark: "#121212",
          grey: "#1A1A1A",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "bounce-slow": "bounce 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
