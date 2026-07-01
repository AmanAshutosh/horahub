'use client';
import { useState } from 'react';
import type { ChartFacts, PlanetName } from '@/types/chart';
import { NAKSHATRA, RASHI } from '@/constants/astro';
import { Cite } from '@/components/ui/Cite';
import type { ReadingSection } from '@/types/reading';
import { TechnicalPanel } from './primitives/TechnicalPanel';

const ORDER: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

// What each planet represents in plain English — shown as the card subtitle
const PLANET_THEME: Record<PlanetName, string> = {
  Sun:     'Your sense of identity, confidence, and how you shine',
  Moon:    'Your emotional nature, instincts, and inner world',
  Mars:    'Your drive, ambition, and ability to take decisive action',
  Mercury: 'Your mind, communication style, and how you process information',
  Jupiter: 'Your capacity for wisdom, growth, and good fortune',
  Venus:   'Your approach to relationships, beauty, and enjoyment',
  Saturn:  'Your relationship with discipline, responsibility, and long-term work',
  Rahu:    'Your deepest ambitions and the direction of greatest growth in this lifetime',
  Ketu:    'Your innate wisdom and areas of natural spiritual depth',
};

// How the position expresses in plain language
const DIGNITY_PLAIN: Record<string, string> = {
  exalted:     'at its most powerful — these qualities come with unusual ease',
  own:         'in its home territory — comfortable and naturally expressed',
  neutral:     'in a balanced position',
  debilitated: 'in a more challenging position — these qualities reward conscious attention',
};

// Badge styling
const DIGNITY_CLS: Record<string, string> = {
  exalted:     'bg-good/20 text-good',
  own:         'bg-gold/20 text-gold',
  neutral:     'bg-ink-muted/15 text-ink-muted',
  debilitated: 'bg-danger/20 text-danger',
};
const DIGNITY_LABEL: Record<string, string> = {
  exalted:     'At its peak',
  own:         'Home territory',
  neutral:     'Balanced',
  debilitated: 'Challenged',
};

// House life areas — shown in plain English on the card
const HOUSE_AREA: Record<number, string> = {
  1: 'Self',        2: 'Wealth',       3: 'Communication',
  4: 'Home',        5: 'Creativity',   6: 'Health',
  7: 'Partnership', 8: 'Depth',        9: 'Purpose',
  10: 'Career',     11: 'Gains',       12: 'Retreat',
};

export function PlanetGrid({ facts, section }: { facts: ChartFacts; section?: ReadingSection }) {
  const [open, setOpen] = useState<PlanetName | null>(null);

  // Match inference items to planets by first word of title (e.g. "Mercury in Virgo" → "Mercury")
  const byPlanet = new Map(section?.items.map((it) => [it.title.split(' in ')[0], it]));

  return (
    <div>
      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        Your birth chart contains nine planets, each representing a different dimension of who
        you are. Below is what your chart says about each one — tap any card for the classical
        interpretation specific to your placement.
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ORDER.map((p) => {
          const d = facts.planets[p];
          const isOpen = open === p;
          const item = byPlanet.get(p);
          const nak  = NAKSHATRA[d.nakshatra];
          const sign = RASHI[d.sign];
          const area = HOUSE_AREA[d.house] ?? `House ${d.house}`;
          const digCls   = DIGNITY_CLS[d.dignity]  ?? DIGNITY_CLS['neutral']!;
          const digLabel = DIGNITY_LABEL[d.dignity] ?? d.dignity;
          const digPlain = DIGNITY_PLAIN[d.dignity] ?? '';

          return (
            <button
              key={p}
              type="button"
              onClick={() => setOpen(isOpen ? null : p)}
              className="rounded-[13px] border border-line bg-panel-soft p-3.5 text-left transition-colors hover:border-gold/30 print:rounded-none print:border-gray-300"
            >
              {/* Planet name + area badge */}
              <div className="flex items-start justify-between gap-1">
                <span className="text-[15px] font-bold print:text-gray-900">{p}</span>
                <span className="shrink-0 rounded-[6px] bg-line px-1.5 py-0.5 text-[10px] font-medium text-ink-muted print:text-gray-500">
                  {area}
                </span>
              </div>

              {/* Human theme */}
              <p className="mt-0.5 text-[11px] leading-snug text-ink-muted print:text-gray-400">
                {PLANET_THEME[p]}
              </p>

              {/* Position in plain English */}
              <p className="mt-2 text-[12.5px] font-medium text-ink print:text-gray-800">
                {sign ?? '—'} · {digPlain}
              </p>

              {/* Dignity badge */}
              <span className={`mt-2 inline-block rounded-[9px] px-2 py-px text-[10.5px] font-medium ${digCls}`}>
                {digLabel}
              </span>

              {/* Expanded: interpretation + technical panel */}
              {isOpen && (
                <div className="mt-3 border-t border-line pt-3 text-left print:border-gray-200">
                  {item ? (
                    <div className="text-[12.5px] leading-relaxed text-[#cfd0dd] print:text-gray-700">
                      {item.body}
                      {item.citation && <Cite citation={item.citation} />}
                    </div>
                  ) : (
                    <p className="text-[12px] text-ink-muted print:text-gray-400">
                      Detailed interpretation not yet available — check back once the inference
                      engine has fully processed your chart.
                    </p>
                  )}
                  <TechnicalPanel>
                    <div className="space-y-1">
                      <p>
                        <span className="text-ink-subtle">Sign: </span>
                        {sign ?? '—'} {d.degInSign.toFixed(1)}°
                      </p>
                      <p>
                        <span className="text-ink-subtle">House: </span>
                        {d.house} ({area})
                      </p>
                      {nak && (
                        <p>
                          <span className="text-ink-subtle">Nakshatra: </span>
                          {nak} · pada {d.pada}
                        </p>
                      )}
                      <p>
                        <span className="text-ink-subtle">Navamsa sign: </span>
                        {RASHI[d.navamsaSign] ?? '—'}
                        {d.sign === d.navamsaSign ? ' (Vargottama — same in D9)' : ''}
                      </p>
                      <p>
                        <span className="text-ink-subtle">Classical dignity: </span>
                        {d.dignity.charAt(0).toUpperCase() + d.dignity.slice(1)}
                      </p>
                    </div>
                  </TechnicalPanel>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
