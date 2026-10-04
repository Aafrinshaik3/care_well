import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        care: "#0EA5E9",
        cyan: "#E8F8FC",
        mint: "#E7F6F1",
        ink: "#172C3D",
        muted: "#718096",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Arial", "sans-serif"],
        display: ["var(--font-instrument)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 16px 50px rgba(15, 23, 42, 0.08)",
        float: "0 24px 70px rgba(20, 62, 82, 0.15)",
      },
      keyframes: {
        drift: { "0%, 100%": { transform: "translate3d(0, 0, 0)" }, "50%": { transform: "translate3d(0, -10px, 0)" } },
        wave: { "0%, 100%": { transform: "translateX(-2%) scaleY(1)" }, "50%": { transform: "translateX(2%) scaleY(1.06)" } },
      },
      animation: {
        drift: "drift 7s ease-in-out infinite",
        wave: "wave 16s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
