import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-geist-sans)',  'ui-sans-serif',  'system-ui', 'sans-serif'],
        mono:    ['var(--font-geist-mono)',  'ui-monospace',   'monospace'],
        display: ['var(--font-playfair)',    'Georgia',        'serif'],
      },

      colors: {
        /* ── Surfaces — warm charcoal ── */
        bg:    { DEFAULT: '#0c0b09', soft: '#111009' },
        panel: { DEFAULT: '#161410', soft: '#1c1916', raised: '#23201b' },
        line:  '#2e2b24',

        /* ── Text ── */
        ink: {
          DEFAULT: '#f0ede6',
          muted:   '#a09c92',
          subtle:  '#565249',
        },

        /* ── Accent ── */
        gold:   { DEFAULT: '#c9a84c', soft: '#e8cc7e', dim: '#2c2410' },
        accent: '#8878e8',

        /* ── Status ── */
        good:   '#5ab87e',
        warn:   '#d4955a',
        danger: '#d46060',

        /* ── Planet accents — never for large fills ── */
        planet: {
          sun:     { glow: '#d49a3c', soft: '#e8b96a', bg: '#1c1608' },
          moon:    { glow: '#9daac8', soft: '#c2ccdf', bg: '#10121e' },
          mars:    { glow: '#c84040', soft: '#e07070', bg: '#1e0d0d' },
          mercury: { glow: '#48ab78', soft: '#6dcc96', bg: '#0b1a12' },
          jupiter: { glow: '#c8a040', soft: '#dfbc6e', bg: '#1c1606' },
          venus:   { glow: '#c45c84', soft: '#dc84aa', bg: '#1e0e16' },
          saturn:  { glow: '#4a6eac', soft: '#7898cc', bg: '#0e1220' },
          rahu:    { glow: '#6e5ed4', soft: '#9880f0', bg: '#100e20' },
          ketu:    { glow: '#8878a0', soft: '#b0a0c4', bg: '#120e18' },
        },
      },

      borderRadius: {
        xl2:  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      boxShadow: {
        sm:         '0 2px 8px rgba(0,0,0,0.42), 0 1px 3px rgba(0,0,0,0.3)',
        md:         '0 8px 24px rgba(0,0,0,0.52), 0 3px 8px rgba(0,0,0,0.36)',
        lg:         '0 20px 60px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.46)',
        pop:        '0 16px 48px rgba(0,0,0,0.56), 0 4px 12px rgba(0,0,0,0.36)',
        'neu-sm':   '3px 3px 8px rgba(0,0,0,0.55), -1px -1px 4px rgba(255,248,225,0.032)',
        'neu-md':   '6px 6px 18px rgba(0,0,0,0.62), -2px -2px 8px rgba(255,248,225,0.038)',
        'neu-lg':   '10px 10px 32px rgba(0,0,0,0.70), -3px -3px 12px rgba(255,248,225,0.042)',
        'gold-glow':'0 0 32px rgba(201,168,76,0.14), 0 0 64px rgba(201,168,76,0.05)',
        'gold-neu': '4px 4px 14px rgba(0,0,0,0.62), -1px -1px 6px rgba(255,248,225,0.036), 0 0 30px rgba(201,168,76,0.11)',
      },

      keyframes: {
        spin:       { to: { transform: 'rotate(360deg)' } },
        fade:       { from: { opacity: '0', transform: 'translateY(5px)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-up': { from: { opacity: '0', transform: 'scale(0.96)' },      to: { opacity: '1', transform: 'scale(1)' } },
      },

      animation: {
        spin:       'spin .7s linear infinite',
        fade:       'fade .22s cubic-bezier(0,0,0.2,1)',
        'slide-up': 'slide-up .3s cubic-bezier(0,0,0.2,1)',
        'scale-up': 'scale-up .25s cubic-bezier(0,0,0.2,1)',
      },
    },
  },
  plugins: [],
};

export default config;
