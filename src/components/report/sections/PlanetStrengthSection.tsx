import type { ChartFacts, PlanetName } from '@/types/chart';
import { RASHI } from '@/constants/astro';
import { SectionShell } from '../primitives/SectionShell';
import { TechnicalPanel } from '../primitives/TechnicalPanel';

const ORDER: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

const PLANET_THEME: Record<PlanetName, string> = {
  Sun:     'Your sense of identity, confidence, and self-expression',
  Moon:    'Your emotional nature, instincts, and inner world',
  Mars:    'Your drive, ambition, and ability to take decisive action',
  Mercury: 'Your mind, communication style, and how you process information',
  Jupiter: 'Your capacity for wisdom, growth, and good fortune',
  Venus:   'Your approach to relationships, beauty, and enjoyment',
  Saturn:  'Your relationship with discipline, responsibility, and long-term work',
  Rahu:    'Your deepest ambitions and the direction of greatest growth',
  Ketu:    'Your innate wisdom and areas of natural spiritual depth',
};

const DIGNITY_PLAIN: Record<string, { label: string; desc: string; cls: string }> = {
  exalted: {
    label: 'At its most powerful',
    desc:  'This planet\'s qualities flow with unusual ease and strength in your chart.',
    cls:   'border-good/40 bg-good/10',
  },
  own: {
    label: 'In its home territory',
    desc:  'Comfortable and naturally expressed — this planet operates with consistency.',
    cls:   'border-gold/40 bg-gold/10',
  },
  neutral: {
    label: 'In a balanced position',
    desc:  'Neither strengthened nor weakened — house placement and other factors matter more.',
    cls:   'border-line bg-panel-soft',
  },
  debilitated: {
    label: 'In a challenging position',
    desc:  'These qualities are still present — they tend to require more conscious effort and awareness.',
    cls:   'border-danger/30 bg-danger/5',
  },
};

interface Props {
  facts: ChartFacts;
  num: number;
}

export function PlanetStrengthSection({ facts, num }: Props) {
  const byDignity = {
    strong:     ORDER.filter((p) => ['exalted', 'own'].includes(facts.planets[p].dignity)),
    balanced:   ORDER.filter((p) => facts.planets[p].dignity === 'neutral'),
    challenged: ORDER.filter((p) => facts.planets[p].dignity === 'debilitated'),
  };

  return (
    <SectionShell
      id="strength"
      num={num}
      title="Your Planetary Strengths"
      subtitle="Which of your planets operate at their most natural — and which require more conscious effort"
    >
      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        Not all planets in your chart operate with the same ease. Some are in positions where
        their qualities flow naturally; others are in positions where the same qualities take more
        awareness to express well. A planet in a challenging position isn&apos;t a defect — it&apos;s
        an area of life that rewards deliberate attention.
      </p>

      {/* Strong */}
      {byDignity.strong.length > 0 && (
        <div className="mb-5">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-good print:text-gray-600">
            Planets at their most powerful
          </p>
          <div className="space-y-2">
            {byDignity.strong.map((p) => {
              const d = facts.planets[p];
              const conf = DIGNITY_PLAIN[d.dignity] ?? DIGNITY_PLAIN['neutral']!;
              return (
                <div
                  key={p}
                  className={`rounded-xl border px-4 py-3 ${conf.cls} print:border-gray-200 print:bg-white`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-bold print:text-gray-900">{p}</span>
                    <span className="text-[11px] font-semibold text-good print:text-gray-600">
                      {conf.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted print:text-gray-500">
                    {PLANET_THEME[p]}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-muted print:text-gray-400">
                    {conf.desc}
                  </p>
                  <TechnicalPanel>
                    <p>
                      {p} in {RASHI[d.sign] ?? '—'} · House {d.house} ·{' '}
                      {d.dignity.charAt(0).toUpperCase() + d.dignity.slice(1)}
                      {d.sign === d.navamsaSign ? ' · Vargottama (same sign in D9)' : ''}
                    </p>
                  </TechnicalPanel>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenged */}
      {byDignity.challenged.length > 0 && (
        <div className="mb-5">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-warn print:text-gray-600">
            Planets in a more challenging position
          </p>
          <div className="space-y-2">
            {byDignity.challenged.map((p) => {
              const d = facts.planets[p];
              const conf = DIGNITY_PLAIN['debilitated']!;
              return (
                <div
                  key={p}
                  className={`rounded-xl border px-4 py-3 ${conf.cls} print:border-gray-200 print:bg-white`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-bold print:text-gray-900">{p}</span>
                    <span className="text-[11px] font-semibold text-warn print:text-gray-600">
                      {conf.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted print:text-gray-500">
                    {PLANET_THEME[p]}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-muted print:text-gray-400">
                    {conf.desc}
                  </p>
                  <TechnicalPanel>
                    <p>
                      {p} in {RASHI[d.sign] ?? '—'} · House {d.house} · Debilitated
                    </p>
                  </TechnicalPanel>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Balanced */}
      {byDignity.balanced.length > 0 && (
        <div className="mb-3">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-ink-muted print:text-gray-500">
            Planets in a balanced position
          </p>
          <div className="flex flex-wrap gap-2">
            {byDignity.balanced.map((p) => {
              const d = facts.planets[p];
              return (
                <div
                  key={p}
                  className="rounded-xl border border-line bg-panel-soft px-3.5 py-2.5 print:border-gray-200 print:bg-white"
                >
                  <span className="text-[14px] font-semibold print:text-gray-800">{p}</span>
                  <p className="mt-0.5 text-[11px] text-ink-muted print:text-gray-500">
                    {PLANET_THEME[p].split(',')[0]}
                  </p>
                  <TechnicalPanel>
                    <p>
                      {p} in {RASHI[d.sign] ?? '—'} · House {d.house} · Neutral
                    </p>
                  </TechnicalPanel>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-[11.5px] text-ink-subtle print:text-gray-400">
        Full positional data (sign, house, nakshatra, pada, navamsa, vargottama) is available in
        the{' '}
        <a href="#tech-ref" className="text-gold/70 hover:text-gold underline underline-offset-2">
          Technical Reference
        </a>
        .
      </p>
    </SectionShell>
  );
}
