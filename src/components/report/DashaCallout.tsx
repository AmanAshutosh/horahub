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
  const currentMaha  = periods[currentMahaIndex];
  const currentAntar = antardashas[currentAntarIndex];

  if (!currentMaha) return null;

  const remaining  = fmtRemaining(currentMaha.endMs);
  const mahaTheme  = PLANET_THEMES[currentMaha.lord] ?? 'focused themes and active life patterns';
  const antarTheme = currentAntar ? (PLANET_THEMES[currentAntar.lord] ?? null) : null;

  return (
    <div className="dasha-callout">
      <p className="dasha-callout-label">Where You Are in Life Right Now</p>

      <p className="dasha-callout-heading">
        You&apos;re in a {currentMaha.lord} period.
      </p>

      <p className="dasha-callout-body">
        This is a chapter shaped by themes of {mahaTheme}.
      </p>

      {currentAntar && antarTheme && (
        <p className="dasha-callout-sub">
          Within this, {currentAntar.lord}&apos;s sub-period is now active — adding its own
          emphasis on {antarTheme}.
        </p>
      )}

      <div className="dasha-callout-meta">
        <span>{fmtDate(currentMaha.startMs)} — {fmtDate(currentMaha.endMs)}</span>
        {remaining && <span className="dasha-callout-remaining">{remaining}</span>}
      </div>

      <TechnicalPanel>
        <div className="space-y-1.5">
          <p>
            <span style={{ color: 'var(--color-ink-subtle)' }}>What this is called: </span>
            {currentMaha.lord} Mahādaśā — a major planetary period in the Vimshottari Dasha system
          </p>
          {currentAntar && (
            <p>
              <span style={{ color: 'var(--color-ink-subtle)' }}>Active sub-period: </span>
              {currentAntar.lord} Antardaśā ({fmtDate(currentAntar.startMs)} — {fmtDate(currentAntar.endMs)})
            </p>
          )}
          <p>
            <span style={{ color: 'var(--color-ink-subtle)' }}>How it&apos;s calculated: </span>
            From your Moon&apos;s Nakshatra position at birth, using the 120-year Vimshottari planetary cycle
          </p>
          <p>
            <span style={{ color: 'var(--color-ink-subtle)' }}>See full sequence: </span>
            <a href="#dasha" className="underline underline-offset-2" style={{ color: 'var(--color-ink-muted)' }}>
              Your Life Timeline ↓
            </a>
          </p>
        </div>
      </TechnicalPanel>
    </div>
  );
}
