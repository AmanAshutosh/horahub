import type { Metadata } from 'next';
import { BirthForm } from '@/components/BirthForm';

export const metadata: Metadata = {
  title: 'HoraHub — Vedic Astrology Report',
  description:
    'Precise nine-planet birth chart with interpretations sourced from classical Vedic texts. Swiss Ephemeris positions. Nothing fabricated.',
};

const SOURCES = ['BPHS', 'Phaladeepika', 'Horasara', 'Light on Life'] as const;

const FEATURES = [
  {
    label: 'Swiss Ephemeris',
    detail: 'DE431 precision planetary positions',
  },
  {
    label: '1,352 Rules',
    detail: 'Extracted from four classical Vedic texts',
  },
  {
    label: 'Zero Fabrication',
    detail: 'Every insight cites its source verse',
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-start px-5 pb-32 pt-16 sm:pt-24">
      <div className="mx-auto w-full max-w-[540px]">

        {/* Eyebrow */}
        <p className="home-eyebrow animate-fade">
          HoraHub · Jyotiṣa Engine
        </p>

        {/* Hero */}
        <div className="animate-slide-up">
          <p className="home-preheading">Your personal</p>
          <h1 className="home-h1">
            <span>Vedic Astrology</span>
            <span>Report<span className="home-h1-gold">.</span></span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="home-subtitle animate-slide-up">
          Swiss Ephemeris positions. Interpretations sourced verbatim from
          four classical Vedic texts. No generalised statements, no fabrication.
        </p>

        {/* Birth form */}
        <BirthForm />

        {/* Trust signals */}
        <div className="home-trust-grid">
          {FEATURES.map(({ label, detail }) => (
            <div key={label} className="home-trust-card">
              <p className="home-trust-label">{label}</p>
              <p className="home-trust-detail">{detail}</p>
            </div>
          ))}
        </div>

        {/* Sources */}
        <div className="home-sources">
          <span className="home-sources-label">Sources</span>
          {SOURCES.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              {i > 0 && <span className="home-sources-sep">·</span>}
              <span className="home-sources-name">{s}</span>
            </span>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="home-disclaimer">
          Classical Vedic astrology · not a substitute for professional advice
        </p>

      </div>
    </main>
  );
}
