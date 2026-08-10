import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1815",
        charcoal: {
          DEFAULT: "#2A241F",
          light: "#3D352E",
        },
        linen: {
          DEFAULT: "#F4EEE3",
          dark: "#E9DFCC",
        },
        cream: "#FBF8F2",
        amber: {
          DEFAULT: "#B97A3D",
          light: "#D9A968",
          dark: "#8F5B27",
        },
        rust: "#9C4A2B",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter-tight)", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.25em",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
