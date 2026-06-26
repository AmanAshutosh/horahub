import type { ChartFacts, PlanetName } from '@/types/chart';
import { PLANET_SHORT, RASHI_SHORT, SOUTH_CELLS } from '@/constants/astro';

const ORDER: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export function SouthChart({
  facts,
  variant,
  label,
}: {
  facts: ChartFacts;
  variant: 'rasi' | 'navamsa';
  label: string;
}) {
  const signOf = (p: PlanetName) =>
    variant === 'rasi' ? facts.planets[p].sign : facts.planets[p].navamsaSign;
  const lagnaSign = variant === 'rasi' ? facts.lagnaSign : navamsaOfAsc(facts);

  return (
    <div>
      <div className="grid aspect-square grid-cols-4 grid-rows-4 overflow-hidden rounded-xl2 border border-line bg-panel-soft">
        {SOUTH_CELLS.map((s, idx) => {
          if (s < 0) {
            return idx === 5 ? (
              <div
                key={idx}
                className="col-start-2 col-end-4 row-start-2 row-end-4 flex items-center justify-center text-[11px] text-ink-muted"
              >
                {variant === 'rasi' ? 'Rāśi D1' : 'Navāṁśa D9'}
              </div>
            ) : null;
          }
          const occ = ORDER.filter((p) => signOf(p) === s);
          return (
            <div key={idx} className="relative min-h-0 border-[.5px] border-line p-1 text-[9.5px]">
              <span className="absolute left-[3px] top-[2px] text-[8px] text-ink-muted">
                {RASHI_SHORT[s]}
              </span>
              <div className="mt-[11px] flex flex-wrap gap-[2px]">
                {s === lagnaSign && <span className="text-[9.5px] font-bold text-accent">As</span>}
                {occ.map((p) => (
                  <span key={p} className="text-[9.5px] font-bold text-gold-soft">
                    {PLANET_SHORT[p]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-ink-muted">{label}</p>
    </div>
  );
}

function navamsaOfAsc(facts: ChartFacts): number {
  // Lagna's own navamsa, derived from ascendant longitude.
  const lon = facts.lagnaSign * 30 + facts.ascendant.degree;
  return Math.floor(lon / (10 / 3)) % 12;
}
