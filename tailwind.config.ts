import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Base surfaces
        bg:    { DEFAULT: '#08080d', soft: '#0e0e17' },
        panel: { DEFAULT: '#13131f', soft: '#191926', raised: '#1e1d2e' },
        line:  '#272736',

        // Text
        ink: {
          DEFAULT: '#ececf4',
          muted:   '#9292ad',
          subtle:  '#4e4c60',
        },

        // Accent
        gold:   { DEFAULT: '#d8b46a', soft: '#f1d8a0', dim: '#3a2e18' },
        accent: '#8b7cf0',

        // Status
        good:   '#5fbf8f',
        warn:   '#d9a05f',
        danger: '#d96a6a',

        // Planet palette — accents only, never for large backgrounds
        planet: {
          sun:     { glow: '#d4973b', soft: '#e8b96a', bg: '#1c1508' },
          moon:    { glow: '#9ba8c8', soft: '#c0cae0', bg: '#10121e' },
          mars:    { glow: '#c94444', soft: '#e07070', bg: '#1e0e0e' },
          mercury: { glow: '#4aad7a', soft: '#6dcc96', bg: '#0c1a12' },
          jupiter: { glow: '#c8a048', soft: '#e0bc72', bg: '#1c1606' },
          venus:   { glow: '#c45c84', soft: '#dc82a8', bg: '#1e0e16' },
          saturn:  { glow: '#4c72b0', soft: '#7898cc', bg: '#0e1220' },
          rahu:    { glow: '#7060d8', soft: '#9880f0', bg: '#100e20' },
          ketu:    { glow: '#8a7a9e', soft: '#b0a0c4', bg: '#120e18' },
        },
      },

      borderRadius: {
        xl2:  '1rem',    // 16px — standard card radius
        '2xl': '1.25rem', // 20px — premium callout card radius (keep Tailwind default)
      },

      boxShadow: {
        // Existing
        pop: '0 16px 40px rgba(0,0,0,.5)',

        // Soft neumorphic (15–20% depth)
        'neu-sm': '2px 2px 6px rgba(0,0,0,0.5), -1px -1px 3px rgba(255,255,255,0.025)',
        'neu-md': '4px 4px 12px rgba(0,0,0,0.6), -2px -2px 6px rgba(255,255,255,0.03)',

        // Gold glow — callout cards only
        'gold-glow': '0 0 24px rgba(216,180,106,0.12), 0 0 48px rgba(216,180,106,0.04)',

        // Combined
        'gold-neu': '2px 2px 8px rgba(0,0,0,0.55), -1px -1px 4px rgba(255,255,255,0.025), 0 0 24px rgba(216,180,106,0.10)',
      },

      keyframes: {
        spin:     { to: { transform: 'rotate(360deg)' } },
        fade:     { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-up': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },

      animation: {
        spin:      'spin .7s linear infinite',
        fade:      'fade .25s ease',
        'slide-up': 'slide-up 0.3s cubic-bezier(0,0,0.2,1)',
        'scale-up': 'scale-up 0.25s cubic-bezier(0,0,0.2,1)',
      },
    },
  },
  plugins: [],
};

export default config;
