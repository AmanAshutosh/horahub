import type { ChartFacts } from '@/types/chart';
import { SectionShell } from '../primitives/SectionShell';
import { SouthChart } from '../SouthChart';

const PENDING_CHARTS = [
  { code: 'D2', name: 'Horā', theme: 'Wealth and financial strength' },
  { code: 'D3', name: 'Drekkana', theme: 'Siblings and co-born' },
  { code: 'D4', name: 'Chaturthamsa', theme: 'Property and fixed assets' },
  { code: 'D7', name: 'Saptamsha', theme: 'Children and progeny' },
  { code: 'D10', name: 'Dasamsha', theme: 'Career and professional life' },
  { code: 'D12', name: 'Dvadashamsha', theme: 'Parents and lineage' },
  { code: 'D16', name: 'Shodashamsha', theme: 'Vehicles and comforts' },
  { code: 'D20', name: 'Vimsamsha', theme: 'Spiritual progress and worship' },
  { code: 'D24', name: 'Chaturvimsamsha', theme: 'Education and learning' },
  { code: 'D27', name: 'Nakshatramsha', theme: 'Strength and vitality' },
  { code: 'D30', name: 'Trimsamsha', theme: 'Misfortune and evil tendencies' },
  { code: 'D60', name: 'Shashtyamsha', theme: 'Overall karma and past-life effects' },
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
      subtitle="D1 and D9 computed · D2 – D60 require extended ephemeris module"
    >
      {/* Computed charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <SouthChart facts={facts} variant="rasi" label="D1 · Rāśi — Main birth chart" />
        </div>
        <div>
          <SouthChart facts={facts} variant="navamsa" label="D9 · Navāṁśa — Spouse and dharma" />
        </div>
      </div>

      {/* Pending charts grid */}
      <div className="mt-5">
        <p className="mb-3 text-[12px] font-semibold text-ink-muted print:text-gray-500">
          Remaining divisional charts — pending ephemeris extension:
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PENDING_CHARTS.map((c) => (
            <div
              key={c.code}
              className="rounded-lg border border-dashed border-line bg-bg/40 p-3 print:border-gray-200"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-bold text-ink-muted">{c.code}</span>
                <span className="text-[11px] text-ink-muted">· {c.name}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-muted/70">{c.theme}</p>
              <p className="mt-1 text-[10px] text-ink-muted/50">Pending Knowledge Engine</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
