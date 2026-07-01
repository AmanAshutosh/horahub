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
    detail: 'High-precision planetary positions from DE431 data',
  },
  {
    label: '1,352 Structured Rules',
    detail: 'Extracted and verified from four classical Vedic texts',
  },
  {
    label: 'Zero Fabrication',
    detail: 'Every finding cites its source chapter and verse',
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col px-5 pb-24 pt-14 sm:pt-20">
      <div className="mx-auto w-full max-w-[480px]">

        {/* ── Brand eyebrow ── */}
        <p className="mb-10 text-[10px] font-bold uppercase tracking-[0.22em] text-gold/60 animate-fade">
          HoraHub · Jyotiṣa Engine
        </p>

        {/* ── Hero heading ── */}
        <div className="mb-6 animate-slide-up">
          <p className="mb-2 text-[13.5px] font-normal leading-none text-ink-muted">
            Your personal
          </p>
          <h1 className="font-bold leading-[1.0] tracking-[-0.025em] text-ink">
            <span className="block text-[44px] sm:text-[52px]">Vedic Astrology</span>
            <span className="block text-[44px] sm:text-[52px]">
              Report<span className="text-gold">.</span>
            </span>
          </h1>
        </div>

        {/* ── Subtitle ── */}
        <p className="mb-10 text-[14px] leading-[1.7] text-ink-muted animate-slide-up">
          Swiss Ephemeris positions. Interpretations sourced verbatim from
          four classical Vedic texts. No generalised statements, no fabrication.
        </p>

        {/* ── Birth form ── */}
        <BirthForm />

        {/* ── Feature trust signals ── */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {FEATURES.map(({ label, detail }) => (
            <div
              key={label}
              className="rounded-xl border border-line/60 bg-panel/60 p-3 text-center"
            >
              <p className="text-[11px] font-semibold text-ink/80">{label}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-ink-subtle">{detail}</p>
            </div>
          ))}
        </div>

        {/* ── Source attribution ── */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center">
          <p className="text-[10px] text-ink-subtle">Sources</p>
          {SOURCES.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              {i > 0 && <span className="text-ink-subtle/40 select-none">·</span>}
              <span className="text-[10px] text-ink-subtle">{s}</span>
            </span>
          ))}
        </div>

        {/* ── Footer ── */}
        <p className="mt-8 text-center text-[10px] text-ink-subtle/50">
          Classical Vedic astrology · not a substitute for professional advice
        </p>

      </div>
    </main>
  );
}
