/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'default': '0px 4px 23px 0px rgba(0, 0, 0, 0.07)',

      },
    },
  },
  plugins: [],
}