import type { ChartFacts } from '@/types/chart';
import { fmtDate } from '@/interpret';
import { TechnicalPanel } from './primitives/TechnicalPanel';

const COLORS: Record<string, string> = {
  Ketu:    '#9a8fb0',
  Venus:   '#e6a3c4',
  Sun:     '#e0a85f',
  Moon:    '#bcc4d6',
  Mars:    '#d96a6a',
  Rahu:    '#8b7cf0',
  Jupiter: '#d8b46a',
  Saturn:  '#5f7fbf',
  Mercury: '#5fbf8f',
};

const PLANET_THEMES: Record<string, string> = {
  Sun:     'leadership, confidence, and self-expression',
  Moon:    'emotional awareness, intuition, and personal connections',
  Mars:    'ambition, direct action, and physical energy',
  Mercury: 'communication, sharp thinking, and analytical work',
  Jupiter: 'wisdom, expansion, and fortunate opportunities',
  Venus:   'relationships, creativity, and enjoyment of life',
  Saturn:  'discipline, responsibility, and long-term achievement',
  Rahu:    'ambitious change, unconventional paths, and intense focus',
  Ketu:    'spiritual depth, inner wisdom, and a tendency toward detachment',
};

export function DashaTimeline({ facts }: { facts: ChartFacts }) {
  const { periods, antardashas, currentMahaIndex, currentAntarIndex } = facts.dasha;
  const first = periods[0];
  const last  = periods[periods.length - 1];
  const total = first && last ? last.endMs - first.startMs : 1;
  const currentMaha = periods[currentMahaIndex];

  return (
    <div id="dasha-table" className="scroll-mt-4">
      <p className="mb-3 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        Below is the complete sequence of planetary periods across your life. Each colored block
        is one major period — lasting anywhere from 6 to 20 years. The highlighted block is where
        you are right now. Sub-periods within your current chapter are listed below the overview.
      </p>

      {/* Coloured timeline bar */}
      <div className="my-2 flex h-8 overflow-hidden rounded-[9px] border border-line">
        {periods.map((p, i) => {
          const w = ((p.endMs - p.startMs) / total) * 100;
          return (
            <div
              key={i}
              title={`${p.lord}: ${fmtDate(p.startMs)} – ${fmtDate(p.endMs)}`}
              style={{ flex: `0 0 ${w.toFixed(2)}%`, background: COLORS[p.lord] ?? '#6b7280' }}
              className={`flex items-center justify-center overflow-hidden whitespace-nowrap text-[9.5px] font-extrabold text-[#0c0c12] ${
                i === currentMahaIndex ? 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9)]' : ''
              }`}
            >
              {w > 5 ? p.lord.slice(0, 2) : ''}
            </div>
          );
        })}
      </div>
      <p className="mb-4 text-[11px] text-ink-muted print:text-gray-400">
        Each block is one major period · the outlined block is your current period · full sequence
        spans 120 years
      </p>

      {/* Major periods table */}
      <table className="w-full border-collapse text-[13px] print:text-[11px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-wide text-ink-muted print:text-gray-400">
            <th className="border-b border-line py-1.5 text-left">Major Period</th>
            <th className="border-b border-line py-1.5 text-left">Starts</th>
            <th className="border-b border-line py-1.5 text-left">Ends</th>
            <th className="border-b border-line py-1.5 text-left">Length</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p, i) => (
            <tr key={i} className={i === currentMahaIndex ? 'bg-accent/12 print:bg-gray-100' : ''}>
              <td className="border-b border-line py-1.5 font-medium print:border-gray-200">
                <span>{p.lord}</span>
                {i === currentMahaIndex && (
                  <span className="ml-2 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent print:bg-gray-200 print:text-gray-600">
                    you are here
                  </span>
                )}
                {p.partial && (
                  <span className="ml-1 text-[11px] text-ink-muted print:text-gray-400">
                    {' '}(started before birth)
                  </span>
                )}
              </td>
              <td className="border-b border-line py-1.5 print:border-gray-200">
                {fmtDate(p.startMs)}
              </td>
              <td className="border-b border-line py-1.5 print:border-gray-200">
                {fmtDate(p.endMs)}
              </td>
              <td className="border-b border-line py-1.5 text-ink-muted print:border-gray-200 print:text-gray-400">
                {p.years} yr
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sub-periods within the current major period */}
      {currentMahaIndex >= 0 && antardashas.length > 0 && currentMaha && (
        <div className="mt-6">
          <p className="mb-1 text-[13px] font-semibold print:text-gray-700">
            Sub-periods within your {currentMaha.lord} chapter
          </p>
          <p className="mb-3 text-[12px] leading-relaxed text-ink-muted print:text-gray-500">
            Within each major period, shorter sub-periods cycle through all nine planets —
            each adding its own flavour of energy. The highlighted row is your current sub-period.
          </p>
          <table className="w-full border-collapse text-[13px] print:text-[11px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-ink-muted print:text-gray-400">
                <th className="border-b border-line py-1.5 text-left">Sub-period</th>
                <th className="border-b border-line py-1.5 text-left">Themes</th>
                <th className="border-b border-line py-1.5 text-left">Starts</th>
                <th className="border-b border-line py-1.5 text-left">Ends</th>
              </tr>
            </thead>
            <tbody>
              {antardashas.map((a, i) => (
                <tr
                  key={i}
                  className={i === currentAntarIndex ? 'bg-accent/12 print:bg-gray-100' : ''}
                >
                  <td className="border-b border-line py-1.5 font-medium print:border-gray-200">
                    {a.lord}
                    {i === currentAntarIndex && (
                      <span className="ml-2 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent print:bg-gray-200 print:text-gray-600">
                        active
                      </span>
                    )}
                  </td>
                  <td className="border-b border-line py-1.5 text-[12px] text-ink-muted print:border-gray-200 print:text-gray-500">
                    {PLANET_THEMES[a.lord] ?? ''}
                  </td>
                  <td className="border-b border-line py-1.5 print:border-gray-200">
                    {fmtDate(a.startMs)}
                  </td>
                  <td className="border-b border-line py-1.5 print:border-gray-200">
                    {fmtDate(a.endMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TechnicalPanel>
        <div className="space-y-1">
          <p>
            <span className="text-ink-subtle">System: </span>
            Vimshottari Dasha — a 120-year cycle of planetary major periods (Mahādaśā) and
            sub-periods (Antardaśā)
          </p>
          <p>
            <span className="text-ink-subtle">Calculated from: </span>
            The Moon&apos;s position in its Nakshatra (lunar mansion) at the time of birth
          </p>
        </div>
      </TechnicalPanel>
    </div>
  );
}
