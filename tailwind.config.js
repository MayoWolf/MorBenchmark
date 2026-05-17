/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        field: {
          black: '#06090f',
          panel: '#0c1220',
          rail: '#131d2f',
          blue: '#3b82f6',
          red: '#ef4444',
          amber: '#f59e0b',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(59, 130, 246, 0.12)',
      },
    },
  },
  plugins: [],
};
