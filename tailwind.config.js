/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#5B3CD1", dark: "#4A2FB5", soft: "#EEEAFB", ring: "#7C63E0" },
        ink: { DEFAULT: "#14142B", muted: "#5F6275", faint: "#9A9CAE" },
        tile: "#F4F4F6",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Nunito"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 40px -12px rgba(20, 20, 43, 0.18)",
      },
    },
  },
  plugins: [],
};
