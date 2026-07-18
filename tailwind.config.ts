import type {Config} from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {50: "#eefdf8", 500: "#10b981", 600: "#059669", 700: "#047857"}
      },
      boxShadow: {soft: "0 8px 30px rgba(15,23,42,.07)"}
    }
  },
  plugins: []
} satisfies Config;
