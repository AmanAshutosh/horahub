import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#08080d', soft: '#0e0e17' },
        panel: { DEFAULT: '#13131f', soft: '#191926' },
        line: '#272736',
        ink: { DEFAULT: '#ececf4', muted: '#9292ad' },
        gold: { DEFAULT: '#d8b46a', soft: '#f1d8a0' },
        accent: '#8b7cf0',
        good: '#5fbf8f',
        warn: '#d9a05f',
        danger: '#d96a6a',
      },
      borderRadius: { xl2: '1rem' },
      boxShadow: { pop: '0 16px 40px rgba(0,0,0,.5)' },
      keyframes: {
        spin: { to: { transform: 'rotate(360deg)' } },
        fade: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { spin: 'spin .7s linear infinite', fade: 'fade .25s ease' },
    },
  },
  plugins: [],
};
export default config;
