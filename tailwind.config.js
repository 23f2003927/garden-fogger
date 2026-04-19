/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'Courier Prime'", "Courier New", "monospace"],
        sans: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        leaf: {
          400: "#7ab648",
          500: "#5a9e2f",
          600: "#3d7a1a",
        },
        mist: {
          300: "#8ecfb8",
          400: "#5ab89a",
        },
      },
    },
  },
  plugins: [],
};
