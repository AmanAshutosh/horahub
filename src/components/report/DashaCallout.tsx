import type { ChartFacts } from '@/types/chart';
import { fmtDate } from '@/interpret';
import { TechnicalPanel } from './primitives/TechnicalPanel';

const PLANET_THEMES: Record<string, string> = {
  Sun:     'leadership, confidence, and self-expression',
  Moon:    'emotional awareness, intuition, and personal connections',
  Mars:    'ambition, direct action, and physical energy',
  Mercury: 'communication, sharp thinking, and analytical work',
  Jupiter: 'wisdom, growth, and fortunate opportunities',
  Venus:   'relationships, creativity, and enjoyment of life',
  Saturn:  'discipline, responsibility, and long-term achievement',
  Rahu:    'ambitious change, unconventional paths, and intense focus',
  Ketu:    'spiritual depth, inner wisdom, and a natural tendency toward detachment',
};

function fmtRemaining(endMs: number): string | null {
  const ms = endMs - Date.now();
  if (ms <= 0) return null;
  const years = ms / (1000 * 60 * 60 * 24 * 365.25);
  if (years >= 1) {
    const y = Math.round(years);
    return `~${y} year${y !== 1 ? 's' : ''} remaining`;
  }
  const months = Math.round(years * 12);
  if (months >= 1) return `~${months} month${months !== 1 ? 's' : ''} remaining`;
  return 'less than a month remaining';
}

export function DashaCallout({ facts }: { facts: ChartFacts }) {
  const { periods, antardashas, currentMahaIndex, currentAntarIndex } = facts.dasha;
  const currentMaha = periods[currentMahaIndex];
  const currentAntar = antardashas[currentAntarIndex];

  if (!currentMaha) return null;

  const remaining = fmtRemaining(currentMaha.endMs);
  const mahaTheme = PLANET_THEMES[currentMaha.lord] ?? 'focused themes and active life patterns';
  const antarTheme = currentAntar ? (PLANET_THEMES[currentAntar.lord] ?? null) : null;

  return (
    <div className="mb-8">
      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-[#1a1730] to-panel print:rounded-none print:border-gray-300 print:bg-white">
        <div className="h-[3px] bg-gradient-to-r from-gold/60 via-gold/30 to-transparent print:bg-gray-300" />

        <div className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/70 print:text-gray-400">
            Where You Are in Life Right Now
          </p>

          <h2 className="mt-3 text-[26px] font-bold leading-tight tracking-tight print:text-gray-900">
            You&apos;re in a {currentMaha.lord} period.
          </h2>

          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted print:text-gray-600">
            This is a chapter of life shaped by themes of {mahaTheme}.
          </p>

          {currentAntar && antarTheme && (
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted print:text-gray-500">
              Within this, {currentAntar.lord}&apos;s sub-period is now active — adding its own
              emphasis on {antarTheme}.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-muted print:text-gray-500">
            <span>
              {fmtDate(currentMaha.startMs)} — {fmtDate(currentMaha.endMs)}
            </span>
            {remaining && (
              <span className="font-semibold text-gold-soft print:text-gray-700">{remaining}</span>
            )}
          </div>

          <TechnicalPanel>
            <div className="space-y-1.5">
              <p>
                <span className="text-ink-subtle">What this is called: </span>
                {currentMaha.lord} Mahādaśā — a major planetary period in the Vimshottari Dasha
                system
              </p>
              {currentAntar && (
                <p>
                  <span className="text-ink-subtle">Active sub-period: </span>
                  {currentAntar.lord} Antardaśā ({fmtDate(currentAntar.startMs)} —{' '}
                  {fmtDate(currentAntar.endMs)})
                </p>
              )}
              <p>
                <span className="text-ink-subtle">How it&apos;s calculated: </span>
                From your Moon&apos;s Nakshatra (lunar mansion) position at birth, using the
                120-year Vimshottari planetary cycle
              </p>
              <p>
                <span className="text-ink-subtle">See full sequence: </span>
                <a
                  href="#dasha"
                  className="text-gold/80 underline underline-offset-2 hover:text-gold"
                >
                  Your Life Timeline ↓
                </a>
              </p>
            </div>
          </TechnicalPanel>
        </div>
      </div>
    </div>
  );
}
