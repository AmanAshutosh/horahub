import type { ChartFacts, PlanetName } from '@/types/chart';
import type { PersonInfo } from '@/types/report';
import { RASHI, NAKSHATRA, SIGN_LORD } from '@/constants/astro';
import { SectionShell } from '../primitives/SectionShell';
import { SouthChart, SouthChartLegend } from '../SouthChart';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLANET_ORDER: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

const HOUSE_TYPE: Record<number, string> = {
  1: 'Kendra + Trikona', 4: 'Kendra', 5: 'Trikona', 7: 'Kendra', 9: 'Trikona', 10: 'Kendra',
  3: 'Upachaya', 6: 'Dusthana + Upachaya', 8: 'Dusthana', 11: 'Upachaya', 12: 'Dusthana',
};

const DIGNITY_LABEL: Record<string, string> = {
  exalted:     'Exalted',
  own:         'Own / Moolatrikona',
  neutral:     'Neutral',
  debilitated: 'Debilitated',
};

const HOUSE_NAMES: Record<number, string> = {
  1: 'Self & Personality',    2: 'Wealth & Speech',
  3: 'Siblings & Courage',    4: 'Home & Happiness',
  5: 'Children & Intelligence', 6: 'Enemies & Health Challenges',
  7: 'Marriage & Partnerships', 8: 'Longevity & Hidden Matters',
  9: 'Fortune & Dharma',      10: 'Career & Public Life',
  11: 'Gains & Social Network', 12: 'Losses & Liberation',
};

const HOUSE_CLASSICAL: Record<number, string> = {
  1: 'Tanu', 2: 'Dhana', 3: 'Sahaja', 4: 'Sukha',
  5: 'Putra', 6: 'Ari', 7: 'Kalatra', 8: 'Mrityu',
  9: 'Dharma', 10: 'Karma', 11: 'Labha', 12: 'Vyaya',
};

const PENDING_DIVISIONAL = [
  { code: 'D2',  name: 'Horā',            theme: 'Wealth and financial capacity' },
  { code: 'D3',  name: 'Drekkana',        theme: 'Siblings and co-born' },
  { code: 'D4',  name: 'Chaturthamsa',    theme: 'Property and fixed assets' },
  { code: 'D7',  name: 'Saptamsha',       theme: 'Children and progeny' },
  { code: 'D10', name: 'Dasamsha',        theme: 'Career and professional life' },
  { code: 'D12', name: 'Dvadashamsha',    theme: 'Parents and ancestral lineage' },
  { code: 'D16', name: 'Shodashamsha',    theme: 'Vehicles and material comforts' },
  { code: 'D20', name: 'Vimsamsha',       theme: 'Spiritual progress and worship' },
  { code: 'D24', name: 'Chaturvimsamsha', theme: 'Education and learning' },
  { code: 'D27', name: 'Nakshatramsha',   theme: 'Strength and innate vitality' },
  { code: 'D30', name: 'Trimsamsha',      theme: 'Challenges and misfortune patterns' },
  { code: 'D60', name: 'Shashtyamsha',    theme: 'Overall karma and past-life influence' },
];

