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

const PLANET_THEME: Record<PlanetName, string> = {
  Sun:     'Identity, confidence, and how you shine',
  Moon:    'Emotional nature, instincts, and inner world',
  Mars:    'Drive, ambition, and capacity for action',
  Mercury: 'Mind, communication, and how you process information',
  Jupiter: 'Wisdom, growth, and good fortune',
  Venus:   'Relationships, beauty, and enjoyment',
  Saturn:  'Discipline, responsibility, and long-term work',
  Rahu:    'Deepest ambitions and direction of greatest growth',
  Ketu:    'Innate wisdom and areas of natural depth',
};

const DIGNITY_PLAIN: Record<string, string> = {
  exalted:     'at its most powerful — these qualities come with unusual ease',
  own:         'in its home territory — comfortable and naturally expressed',
  neutral:     'in a balanced position',
  debilitated: 'in a more challenging position — these qualities reward conscious attention',
};

const DIGNITY_LABEL: Record<string, string> = {
  exalted:     'Exalted',
  own:         'Own sign',
  neutral:     'Neutral',
  debilitated: 'Debilitated',
};

const HOUSE_AREA: Record<number, string> = {
  1: 'Self',        2: 'Wealth',       3: 'Communication',
  4: 'Home',        5: 'Creativity',   6: 'Health',
  7: 'Partnership', 8: 'Depth',        9: 'Purpose',
  10: 'Career',     11: 'Gains',       12: 'Retreat',
};

export function PlanetGrid({ facts, section }: { facts: ChartFacts; section?: ReadingSection }) {
  const [open, setOpen] = useState<PlanetName | null>(null);

  const byPlanet = new Map(section?.items.map((it) => [it.title.split(' in ')[0], it]));

  return (
    <div>
      <p className="planet-intro">
        Your birth chart contains nine planets, each representing a different dimension of who
        you are. Select any planet to read the classical interpretation specific to your placement.
      </p>

      <div className="planet-list">
        {ORDER.map((p) => {
          const d = facts.planets[p];
          const isOpen = open === p;
          const item = byPlanet.get(p);
          const nak  = NAKSHATRA[d.nakshatra];
          const sign = RASHI[d.sign];
          const area = HOUSE_AREA[d.house] ?? `House ${d.house}`;
          const digLabel = DIGNITY_LABEL[d.dignity] ?? d.dignity;
          const digPlain = DIGNITY_PLAIN[d.dignity] ?? '';

          return (
            <button
              key={p}
              type="button"
              data-planet={p}
              data-open={isOpen}
              onClick={() => setOpen(isOpen ? null : p)}
              className="planet-row"
            >
              {/* Row header */}
              <div className="flex items-baseline justify-between gap-4">
                <span className="planet-row-name">{p}</span>
                <span className="planet-row-meta">
                  {sign ?? '—'} · House {d.house} ({area}) · {digLabel}
                </span>
              </div>

              {/* Theme — always visible */}
              <p className="planet-row-theme">{PLANET_THEME[p]}</p>

              {/* Dignity in plain english — always visible */}
              <p className="planet-row-dignity">{sign ?? '—'} is {digPlain}</p>

              {/* Expanded detail */}
              {isOpen && (
                <div className="planet-detail">
                  {item ? (
                    <>
                      <p className="planet-detail-body">{item.body}</p>
                      {item.citation && <Cite citation={item.citation} />}
                    </>
                  ) : (
                    <p className="planet-detail-body" style={{ color: 'var(--color-ink-subtle)' }}>
                      Detailed interpretation not yet available — the inference engine is still
                      processing your chart.
                    </p>
                  )}

                  <TechnicalPanel>
                    <div>
                      <p>
                        <span style={{ color: 'var(--color-ink-subtle)' }}>Sign: </span>
                        {sign ?? '—'} {d.degInSign.toFixed(1)}°
                      </p>
                      <p>
                        <span style={{ color: 'var(--color-ink-subtle)' }}>House: </span>
                        {d.house} ({area})
                      </p>
                      {nak && (
                        <p>
                          <span style={{ color: 'var(--color-ink-subtle)' }}>Nakshatra: </span>
                          {nak} · pada {d.pada}
                        </p>
                      )}
                      <p>
                        <span style={{ color: 'var(--color-ink-subtle)' }}>Navamsa sign: </span>
                        {RASHI[d.navamsaSign] ?? '—'}
                        {d.sign === d.navamsaSign ? ' (Vargottama)' : ''}
                      </p>
                      <p>
                        <span style={{ color: 'var(--color-ink-subtle)' }}>Classical dignity: </span>
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
