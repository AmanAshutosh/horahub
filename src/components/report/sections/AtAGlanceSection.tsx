'use client';
import type { ReactNode } from 'react';
import type { ChartFacts, PlanetName, PlanetPlacement } from '@/types/chart';
import type { ReportSectionData } from '@/types/report';
import { RASHI } from '@/constants/astro';
import { fmtDate } from '@/interpret';
import { TechnicalPanel } from '../primitives/TechnicalPanel';

// ---------------------------------------------------------------------------
// Planet descriptions for human-language context
// ---------------------------------------------------------------------------

const PLANET_PERIOD_THEME: Record<string, string> = {
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

const PLANET_QUALITY: Record<PlanetName, string> = {
  Sun:     'Confidence, self-expression, and natural authority',
  Moon:    'Emotional intelligence and intuitive awareness',
  Mars:    'Drive, courage, and the ability to act decisively',
  Mercury: 'Sharp thinking, communication, and learning ability',
  Jupiter: 'Wisdom, good judgment, and the capacity to grow',
  Venus:   'A talent for relationships, beauty, and creative expression',
  Saturn:  'Discipline, patience, and the ability to build lasting things',
  Rahu:    'Ambition, innovation, and drive toward new territory',
  Ketu:    'Spiritual insight and an innate sense of what truly matters',
};

const DIGNITY_PLAIN: Record<string, string> = {
  exalted:     'at its most powerful',
  own:         'in its home territory — very comfortable',
  neutral:     'in a balanced position',
  debilitated: 'in a more challenged position',
};

// ---------------------------------------------------------------------------
// Planet strength scoring (same logic as before, unchanged)
// ---------------------------------------------------------------------------

const DIGNITY_SCORE: Record<string, number> = {
  exalted: 4, own: 3, neutral: 2, debilitated: 0,
};
const DIGNITY_LABEL: Record<string, string> = {
  exalted:     'Exalted',
  own:         'Own sign',
  neutral:     'Neutral',
  debilitated: 'Debilitated',
};
const DIGNITY_CLS: Record<string, string> = {
  exalted:     'bg-good/20 text-good',
  own:         'bg-gold/20 text-gold',
  neutral:     'bg-ink-muted/15 text-ink-muted',
  debilitated: 'bg-danger/20 text-danger',
};
const HOUSE_BONUS: Record<number, number> = {
  1: 4, 5: 3, 9: 3, 4: 2, 7: 2, 10: 2,
  3: 1, 11: 1, 2: 0, 6: -1, 8: -1, 12: -1,
};
const SCORED_PLANETS: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn',
];

function planetScore(p: PlanetPlacement): number {
  const d = DIGNITY_SCORE[p.dignity] ?? 2;
  const h = HOUSE_BONUS[p.house] ?? 0;
  const v = p.sign === p.navamsaSign ? 1 : 0;
  return d + h + v;
}

function findStrongest(facts: ChartFacts): { name: PlanetName; p: PlanetPlacement } | null {
  return SCORED_PLANETS.reduce<{ name: PlanetName; p: PlanetPlacement; score: number } | null>(
    (best, name) => {
      const p = facts.planets[name];
      const score = planetScore(p);
      return !best || score > best.score ? { name, p, score } : best;
    },
    null,
  );
}

const LIFE_AREA_LABEL: Record<string, string> = {
  career:   'Career & Purpose',
  marriage: 'Relationships',
  health:   'Health & Wellbeing',
  finance:  'Finance & Wealth',
};

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------

