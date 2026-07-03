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
                {s === lagnaSign && <span className="text-[9.5px] font-bold text-primary">As</span>}
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

/** Standalone legend for use below a group of SouthChart instances. */
export function SouthChartLegend() {
  return (
    <div className="mt-3 rounded-lg border border-line/60 bg-bg/40 p-3.5 text-[11px] leading-relaxed text-ink-muted print:border-gray-200 print:bg-white">
      {/* How to read */}
      <p className="mb-2.5">
        <span className="font-semibold text-ink-muted print:text-gray-700">How to read: </span>
        Each cell is one zodiac sign (3-letter code in the top corner). Signs are fixed in position —
        they do not rotate. Planets appear in the cell matching the sign they occupied at your birth.{' '}
        <span className="font-semibold text-primary print:text-blue-600">As</span>{' '}
        marks your rising sign (Lagna).
      </p>

      {/* Planet key */}
      <div className="mb-2">
        <span className="font-semibold text-ink-muted print:text-gray-700">Planet codes — </span>
        <span>
          {([
            ['Su', 'Sun'],
            ['Mo', 'Moon'],
            ['Ma', 'Mars'],
            ['Me', 'Mercury'],
            ['Ju', 'Jupiter'],
            ['Ve', 'Venus'],
            ['Sa', 'Saturn'],
            ['Ra', 'Rahu (N.Node)'],
            ['Ke', 'Ketu (S.Node)'],
          ] as const).map(([abbr, name], i, arr) => (
            <span key={abbr}>
              <span className="font-bold text-gold-soft print:text-gray-800">{abbr}</span>
              <span className="text-ink-muted/80 print:text-gray-500"> = {name}</span>
              {i < arr.length - 1 && <span className="mx-1 select-none opacity-40">·</span>}
            </span>
          ))}
        </span>
      </div>

      {/* Sign key */}
      <div>
        <span className="font-semibold text-ink-muted print:text-gray-700">Sign codes — </span>
        <span className="inline-grid grid-cols-3 gap-x-4 gap-y-0.5 sm:grid-cols-4 md:grid-cols-6">
          {([
            ['Ari', 'Aries'],   ['Tau', 'Taurus'],  ['Gem', 'Gemini'],
            ['Can', 'Cancer'],  ['Leo', 'Leo'],      ['Vir', 'Virgo'],
            ['Lib', 'Libra'],   ['Sco', 'Scorpio'], ['Sag', 'Sagittarius'],
            ['Cap', 'Capricorn'], ['Aqu', 'Aquarius'], ['Pis', 'Pisces'],
          ] as const).map(([abbr, name]) => (
            <span key={abbr} className="whitespace-nowrap">
              <span className="font-bold text-ink-muted print:text-gray-700">{abbr}</span>
              <span className="text-ink-muted/80 print:text-gray-500"> = {name}</span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

function navamsaOfAsc(facts: ChartFacts): number {
  // Lagna's own navamsa, derived from ascendant longitude.
  const lon = facts.lagnaSign * 30 + facts.ascendant.degree;
  return Math.floor(lon / (10 / 3)) % 12;
}
