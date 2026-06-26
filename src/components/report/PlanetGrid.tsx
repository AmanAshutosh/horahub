'use client';
import { useState } from 'react';
import type { ChartFacts, PlanetName } from '@/types/chart';
import { NAKSHATRA, RASHI } from '@/constants/astro';
import { Cite } from '@/components/ui/Cite';
import type { ReadingSection } from '@/types/reading';

const ORDER: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const DIGNITY_CLASS: Record<string, string> = {
  exalted: 'bg-good/20 text-good',
  debilitated: 'bg-danger/20 text-danger',
  own: 'bg-gold/20 text-gold',
  neutral: 'bg-ink-muted/15 text-ink-muted',
};

export function PlanetGrid({ facts, section }: { facts: ChartFacts; section?: ReadingSection }) {
  const [open, setOpen] = useState<PlanetName | null>(null);
  const byTitle = new Map(section?.items.map((it) => [it.title.split(' in ')[0], it]));

  return (
    <section id="planets" className="scroll-mt-24">
      <h2 className="mb-2.5 mt-5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-gold before:inline-block before:h-px before:w-3.5 before:bg-gold">
        Planetary Positions
      </h2>
      <p className="mb-2.5 text-[11.5px] text-ink-muted">Tap a card for its signification and source.</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ORDER.map((p) => {
          const d = facts.planets[p];
          const isOpen = open === p;
          const item = byTitle.get(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => setOpen(isOpen ? null : p)}
              className="rounded-[13px] border border-line bg-panel-soft p-3 text-left"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] font-bold">{p}</span>
                <span className="text-[11px] text-ink-muted">H{d.house}</span>
              </div>
              <div className="mt-0.5 text-[13px] text-gold-soft">
                {RASHI[d.sign]} {d.degInSign.toFixed(1)}°
              </div>
              <div className="text-[11px] text-ink-muted">
                {NAKSHATRA[d.nakshatra]} · pada {d.pada}
              </div>
              <span className={`mt-1.5 inline-block rounded-[10px] px-1.5 py-px text-[10.5px] ${DIGNITY_CLASS[d.dignity]}`}>
                {d.dignity}
              </span>
              {isOpen && item && (
                <div className="mt-2 border-t border-line pt-2 text-[12.5px] text-[#cfd0dd] animate-fade">
                  {item.body}
                  {item.citation && <Cite citation={item.citation} />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
