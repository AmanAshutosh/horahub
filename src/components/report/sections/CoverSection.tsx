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

function FactCol({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div>
      <p className="report-cover-fact-label">{label}</p>
      <p className="report-cover-fact-hint">{hint}</p>
      <p className="report-cover-fact-value">{value}</p>
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
    <section id="cover" className="report-cover">

      {/* ── Top strip ── */}
      <hr className="report-cover-rule" />
      <div className="report-cover-top">
        <span className="report-cover-wordmark">HoraHub · Vedic Astrology</span>
        <span className="report-cover-gendate">{generatedAt}</span>
      </div>
      <hr className="report-cover-rule" />

      {/* ── Hero — name ── */}
      <div className="report-cover-hero">
        <p className="report-cover-report-type">Personal Birth Chart Report</p>
        <h1 className="report-cover-name">{person?.fullName ?? '—'}</h1>
        <p className="report-cover-bio">
          {person?.gender ? person.gender.charAt(0).toUpperCase() + person.gender.slice(1).toLowerCase() : ''}
          {person?.birthDate ? ` · Born ${fmtBirthDate(person.birthDate)}` : ''}
          {person?.placeName ? ` · ${person.placeName}` : ''}
        </p>
      </div>
      <hr className="report-cover-rule" />

      {/* ── Key facts — editorial columns ── */}
      <div className="report-cover-facts">
        <FactCol
          label="Date of Birth"
          hint="Used to calculate your planetary positions"
          value={fmtBirthDate(person?.birthDate ?? '')}
        />
        <FactCol
          label="Time of Birth"
          hint="Determines which sign was rising at birth"
          value={person?.birthTime ?? '—'}
        />
        <FactCol
          label="Place of Birth"
          hint="Sets the local sky at the moment of your birth"
          value={person?.placeName ?? '—'}
        />
        <FactCol
          label="Rising Sign"
          hint="How you present to the world and your physical constitution"
          value={risingSign ?? '—'}
        />
        <FactCol
          label="Moon Sign · Birth Star"
          hint="Your emotional nature and the lunar mansion the Moon occupied"
          value={`${moonSign ?? '—'}${birthStar ? ` · ${birthStar}` : ''}`}
        />
        <FactCol
          label="Current Life Chapter"
          hint="The planetary period shaping the dominant themes in your life right now"
          value={currentPeriodValue}
        />
      </div>
      <hr className="report-cover-rule" />

      {/* ── Intro text ── */}
      <div className="report-cover-intro-wrap">
        <p className="report-cover-intro">
          This report translates your birth chart into plain language — what it suggests about
          your personality, relationships, career, health, finances, and the chapter of life
          you&apos;re currently in. Every finding traces to a specific classical Vedic text.
          Nothing is invented or generalised.
        </p>
      </div>
      <hr className="report-cover-rule" />

      {/* ── Footer ── */}
      <div className="report-cover-footer">
        {chartId && (
          <span>Chart <code>{chartId.slice(0, 14)}</code></span>
        )}
        <span>Knowledge Base v{kbVersion}</span>
      </div>

    </section>
  );
}
