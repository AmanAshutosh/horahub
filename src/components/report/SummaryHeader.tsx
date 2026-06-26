import type { ChartFacts } from '@/types/chart';
import { NAKSHATRA, RASHI, SIGN_LORD } from '@/constants/astro';

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-[11px] border border-line bg-panel-soft px-2.5 py-2.5">
      <div className="text-[10.5px] uppercase tracking-wide text-ink-muted">{k}</div>
      <div className="mt-0.5 text-[15px] font-semibold">{v}</div>
    </div>
  );
}

export function SummaryHeader({ facts, ayanLabel }: { facts: ChartFacts; ayanLabel?: string }) {
  return (
    <section id="sum" className="scroll-mt-24">
      <h2 className="mb-2.5 mt-5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-gold before:inline-block before:h-px before:w-3.5 before:bg-gold">
        Birth &amp; Panchanga
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Kv k="Ayanāṁśa (Lahiri)" v={`${facts.ayanamsa.toFixed(3)}°`} />
        <Kv
          k="Lagna (Ascendant)"
          v={
            <>
              {RASHI[facts.lagnaSign]}{' '}
              <span className="text-[11.5px] font-normal text-ink-muted">
                ~{facts.ascendant.degree.toFixed(1)}°
              </span>
            </>
          }
        />
        <Kv
          k="Moon sign"
          v={
            <>
              {RASHI[facts.moon.sign]}{' '}
              <span className="text-[11.5px] font-normal text-ink-muted">
                · lord {SIGN_LORD[facts.moon.sign]}
              </span>
            </>
          }
        />
        <Kv
          k="Birth star"
          v={
            <span className="text-[13.5px]">
              {NAKSHATRA[facts.moon.nakshatra]}{' '}
              <span className="text-[11.5px] font-normal text-ink-muted">· pada {facts.moon.pada}</span>
            </span>
          }
        />
        {ayanLabel && <Kv k="UTC offset" v={ayanLabel} />}
        <Kv k="Daśā at birth" v={facts.dasha.periods[0]?.lord ?? '—'} />
      </div>
      <p className="mt-2 text-[11.5px] text-ink-muted">
        Coordinates and timezone were resolved from the place entered; the UTC offset accounts for any
        daylight saving in effect on the birth date. Ascendant is approximate near sign boundaries.
      </p>
    </section>
  );
}
