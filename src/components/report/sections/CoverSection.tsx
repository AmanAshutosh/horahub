import type { ChartFacts } from '@/types/chart';
import type { PersonInfo } from '@/types/report';
import { RASHI, NAKSHATRA } from '@/constants/astro';

function fmtBirthDate(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${day} ${months[Number(m) - 1] ?? ''} ${y}`;
}

function FactCell({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div className="bg-panel px-4 py-4 print:bg-white">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gold/70 print:text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-ink-muted print:text-gray-400">{hint}</p>
      <p className="mt-1.5 text-[14px] font-semibold leading-snug print:text-gray-900">{value}</p>
    </div>
  );
}

interface Props {
  facts: ChartFacts;
  person: PersonInfo | null;
  chartId?: string;
  kbVersion: string;
  generatedAt: string;
}

export function CoverSection({ facts, person, chartId, kbVersion, generatedAt }: Props) {
  const currentDasha = facts.dasha.periods[facts.dasha.currentMahaIndex];
  const currentAntar = facts.dasha.antardashas[facts.dasha.currentAntarIndex];

  const risingSign = RASHI[facts.lagnaSign];
  const moonSign   = RASHI[facts.moon.sign];
  const birthStar  = NAKSHATRA[facts.moon.nakshatra];

  const currentPeriodValue = currentDasha
    ? `${currentDasha.lord}${currentAntar ? ` · ${currentAntar.lord} sub-period` : ''}`
    : '—';

  return (
    <section
      id="cover"
      className="mb-2 overflow-hidden rounded-xl2 border border-line bg-panel print:rounded-none print:border-none print:bg-white"
    >
      {/* Header */}
      <div className="border-b border-line bg-gradient-to-r from-[#1b1733] to-panel px-6 py-4 print:border-gray-200 print:bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/60 print:text-gray-400">
              HoraHub · Vedic Astrology
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted print:text-gray-500">
              Personal Birth Chart Report
            </p>
          </div>
          <p className="text-right text-[11px] text-ink-muted print:text-gray-400">{generatedAt}</p>
        </div>
      </div>

      {/* Name + intro */}
      <div className="border-b border-line px-6 py-6 print:border-gray-200">
        <p className="text-[11px] uppercase tracking-widest text-ink-muted print:text-gray-400">
          Prepared for
        </p>
        <h1 className="mt-1 text-[32px] font-bold leading-tight tracking-tight text-gold print:text-gray-900">
          {person?.fullName ?? '—'}
        </h1>
        {person?.gender && (
          <p className="mt-0.5 text-[12px] capitalize text-ink-muted print:text-gray-500">
            {person.gender.toLowerCase()}
          </p>
        )}
        <p className="mt-4 max-w-[600px] text-[14px] leading-relaxed text-ink-muted print:text-gray-600">
          This report translates your birth chart into plain language — what it suggests about your
          personality, relationships, career, health, finances, and the chapter of life you&apos;re
          currently in. Every finding traces to a specific classical Vedic text. Nothing is
          invented or generalised.
        </p>
      </div>

      {/* Key facts — verification + three core placements */}
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-3 print:border-gray-200 print:bg-gray-200">
        <FactCell
          label="Date of Birth"
          hint="Used to calculate your planetary positions"
          value={fmtBirthDate(person?.birthDate ?? '')}
        />
        <FactCell
          label="Time of Birth"
          hint="Determines which sign was rising — precision matters here"
          value={person?.birthTime ?? '—'}
        />
        <FactCell
          label="Place of Birth"
          hint="Sets the local sky at the moment of your birth"
          value={person?.placeName ?? '—'}
        />
        <FactCell
          label="Rising Sign"
          hint="The sign on the eastern horizon at birth — how you present to the world"
          value={risingSign ?? '—'}
        />
        <FactCell
          label="Moon Sign &amp; Birth Star"
          hint="Your emotional nature (Moon sign) and the lunar mansion the Moon occupied"
          value={`${moonSign ?? '—'}${birthStar ? ` · ${birthStar}` : ''}`}
        />
        <FactCell
          label="Current Life Chapter"
          hint="The planetary period currently shaping the dominant themes in your life"
          value={currentPeriodValue}
        />
      </div>

      {/* Footer — minimal */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-6 py-3 text-[11px] text-ink-muted print:text-gray-400">
        {chartId && (
          <span>
            Chart{' '}
            <code className="font-mono text-[10.5px] print:text-gray-600">
              {chartId.slice(0, 14)}
            </code>
          </span>
        )}
        <span>KB v{kbVersion}</span>
      </div>
    </section>
  );
}
