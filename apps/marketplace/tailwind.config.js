/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488',
        secondary: '#14b8a6',
        accent: '#2dd4bf',
      },
    },
  },
  plugins: [],
};