function GlanceCard({
  label,
  anchor,
  children,
}: {
  label: string;
  anchor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel-soft print:rounded-none print:border-gray-200 print:bg-white">
      <div className="flex-1 px-5 pb-4 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold/70 print:text-gray-400">
          {label}
        </p>
        <div className="mt-3">{children}</div>
      </div>
      <div className="border-t border-line/60 px-5 py-2.5 print:border-gray-200">
        <a
          href={`#${anchor}`}
          className="text-[11.5px] font-medium text-gold/80 transition-colors hover:text-gold print:text-gray-600"
        >
          See full detail →
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Props {
  facts: ChartFacts;
  sections?: ReportSectionData[];
}

export function AtAGlanceSection({ facts, sections }: Props) {
  const mahadasha = facts.dasha.periods[facts.dasha.currentMahaIndex];
  const antardasha = facts.dasha.antardashas[facts.dasha.currentAntarIndex];

  const strongest = findStrongest(facts);

  const yogaSection = sections?.find((s) => s.id === 'yogas');
  const topYoga =
    yogaSection &&
    yogaSection.status !== 'pending' &&
    yogaSection.items &&
    yogaSection.items.length > 0
      ? (yogaSection.items[0] ?? null)
      : null;

  const topLifeArea =
    ['career', 'marriage', 'health', 'finance']
      .map((id) => sections?.find((s) => s.id === id) ?? null)
      .filter((s): s is ReportSectionData => s !== null && s.status !== 'pending')
      .sort((a, b) => (b.evidence?.length ?? 0) - (a.evidence?.length ?? 0))[0] ?? null;

  const mahaTheme = mahadasha ? (PLANET_PERIOD_THEME[mahadasha.lord] ?? '') : '';
  const lifeAreaSnippet = topLifeArea?.summary ?? topLifeArea?.items?.[0]?.body;

  return (
    <section className="mb-6 scroll-mt-24">
      {/* Header */}
      <div className="mb-4 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold/70 print:text-gray-400">
          At a Glance
        </p>
        <h2 className="mt-0.5 text-[22px] font-bold leading-tight tracking-tight print:text-gray-900">
          Your Chart Summary
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted print:text-gray-500">
          The four most important signals from your birth chart.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* ── Card 1: Current Life Chapter ── */}
        {mahadasha && (
          <GlanceCard label="Your Current Chapter" anchor="dasha">
            <p className="text-[20px] font-bold leading-tight tracking-tight print:text-gray-900">
              You&apos;re in a {mahadasha.lord} period.
            </p>
            {mahaTheme && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
                A chapter shaped by {mahaTheme}.
              </p>
            )}
            {antardasha && (
              <p className="mt-1.5 text-[12.5px] text-ink-muted print:text-gray-400">
                {antardasha.lord}&apos;s sub-period is now active within it.
              </p>
            )}
            <p className="mt-2 text-[12px] text-ink-subtle print:text-gray-400">
              {fmtDate(mahadasha.startMs)} — {fmtDate(mahadasha.endMs)}
            </p>
            <TechnicalPanel>
              <p>
                {mahadasha.lord} Mahādaśā
                {antardasha ? ` / ${antardasha.lord} Antardaśā` : ''}
              </p>
              <p className="mt-1">Determined by the Vimshottari Dasha system</p>
            </TechnicalPanel>
          </GlanceCard>
        )}

        {/* ── Card 2: Strongest theme ── */}
        {strongest && (
          <GlanceCard label="Your Strongest Theme" anchor="planets">
            <p className="text-[18px] font-bold leading-snug tracking-tight print:text-gray-900">
              {PLANET_QUALITY[strongest.name]}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
              {strongest.name} is {DIGNITY_PLAIN[strongest.p.dignity] ?? 'well-placed'} in your
              chart — these qualities tend to come naturally.
            </p>
            <span
              className={`mt-3 inline-block rounded-[8px] px-2 py-px text-[10.5px] font-medium ${DIGNITY_CLS[strongest.p.dignity] ?? 'bg-ink-muted/15 text-ink-muted'}`}
            >
              {DIGNITY_LABEL[strongest.p.dignity] ?? strongest.p.dignity}
            </span>
            <TechnicalPanel>
              <p>
                {strongest.name} in {RASHI[strongest.p.sign] ?? '—'} · House{' '}
                {strongest.p.house}
                {strongest.p.sign === strongest.p.navamsaSign ? ' · Vargottama' : ''}
              </p>
              <p className="mt-1">
                Scored by dignity ({DIGNITY_LABEL[strongest.p.dignity] ?? '—'}) + house position +
                D9 agreement
              </p>
            </TechnicalPanel>
          </GlanceCard>
        )}

        {/* ── Card 3: Distinctive pattern (conditional) ── */}
        {topYoga && (
          <GlanceCard label="A Distinctive Pattern" anchor="yogas">
            <p className="text-[16px] font-bold leading-snug print:text-gray-900">
              {topYoga.body.length > 110
                ? topYoga.body.slice(0, 107) + '…'
                : topYoga.body}
            </p>
            <TechnicalPanel>
              <p>
                <span className="text-ink-subtle">Classical name: </span>
                {topYoga.title}
              </p>
              {topYoga.tags && topYoga.tags.length > 0 && (
                <p className="mt-1">
                  <span className="text-ink-subtle">Combination: </span>
                  {topYoga.tags.join(' · ')}
                </p>
              )}
            </TechnicalPanel>
          </GlanceCard>
        )}

        {/* ── Card 4: Main life theme (conditional) ── */}
        {topLifeArea && (
          <GlanceCard
            label="Where Your Chart Speaks Clearly"
            anchor={topLifeArea.id}
          >
            <p className="text-[20px] font-bold leading-tight print:text-gray-900">
              {LIFE_AREA_LABEL[topLifeArea.id] ?? topLifeArea.title}
            </p>
            {lifeAreaSnippet && (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
                {lifeAreaSnippet.length > 120
                  ? lifeAreaSnippet.slice(0, 117) + '…'
                  : lifeAreaSnippet}
              </p>
            )}
            <TechnicalPanel>
              <p>
                {topLifeArea.evidence?.length ?? 0} supporting rules from classical sources
              </p>
            </TechnicalPanel>
          </GlanceCard>
        )}
      </div>
    </section>
  );
}
