'use client';
import type { ReactNode } from 'react';
import type { ChartFacts, PlanetName, PlanetPlacement } from '@/types/chart';
import type { ReportSectionData } from '@/types/report';
import { RASHI } from '@/constants/astro';
import { fmtDate } from '@/interpret';
import { TechnicalPanel } from '../primitives/TechnicalPanel';

// ---------------------------------------------------------------------------
// Planet descriptions
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
// Scoring
// ---------------------------------------------------------------------------

const DIGNITY_SCORE: Record<string, number> = { exalted: 4, own: 3, neutral: 2, debilitated: 0 };
const DIGNITY_LABEL: Record<string, string> = {
  exalted: 'Exalted', own: 'Own sign', neutral: 'Neutral', debilitated: 'Debilitated',
};
const DIGNITY_CLS: Record<string, string> = {
  exalted:     'bg-good/20 text-good',
  own:         'bg-gold/20 text-gold',
  neutral:     'bg-ink-muted/15 text-ink-muted',
  debilitated: 'bg-danger/20 text-danger',
};
const HOUSE_BONUS: Record<number, number> = {
  1: 4, 5: 3, 9: 3, 4: 2, 7: 2, 10: 2, 3: 1, 11: 1, 2: 0, 6: -1, 8: -1, 12: -1,
};
const SCORED_PLANETS: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn',
];

function planetScore(p: PlanetPlacement): number {
  return (DIGNITY_SCORE[p.dignity] ?? 2) + (HOUSE_BONUS[p.house] ?? 0) + (p.sign === p.navamsaSign ? 1 : 0);
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
// Card
// ---------------------------------------------------------------------------

function GlanceCard({ label, anchor, children }: { label: string; anchor: string; children: ReactNode }) {
  return (
    <div className="glance-card">
      <div className="glance-card-body">
        <p className="glance-card-label">{label}</p>
        {children}
      </div>
      <div className="glance-card-footer">
        <a href={`#${anchor}`} className="glance-card-link">See full detail →</a>
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
    yogaSection?.status !== 'pending' && yogaSection?.items && yogaSection.items.length > 0
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
    <section className="glance-section">
      <div className="px-1">
        <p className="glance-eyebrow">At a Glance</p>
        <h2 className="glance-title">Your Chart Summary</h2>
        <p className="glance-desc">The four most important signals from your birth chart.</p>
      </div>

      <div className="glance-grid">

        {/* ── Card 1: Current Life Chapter ── */}
        {mahadasha && (
          <GlanceCard label="Your Current Chapter" anchor="dasha">
            <p className="glance-card-heading">
              You&apos;re in a {mahadasha.lord} period.
            </p>
            {mahaTheme && (
              <p className="glance-card-text">A chapter shaped by {mahaTheme}.</p>
            )}
            {antardasha && (
              <p className="glance-card-small">
                {antardasha.lord}&apos;s sub-period is now active within it.
              </p>
            )}
            <p className="glance-card-meta">
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
            <p className="glance-card-heading">{PLANET_QUALITY[strongest.name]}</p>
            <p className="glance-card-text">
              {strongest.name} is {DIGNITY_PLAIN[strongest.p.dignity] ?? 'well-placed'} in your
              chart — these qualities tend to come naturally.
            </p>
            <span
              className={`glance-card-badge ${DIGNITY_CLS[strongest.p.dignity] ?? 'bg-ink-muted/15 text-ink-muted'}`}
            >
              {DIGNITY_LABEL[strongest.p.dignity] ?? strongest.p.dignity}
            </span>
            <TechnicalPanel>
              <p>
                {strongest.name} in {RASHI[strongest.p.sign] ?? '—'} · House {strongest.p.house}
                {strongest.p.sign === strongest.p.navamsaSign ? ' · Vargottama' : ''}
              </p>
              <p className="mt-1">
                Scored by dignity ({DIGNITY_LABEL[strongest.p.dignity] ?? '—'}) + house position + D9 agreement
              </p>
            </TechnicalPanel>
          </GlanceCard>
        )}

        {/* ── Card 3: Distinctive pattern ── */}
        {topYoga && (
          <GlanceCard label="A Distinctive Pattern" anchor="yogas">
            <p className="glance-card-heading">
              {topYoga.body.length > 110 ? topYoga.body.slice(0, 107) + '…' : topYoga.body}
            </p>
            <TechnicalPanel>
              <p><span style={{ color: 'var(--color-ink-subtle)' }}>Classical name: </span>{topYoga.title}</p>
              {topYoga.tags && topYoga.tags.length > 0 && (
                <p className="mt-1">
                  <span style={{ color: 'var(--color-ink-subtle)' }}>Combination: </span>
                  {topYoga.tags.join(' · ')}
                </p>
              )}
            </TechnicalPanel>
          </GlanceCard>
        )}

        {/* ── Card 4: Main life theme ── */}
        {topLifeArea && (
          <GlanceCard label="Where Your Chart Speaks Clearly" anchor={topLifeArea.id}>
            <p className="glance-card-heading">
              {LIFE_AREA_LABEL[topLifeArea.id] ?? topLifeArea.title}
            </p>
            {lifeAreaSnippet && (
              <p className="glance-card-text">
                {lifeAreaSnippet.length > 120
                  ? lifeAreaSnippet.slice(0, 117) + '…'
                  : lifeAreaSnippet}
              </p>
            )}
            <TechnicalPanel>
              <p>{topLifeArea.evidence?.length ?? 0} supporting rules from classical sources</p>
            </TechnicalPanel>
          </GlanceCard>
        )}
      </div>
    </section>
  );
}
