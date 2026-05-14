/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        feebay: {
          50: '#eff8ff',
          100: '#dceffd',
          200: '#b1dffb',
          300: '#76c7f9',
          400: '#37acf3',
          500: '#1290e0',
          600: '#0972bf',
          700: '#0a5c9a',
          800: '#0e4f7f',
          900: '#11436a',
        },
        rare: {
          common: '#94a3b8',
          uncommon: '#22c55e',
          rare: '#3b82f6',
          holo: '#a855f7',
          secret: '#f43f5e',
          mythic: '#f59e0b',
          error: '#ef4444',
          first: '#10b981',
          signed: '#f5d76e',
          prototype: '#ec4899',
        },
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(120%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        flip: 'flip 1.2s ease-in-out',
        popIn: 'popIn 0.45s ease-out',
        slideIn: 'slideIn 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
