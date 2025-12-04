// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          1: "hsla(222, 45%, 12%, 0.6)",
          2: "hsla(222, 45%, 10%, 0.55)",
        },
        accent: "#3b82f6",
        accent2: "#8b5cf6",
      },
      boxShadow: {
        elev1: "0 10px 30px rgba(0,0,0,.45)",
        elev2: "0 20px 60px rgba(0,0,0,.65)",
      },
      borderRadius: {
        xl2: "24px",
      },
    },
  },
  plugins: [],
};
