'use client';
import Link from 'next/link';
import type { GenerateChartResponse } from '@/types/api';
import type { PersonInfo, ReportSectionData } from '@/types/report';
import { ReportNav } from './ReportNav';
import { PlanetGrid } from './PlanetGrid';
import { DashaTimeline } from './DashaTimeline';
import { DashaCallout } from './DashaCallout';
import { SectionShell } from './primitives/SectionShell';
import { SouthChart, SouthChartLegend } from './SouthChart';
import { SectionAccordions } from './SectionAccordions';
import { CoverSection } from './sections/CoverSection';
import { BirthDetailsSection } from './sections/BirthDetailsSection';
import { PlanetStrengthSection } from './sections/PlanetStrengthSection';
import { HouseAnalysisSection } from './sections/HouseAnalysisSection';
import { YogaSection } from './sections/YogaSection';
import { TransitSection } from './sections/TransitSection';
import { LifeAreaSection, LIFE_AREAS } from './sections/LifeAreaSection';
import { AppendixSection } from './sections/AppendixSection';
import { AtAGlanceSection } from './sections/AtAGlanceSection';
import { TechnicalReferenceSection } from './sections/TechnicalReferenceSection';

interface Props {
  data: GenerateChartResponse;
  person: PersonInfo | null;
}

export function ReportView({ data, person }: Props) {
  const { facts, reading, kbVersion, resolved } = data;

  const planetsSection = reading.find((s) => s.id === 'planets');
  const housesSection  = reading.find((s) => s.id === 'houses');
  const effectsSection = reading.find((s) => s.id === 'effects');

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const findSection = (id: string): ReportSectionData | null =>
    data.sections?.find((s) => s.id === id) ?? null;

  const lifeAreaData: Record<string, ReportSectionData | null> = {
    career:       findSection('career'),
    finance:      findSection('finance'),
    marriage:     findSection('marriage'),
    love:         findSection('love'),
    health:       findSection('health'),
    education:    findSection('education'),
    family:       findSection('family'),
    mentalNature: findSection('mentalNature'),
    spirituality: findSection('spirituality'),
    remedies:     findSection('remedies'),
  };

  const yogaData = findSection('yogas');

  // Life area configs split: main (career→finance) vs remedies (shown late)
  const MAIN_AREAS   = LIFE_AREAS.filter((a) => a.id !== 'remedies');
  const REMEDIES     = LIFE_AREAS.find((a) => a.id === 'remedies')!;

  return (
    <div className="mx-auto max-w-[800px] px-4 pb-24 pt-3 print:max-w-none print:px-8 print:pb-4 print:pt-0">
      <ReportNav />

      <Link href="/" className="report-back-link print:hidden">
        ← New chart
      </Link>

      {/* ── Cover ── */}
      <CoverSection
        facts={facts}
        person={person}
        chartId={data.chartId}
        kbVersion={kbVersion}
        generatedAt={generatedAt}
      />

      {/* ── At a Glance ── */}
      <AtAGlanceSection facts={facts} sections={data.sections} />

      {/* ── Current Life Chapter (Dasha callout — human-first, no section number) ── */}
      <div className="mb-10">
        <DashaCallout facts={facts} />
      </div>

      {/* ── §01–09 Life Areas (career, finance, marriage, love, health, education, family, mental nature, spirituality) ── */}
      {MAIN_AREAS.map((area) => (
        <LifeAreaSection
          key={area.id}
          config={area}
          data={lifeAreaData[area.id]}
        />
      ))}

      {/* ── §10 What Makes Your Chart Distinctive (Yogas) ── */}
      <YogaSection num={10} data={yogaData} />

      {/* ── §11 Your Birth Chart ── */}
      <SectionShell
        id="charts"
        num={11}
        title="Your Birth Chart"
        subtitle="The foundational map — everything in this report is derived from this chart"
      >
        <p className="mb-4 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
          You don&apos;t need to know how to read this chart. The sections in this report translate
          it into plain language. This is here as the source document — and for those who want to
          explore the positions directly.
        </p>
        <p className="mb-4 text-[12px] text-ink-subtle print:text-gray-400">
          The main chart (left) shows where every planet was at the moment of your birth. The
          relationship chart (right) is a refined view used for deeper analysis of partnerships
          and inner character.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SouthChart facts={facts} variant="rasi"    label="Main Birth Chart" />
          <SouthChart facts={facts} variant="navamsa" label="Relationship &amp; Inner Character Chart" />
        </div>
        <SouthChartLegend />
      </SectionShell>

      {/* ── §12 Your Planets ── */}
      <SectionShell
        id="planets"
        num={12}
        title="Your Planets"
        subtitle="What each planet's placement says about a different dimension of who you are"
      >
        <PlanetGrid facts={facts} section={planetsSection} />
      </SectionShell>

      {/* ── §13 Your Planetary Strengths ── */}
      <PlanetStrengthSection facts={facts} num={13} />

      {/* ── §14 Your Life Areas — In Detail (House Analysis) ── */}
      <HouseAnalysisSection housesSection={housesSection} num={14} />

      {/* ── §15 Your Life Timeline (full Dasha) ── */}
      <SectionShell
        id="dasha"
        num={15}
        title="Your Life Timeline"
        subtitle="The full sequence of planetary periods across your life"
      >
        <DashaTimeline facts={facts} />
        {effectsSection && (
          <div className="mt-4">
            <SectionAccordions section={effectsSection} />
          </div>
        )}
      </SectionShell>

      {/* ── §16 The Sky Right Now (Transits) ── */}
      <TransitSection num={16} data={findSection('transit')} />

      {/* ── §17 Classical Remedies ── */}
      <LifeAreaSection config={REMEDIES} data={lifeAreaData['remedies']} />

      {/* ── §18 Your Chart — Verified (Birth Details) ── */}
      <BirthDetailsSection
        facts={facts}
        person={person}
        utcOffset={resolved.utcOffset}
        coordinates={resolved.coordinates}
        num={18}
      />

      {/* ── §19 Technical Reference ── */}
      <TechnicalReferenceSection
        facts={facts}
        person={person}
        utcOffset={resolved.utcOffset}
        coordinates={resolved.coordinates}
        num={19}
      />

      {/* ── §20 Appendix ── */}
      <AppendixSection
        facts={facts}
        chartId={data.chartId}
        kbVersion={kbVersion}
        generatedAt={generatedAt}
        num={20}
      />

      <p className="report-footer">
        HoraHub · Vedic Astrology · positions by Swiss Ephemeris · all findings drawn from
        the classical texts in this report&apos;s Knowledge Base · nothing invented.
      </p>
    </div>
  );
}
