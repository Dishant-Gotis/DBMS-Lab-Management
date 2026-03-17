/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          900: "#36393f",
          800: "#2f3136",
          700: "#282b30",
          600: "#202225",
          500: "#1e1f25",
        },
      },
    },
  },
  plugins: [],
}