// ---------------------------------------------------------------------------
// Sub-section wrappers
// ---------------------------------------------------------------------------

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-ink-muted print:text-gray-400">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  facts: ChartFacts;
  person: PersonInfo | null;
  utcOffset: string;
  coordinates: { lat: number; lon: number };
  num: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TechnicalReferenceSection({ facts, person, utcOffset, coordinates, num }: Props) {
  return (
    <SectionShell
      id="tech-ref"
      num={num}
      title="Technical Reference"
      subtitle="Raw chart data behind every finding in this report — for verification and advanced study"
      breakBefore
    >
      <p className="mb-6 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        This section contains the full technical data from your birth chart. It is here for those
        who want to verify the numbers, cross-reference with other systems, or study further. You
        do not need to read this section to understand the report.
      </p>

      {/* ── 1. Birth & Computed Data ── */}
      <div className="mb-8">
        <SubHeading>Birth Data &amp; Computed Chart Elements</SubHeading>
        <div className="grid gap-px bg-line sm:grid-cols-2 print:bg-gray-200">
          {[
            ['Date of Birth',       person?.birthDate    ?? '—'],
            ['Time of Birth',       person?.birthTime    ?? '—'],
            ['Place of Birth',      person?.placeName    ?? '—'],
            ['Latitude',            `${coordinates.lat.toFixed(6)}°`],
            ['Longitude',           `${coordinates.lon.toFixed(6)}°`],
            ['UTC Offset',          utcOffset],
            ['Ayanāṁśa (Lahiri)',   `${facts.ayanamsa.toFixed(6)}°`],
            ['Lagna (Rising Sign)', `${RASHI[facts.lagnaSign] ?? '—'} ${facts.ascendant.degree.toFixed(2)}°`],
            ['Lagna Lord',          SIGN_LORD[facts.lagnaSign] ?? '—'],
            ['Moon Sign',           RASHI[facts.moon.sign] ?? '—'],
            ['Nakshatra',           `${NAKSHATRA[facts.moon.nakshatra] ?? '—'} · pada ${facts.moon.pada}`],
            ['House System',        'Whole-Sign'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 bg-panel-soft px-4 py-2.5 print:bg-white">
              <span className="text-[12px] text-ink-muted print:text-gray-500">{label}</span>
              <span className="shrink-0 font-mono text-[12px] text-ink print:text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Full Planet Data Table ── */}
      <div className="mb-8">
        <SubHeading>All Nine Planets — Full Positional Data</SubHeading>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] print:text-[10pt]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-muted print:text-gray-400">
                {['Planet', 'Sign', 'House', 'House Type', 'Nakshatra', 'Pada', 'Navamsa', 'Vargottama', 'Dignity'].map(
                  (col) => (
                    <th key={col} className="border-b border-line py-1.5 text-left pr-3 print:border-gray-300">
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {PLANET_ORDER.map((p) => {
                const d = facts.planets[p];
                const isVargottama = d.sign === d.navamsaSign;
                return (
                  <tr
                    key={p}
                    className={
                      d.dignity === 'exalted' || d.dignity === 'own'
                        ? 'text-good'
                        : d.dignity === 'debilitated'
                        ? 'text-danger'
                        : ''
                    }
                  >
                    <td className="border-b border-line py-1.5 pr-3 font-medium print:border-gray-200 print:text-gray-900">
                      {p}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {RASHI[d.sign] ?? '—'}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      H{d.house}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {HOUSE_TYPE[d.house] ?? 'Panapara'}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {NAKSHATRA[d.nakshatra] ?? '—'}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      P{d.pada}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {RASHI[d.navamsaSign] ?? '—'}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {isVargottama ? 'Yes ✓' : 'No'}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {DIGNITY_LABEL[d.dignity] ?? d.dignity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-ink-subtle print:text-gray-400">
          All values computed by Swiss Ephemeris (DE431) · Lahiri ayanamsa · Whole-Sign houses
        </p>
      </div>

      {/* ── 3. Full House Table ── */}
      <div className="mb-8">
        <SubHeading>All 12 Houses — Signs, Lords &amp; Occupants</SubHeading>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] print:text-[10pt]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-muted print:text-gray-400">
                {['House', 'Classical Name', 'Life Area', 'Sign', 'Lord', "Lord's House", 'Occupants'].map(
                  (col) => (
                    <th key={col} className="border-b border-line py-1.5 text-left pr-3 print:border-gray-300">
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {facts.houses.map((h) => {
                const lordHouse = facts.planets[h.lord].house;
                return (
                  <tr key={h.house}>
                    <td className="border-b border-line py-1.5 pr-3 font-medium print:border-gray-200 print:text-gray-900">
                      H{h.house}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 text-ink-muted print:border-gray-200 print:text-gray-500">
                      {HOUSE_CLASSICAL[h.house] ?? '—'}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {HOUSE_NAMES[h.house] ?? '—'}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {RASHI[h.sign] ?? '—'}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {h.lord}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      H{lordHouse}
                    </td>
                    <td className="border-b border-line py-1.5 pr-3 print:border-gray-200 print:text-gray-700">
                      {h.occupants.length > 0 ? h.occupants.join(', ') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. Birth Charts + Divisional Charts ── */}
      <div className="mb-6">
        <SubHeading>Birth Charts (D1 &amp; D9)</SubHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SouthChart facts={facts} variant="rasi"    label="D1 · Rāśi — Main birth chart" />
          <SouthChart facts={facts} variant="navamsa" label="D9 · Navāṁśa — Relationships and dharma" />
        </div>
        <SouthChartLegend />
      </div>

      <div>
        <SubHeading>Advanced Divisional Charts (coming in a future update)</SubHeading>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PENDING_DIVISIONAL.map((c) => (
            <div
              key={c.code}
              className="rounded-lg border border-dashed border-line bg-bg/40 p-3 print:border-gray-200"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-bold text-ink-muted print:text-gray-600">
                  {c.code}
                </span>
                <span className="text-[11px] text-ink-muted/80 print:text-gray-500">
                  · {c.name}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-muted/70 print:text-gray-400">{c.theme}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
