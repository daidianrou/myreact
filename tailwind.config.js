/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        noticeSlide: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        noticeFade: {
          '0%,100%': { opacity: '0', transform: 'translateY(6px)' },
          '15%,90%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        noticeSlide: 'noticeSlide 30s linear infinite',
        noticeFade: 'noticeFade 10s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
