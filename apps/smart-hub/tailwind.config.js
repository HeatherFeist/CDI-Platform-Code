/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          500: '#64748b',
          400: '#94a3b8',
          200: '#e2e8f0',
        },
        indigo: {
          600: '#6366f1',
          500: '#818cf8',
          400: '#818cf8',
        },
        cyan: {
          400: '#22d3ee',
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
      keyframes: {
        'fade-in-up': {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
}
