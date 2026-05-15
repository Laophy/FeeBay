/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // eBay-style brand palette
        feebay: {
          50: '#eaf3ff',
          100: '#d1e4ff',
          200: '#a6c9ff',
          300: '#6ba6ff',
          400: '#3a85f5',
          500: '#0064d2', // ← eBay link blue
          600: '#0053b0',
          700: '#003f87',
          800: '#002f63',
          900: '#001f40',
        },
        ebayRed: {
          400: '#ff6e75',
          500: '#e53238', // ← eBay red (in the logo)
          600: '#c1262c',
          700: '#971d21',
        },
        ebayYellow: {
          300: '#fdd95a',
          400: '#fbc23a',
          500: '#f5af02', // ← eBay yellow (in the logo / Bids)
          600: '#cf8e00',
          700: '#9b6a00',
        },
        ebayGreen: {
          400: '#a5d04a',
          500: '#86b817', // ← eBay green (in the logo / Sell)
          600: '#6c9512',
          700: '#54750c',
        },
        // Page surfaces & borders for the light theme
        paper: '#f5f6f7',
        card: '#ffffff',
        line: '#e5e7eb',
        lineSoft: '#eef0f3',
        ink: {
          900: '#191919',
          800: '#26282b',
          700: '#3c3f44',
          600: '#5a5e66',
          500: '#7c828c',
          400: '#9aa0aa',
          300: '#bcc0c7',
          200: '#dadde2',
          100: '#eef0f3',
        },
        cozy: {
          50: '#fdf8f0',
          100: '#fbf0dc',
          200: '#f7dfb1',
          300: '#f1c97a',
          400: '#e8ad44',
          500: '#d49222',
          600: '#b07417',
          700: '#8a5912',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 1px rgba(15, 23, 42, 0.04)',
        cardHover: '0 4px 12px rgba(15, 23, 42, 0.1), 0 2px 4px rgba(15, 23, 42, 0.05)',
        topbar: '0 1px 0 #e5e7eb',
      },
      keyframes: {
        flip: { '0%': { transform: 'rotateY(0deg)' }, '100%': { transform: 'rotateY(360deg)' } },
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
