import type { Metadata } from 'next';
import { BirthForm } from '@/components/BirthForm';
import { SolarSystem } from '@/components/home/SolarSystem';

export const metadata: Metadata = {
  title: 'HoraHub — Vedic Astrology Report',
  description:
    'Precise nine-planet birth chart with interpretations sourced from classical Vedic texts. Swiss Ephemeris positions. Nothing fabricated.',
};

const SOURCES = ['BPHS', 'Phaladeepika', 'Horasara', 'Light on Life'] as const;

const FEATURES = [
  { label: 'Swiss Ephemeris',  detail: 'DE431 precision planetary positions' },
  { label: '1,352 Rules',      detail: 'Extracted from four classical Vedic texts' },
  { label: 'Zero Fabrication', detail: 'Every insight cites its source verse' },
] as const;

const ANALYSIS_AREAS = [
  {
    id: 'career',
    variant: 'career',
    title: 'Career & Purpose',
    body: 'Your chart reflects the kinds of work you are naturally suited for, the environments where you perform best, and when career opportunities are most likely to arrive.',
  },
  {
    id: 'marriage',
    variant: 'marriage',
    title: 'Relationships & Marriage',
    body: 'The 7th house and its lord describe your natural approach to partnership — what you seek in a partner, and what classical texts associate with your closest bonds.',
  },
  {
    id: 'finance',
    variant: 'finance',
    title: 'Finance & Wealth',
    body: 'Your 2nd house, 11th house, and Jupiter reveal your earning style, your natural relationship with money, and wealth patterns from the classical tradition.',
  },
  {
    id: 'dasha',
    variant: 'dasha',
    title: 'Life Periods · Dasha',
    body: 'Vimshottari Dasha divides your life into 120 years of planetary chapters. Each period activates different areas of your chart — bringing its own themes and opportunities.',
  },
  {
    id: 'strengths',
    variant: 'strengths',
    title: 'Strengths & Challenges',
    body: 'Every chart carries both gifts and areas requiring attention. The classical rule system separates positive and negative indications so you can see both sides clearly.',
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* ── Hero / Form ─────────────────────────────────────────────── */}
      <main>
        <section className="home-hero-section">
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
        </section>

        {/* ── Cosmic Blueprint ─────────────────────────────────────── */}
        <section className="home-cosmic-section" aria-labelledby="cosmic-heading">
          <h2 className="home-cosmic-heading" id="cosmic-heading">
            Explore Your Cosmic Blueprint
          </h2>
          <p className="home-cosmic-subheading">
            Vedic astrology tracks nine planetary bodies — each influencing a distinct
            area of your life. Your birth chart captures their exact positions.
          </p>

          <SolarSystem />

          <p className="home-cosmic-caption">
            Your birth chart captures the position of these planetary influences
            at your exact birth moment — creating a unique celestial signature.
          </p>
        </section>

        {/* ── What HoraHub Analyzes ─────────────────────────────────── */}
        <section className="home-analysis-section" aria-labelledby="analysis-heading">
          <h2 className="home-analysis-heading" id="analysis-heading">
            What HoraHub Analyzes
          </h2>
          <p className="home-analysis-sub">
            Five domains from classical Vedic texts, mapped to your chart.
          </p>

          <div className="home-analysis-grid">
            {ANALYSIS_AREAS.map(area => (
              <div
                key={area.id}
                className={`home-analysis-card home-analysis-card--${area.variant}`}
              >
                <p className="home-analysis-card-title">{area.title}</p>
                <p className="home-analysis-card-body">{area.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
