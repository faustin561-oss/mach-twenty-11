import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        m20navy: "#0B1F3A",
        m20steel: "#1E3A5F",
        m20amber: "#FF8A00",
        m20fog: "#F5F6F8",
        hpink: "#0A1424",
        hpnavy: "#0F2038",
        hpsteel: "#2C4560",
        hpcyan: "#2BB4D4",
        hpcyandeep: "#12839E",
        hpfog: "#F5F7FA",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
