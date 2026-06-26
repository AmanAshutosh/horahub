import type { ChartFacts } from '@/types/chart';
import { fmtDate } from '@/interpret';

const COLORS: Record<string, string> = {
  Ketu: '#9a8fb0', Venus: '#e6a3c4', Sun: '#e0a85f', Moon: '#bcc4d6', Mars: '#d96a6a',
  Rahu: '#8b7cf0', Jupiter: '#d8b46a', Saturn: '#5f7fbf', Mercury: '#5fbf8f',
};

export function DashaTimeline({ facts }: { facts: ChartFacts }) {
  const { periods, antardashas, currentMahaIndex, currentAntarIndex } = facts.dasha;
  const first = periods[0];
  const last = periods[periods.length - 1];
  const total = first && last ? last.endMs - first.startMs : 1;

  return (
    <section id="dasha" className="scroll-mt-24">
      <h2 className="mb-2.5 mt-5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-gold before:inline-block before:h-px before:w-3.5 before:bg-gold">
        Vimśottari Daśā
      </h2>

      <div className="my-1 flex h-[30px] overflow-hidden rounded-[9px] border border-line">
        {periods.map((p, i) => {
          const w = ((p.endMs - p.startMs) / total) * 100;
          return (
            <div
              key={i}
              title={`${p.lord} ${fmtDate(p.startMs)}–${fmtDate(p.endMs)}`}
              style={{ flex: `0 0 ${w.toFixed(2)}%`, background: COLORS[p.lord] }}
              className={`flex items-center justify-center overflow-hidden whitespace-nowrap text-[9.5px] font-extrabold text-[#0c0c12] ${
                i === currentMahaIndex ? 'shadow-[inset_0_0_0_2px_#fff]' : ''
              }`}
            >
              {w > 5 ? p.lord.slice(0, 2) : ''}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-muted">
        Each block = one Mahādaśā · outlined = current · full cycle 120 yr.
      </p>

      <table className="mt-2.5 w-full border-collapse text-[13px]">
        <thead>
          <tr className="text-[10.5px] uppercase text-ink-muted">
            <th className="border-b border-line py-1.5 text-left">Mahādaśā</th>
            <th className="border-b border-line py-1.5 text-left">From</th>
            <th className="border-b border-line py-1.5 text-left">To</th>
            <th className="border-b border-line py-1.5 text-left">Yrs</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p, i) => (
            <tr key={i} className={i === currentMahaIndex ? 'bg-accent/12' : ''}>
              <td className="border-b border-line py-1.5">
                {p.lord}
                {p.partial && <span className="text-ink-muted"> (bal.)</span>}
              </td>
              <td className="border-b border-line py-1.5">{fmtDate(p.startMs)}</td>
              <td className="border-b border-line py-1.5">{fmtDate(p.endMs)}</td>
              <td className="border-b border-line py-1.5">{p.years}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {currentMahaIndex >= 0 && antardashas.length > 0 && (
        <>
          <h3 className="mb-1 mt-4 text-[12px] uppercase tracking-wide text-gold">
            Antardaśā in current {periods[currentMahaIndex]?.lord} Mahādaśā
          </h3>
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {antardashas.map((a, i) => (
                <tr key={i} className={i === currentAntarIndex ? 'bg-accent/12' : ''}>
                  <td className="border-b border-line py-1.5">{a.lord}</td>
                  <td className="border-b border-line py-1.5">{fmtDate(a.startMs)}</td>
                  <td className="border-b border-line py-1.5 text-ink-muted">→ {fmtDate(a.endMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
