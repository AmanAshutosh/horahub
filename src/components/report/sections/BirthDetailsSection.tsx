import type { ChartFacts } from '@/types/chart';
import type { PersonInfo } from '@/types/report';
import { RASHI, NAKSHATRA } from '@/constants/astro';
import { SectionShell } from '../primitives/SectionShell';
import { TechnicalPanel } from '../primitives/TechnicalPanel';

function fmtBirthDate(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${day} ${months[Number(m) - 1] ?? ''} ${y}`;
}

function PlacementCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel-soft p-4 print:border-gray-200 print:bg-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold/70 print:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-[18px] font-bold leading-tight print:text-gray-900">{value}</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted print:text-gray-500">
        {description}
      </p>
    </div>
  );
}

interface Props {
  facts: ChartFacts;
  person: PersonInfo | null;
  utcOffset: string;
  coordinates: { lat: number; lon: number };
  num: number;
}

export function BirthDetailsSection({ facts, person, utcOffset, coordinates, num }: Props) {
  const risingSign = RASHI[facts.lagnaSign];
  const moonSign   = RASHI[facts.moon.sign];
  const birthStar  = NAKSHATRA[facts.moon.nakshatra];

  return (
    <SectionShell
      id="birth"
      num={num}
      title="Your Chart — Verified"
      subtitle="Confirm the birth details behind this report, and understand your three foundational placements"
    >
      {/* Verification strip */}
      <div className="mb-5 rounded-xl border border-line/60 bg-bg/50 px-4 py-3 print:border-gray-200">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted print:text-gray-400">
          This report was built from
        </p>
        <p className="mt-1 text-[14px] font-medium print:text-gray-800">
          {fmtBirthDate(person?.birthDate ?? '')} · {person?.birthTime ?? '—'} ·{' '}
          {person?.placeName ?? '—'}
        </p>
        <p className="mt-1 text-[11.5px] text-ink-subtle print:text-gray-400">
          If any of these are incorrect, generate a new chart from the home page.
        </p>
      </div>

      {/* Three foundational placements */}
      <p className="mb-3 text-[13px] font-medium text-ink print:text-gray-800">
        Your three core placements
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <PlacementCard
          label="Rising Sign"
          value={risingSign ?? '—'}
          description="The sign on the eastern horizon when you were born. Shapes how you naturally present yourself to the world — your outward personality and first impression."
        />
        <PlacementCard
          label="Moon Sign"
          value={moonSign ?? '—'}
          description="The sign the Moon occupied at birth. Governs your emotional nature — how you instinctively feel, what you need to feel secure, and your inner world."
        />
        <PlacementCard
          label="Birth Star"
          value={birthStar ?? '—'}
          description={`The lunar mansion the Moon occupied at birth${birthStar ? ` (${birthStar})` : ''}. This determines where your life-period timeline begins.`}
        />
      </div>

      <TechnicalPanel>
        <div className="space-y-1.5">
          <p>
            <span className="text-ink-subtle">Latitude / Longitude: </span>
            {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
          </p>
          <p>
            <span className="text-ink-subtle">UTC offset: </span>
            {utcOffset}
          </p>
          <p>
            <span className="text-ink-subtle">Ayanāṁśa (Lahiri): </span>
            {facts.ayanamsa.toFixed(4)}° — the offset between the tropical and sidereal zodiacs
          </p>
          <p>
            <span className="text-ink-subtle">Rising degree (Lagna): </span>
            {risingSign ?? '—'} {facts.ascendant.degree.toFixed(2)}°
          </p>
          <p>
            <span className="text-ink-subtle">Birth star pada: </span>
            {birthStar ?? '—'} pada {facts.moon.pada}
          </p>
          <p>
            <span className="text-ink-subtle">House system: </span>
            Whole-Sign — each of the 12 houses spans exactly one zodiac sign
          </p>
        </div>
      </TechnicalPanel>
    </SectionShell>
  );
}
