import type { ChartFacts } from '@/types/chart';
import { SectionShell } from '../primitives/SectionShell';
import { SouthChart, SouthChartLegend } from '../SouthChart';

const PENDING_CHARTS = [
  { code: 'D2',  name: 'Horā',             theme: 'Wealth and financial capacity' },
  { code: 'D3',  name: 'Drekkana',         theme: 'Siblings and co-born' },
  { code: 'D4',  name: 'Chaturthamsa',     theme: 'Property and fixed assets' },
  { code: 'D7',  name: 'Saptamsha',        theme: 'Children and progeny' },
  { code: 'D10', name: 'Dasamsha',         theme: 'Career and professional life' },
  { code: 'D12', name: 'Dvadashamsha',     theme: 'Parents and ancestral lineage' },
  { code: 'D16', name: 'Shodashamsha',     theme: 'Vehicles and material comforts' },
  { code: 'D20', name: 'Vimsamsha',        theme: 'Spiritual progress and worship' },
  { code: 'D24', name: 'Chaturvimsamsha',  theme: 'Education and learning' },
  { code: 'D27', name: 'Nakshatramsha',    theme: 'Strength and innate vitality' },
  { code: 'D30', name: 'Trimsamsha',       theme: 'Challenges and misfortune patterns' },
  { code: 'D60', name: 'Shashtyamsha',     theme: 'Overall karma and past-life influence' },
];

interface Props {
  facts: ChartFacts;
  num: number;
}

export function DivisionalChartsSection({ facts, num }: Props) {
  return (
    <SectionShell
      id="d-charts"
      num={num}
      title="Divisional Charts (Varga)"
      subtitle="Special sub-charts that zoom into specific areas of life — each derived from the main birth chart"
    >
      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        Classical Vedic astrology uses a system of divisional charts called Vargas.
        Each one is calculated by dividing the signs into smaller segments, revealing
        more detail about a specific area of life — D10 for career, D9 for relationships, D7 for children, and so on.
        The two computed charts below (D1 and D9) are derived from your birth data using Swiss Ephemeris.
        The remaining charts require an extended ephemeris module and will be added in a future update.
      </p>

      {/* Computed charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SouthChart facts={facts} variant="rasi"    label="D1 · Rāśi — Main birth chart" />
        <SouthChart facts={facts} variant="navamsa" label="D9 · Navāṁśa — Relationships and dharma" />
      </div>
      <SouthChartLegend />

      {/* Pending charts grid */}
      <div className="mt-6">
        <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-widest text-ink-muted print:text-gray-500">
          Charts coming in a future update
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PENDING_CHARTS.map((c) => (
            <div
              key={c.code}
              className="rounded-lg border border-dashed border-line bg-bg/40 p-3 print:border-gray-200"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-bold text-ink-muted print:text-gray-600">{c.code}</span>
                <span className="text-[11px] text-ink-muted/80 print:text-gray-500">· {c.name}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-muted/70 print:text-gray-400">{c.theme}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
