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
        /* ── Surfaces — pale lavender depth ── */
        bg:    { DEFAULT: '#E7D9F5', soft: '#EDE4F7' },
        panel: { DEFAULT: '#EAE0F6', soft: '#F0E9FA', raised: '#F5F1FC' },
        line:  { DEFAULT: '#D0BFE8', soft: '#DBD0EE' },

        /* ── Text — deep navy hierarchy ── */
        ink: {
          DEFAULT: '#0D1B2A',
          muted:   '#3A4F70',
          subtle:  '#7A8FAF',
        },

        /* ── Brand ── */
        primary: { DEFAULT: '#1D2D50', soft: '#2D4070' },
        accent:  { DEFAULT: '#F1CBB8', soft: '#F8DDD0' },

        /* ── Legacy — minimal use, mapped to primary ── */
        gold: { DEFAULT: '#1D2D50', soft: '#2D4070', dim: '#E8E0F0' },

        /* ── Status ── */
        good:   '#2A6B4A',
        warn:   '#8B6B35',
        danger: '#8B3A3A',

        /* ── Planet accents — muted dark tones for light backgrounds ── */
        planet: {
          sun:     { glow: '#7B5230', soft: '#A07248', bg: '#F8F0E8' },
          moon:    { glow: '#3A5A88', soft: '#5878A8', bg: '#ECF0F8' },
          mars:    { glow: '#8B3030', soft: '#A85050', bg: '#F8EDED' },
          mercury: { glow: '#2D6A6A', soft: '#4A8A8A', bg: '#E8F5F5' },
          jupiter: { glow: '#4A3A7A', soft: '#6A5A9A', bg: '#EEEAF8' },
          venus:   { glow: '#8B3A6B', soft: '#AA5A8B', bg: '#F8EDF5' },
          saturn:  { glow: '#3A3A6A', soft: '#5A5A8A', bg: '#EDEDF5' },
          rahu:    { glow: '#4A2A7A', soft: '#6A4A9A', bg: '#EEE8F8' },
          ketu:    { glow: '#5A5230', soft: '#7A7250', bg: '#F2F0E8' },
        },
      },

      borderRadius: {
        xl2:  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      boxShadow: {
        sm:        '0 2px 8px rgba(29,45,80,0.08), 0 1px 3px rgba(29,45,80,0.05)',
        md:        '0 8px 24px rgba(29,45,80,0.10), 0 3px 8px rgba(29,45,80,0.07)',
        lg:        '0 20px 60px rgba(29,45,80,0.14), 0 8px 24px rgba(29,45,80,0.09)',
        pop:       '6px 6px 20px rgba(190,170,215,0.52), -3px -3px 12px rgba(255,255,255,0.88)',
        'neu-sm':  '4px 4px 8px rgba(190,170,215,0.48), -4px -4px 8px rgba(255,255,255,0.88)',
        'neu-md':  '7px 7px 15px rgba(190,170,215,0.50), -7px -7px 15px rgba(255,255,255,0.90)',
        'neu-lg':  '10px 10px 24px rgba(190,170,215,0.54), -10px -10px 24px rgba(255,255,255,0.92)',
        'gold-glow': '0 0 24px rgba(29,45,80,0.10), 0 0 48px rgba(29,45,80,0.05)',
        'gold-neu':  '6px 6px 14px rgba(190,170,215,0.48), -4px -4px 10px rgba(255,255,255,0.88)',
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
