'use client';
import Link from 'next/link';
import type { GenerateChartResponse } from '@/types/api';
import type { PersonInfo, ReportSectionData } from '@/types/report';
import { ReportNav } from './ReportNav';
import { PlanetGrid } from './PlanetGrid';
import { DashaTimeline } from './DashaTimeline';
import { SectionShell } from './primitives/SectionShell';
import { SouthChart } from './SouthChart';
import { SectionAccordions } from './SectionAccordions';
import { CoverSection } from './sections/CoverSection';
import { BirthDetailsSection } from './sections/BirthDetailsSection';
import { PlanetStrengthSection } from './sections/PlanetStrengthSection';
import { HouseAnalysisSection } from './sections/HouseAnalysisSection';
import { DivisionalChartsSection } from './sections/DivisionalChartsSection';
import { YogaSection } from './sections/YogaSection';
import { TransitSection } from './sections/TransitSection';
import { LifeAreaSection, LIFE_AREAS } from './sections/LifeAreaSection';
import { AppendixSection } from './sections/AppendixSection';

interface Props {
  data: GenerateChartResponse;
  person: PersonInfo | null;
}

export function ReportView({ data, person }: Props) {
  const { facts, reading, kbVersion, resolved } = data;

  const planetsSection = reading.find((s) => s.id === 'planets');
  const housesSection = reading.find((s) => s.id === 'houses');
  const effectsSection = reading.find((s) => s.id === 'effects');

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // Life area sections: null until Inference Engine populates them.
  const lifeAreaData: Record<string, ReportSectionData | null> = {
    career: null, marriage: null, health: null, finance: null, remedies: null,
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 pb-24 pt-3 print:max-w-none print:px-8 print:pb-4 print:pt-0">
      <ReportNav />

      <Link
        href="/"
        className="mb-3 inline-block rounded-full border border-line bg-panel-soft px-3.5 py-1.5 text-[12.5px] text-ink-muted transition-colors hover:text-ink print:hidden"
      >
        ← New chart
      </Link>

      {/* Cover */}
      <CoverSection
        facts={facts}
        person={person}
        kbVersion={kbVersion}
        generatedAt={generatedAt}
      />

      {/* 01 — Birth Details */}
      <BirthDetailsSection
        facts={facts}
        person={person}
        utcOffset={resolved.utcOffset}
        coordinates={resolved.coordinates}
        num={1}
      />

      {/* 02 — Planetary Positions */}
      <SectionShell id="planets" num={2} title="Planetary Positions" subtitle="Tap any card to view source-backed notes">
        <PlanetGrid facts={facts} section={planetsSection} />
      </SectionShell>

      {/* 03 — Rashi & Navamsa Charts */}
      <SectionShell id="charts" num={3} title="Rāśi & Navāṁśa Charts" subtitle="D1 birth chart and D9 divisional chart">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SouthChart facts={facts} variant="rasi" label="Rāśi (D1) — Natal chart · As = Lagna" />
          <SouthChart facts={facts} variant="navamsa" label="Navāṁśa (D9) — Spouse and dharma" />
        </div>
      </SectionShell>

      {/* 04 — Divisional Charts */}
      <DivisionalChartsSection facts={facts} num={4} />

      {/* 05 — Planet Strength */}
      <PlanetStrengthSection facts={facts} num={5} />

      {/* 06 — House Analysis */}
      <HouseAnalysisSection facts={facts} housesSection={housesSection} num={6} />

      {/* 07 — Yoga Analysis */}
      <YogaSection num={7} />

      {/* 08 — Dasha Timeline */}
      <SectionShell id="dasha" num={8} title="Vimśottari Daśā Timeline" subtitle="120-year planetary period sequence">
        <DashaTimeline facts={facts} />
        {effectsSection && (
          <div className="mt-4">
            <SectionAccordions section={effectsSection} />
          </div>
        )}
      </SectionShell>

      {/* 09 — Transit Timeline */}
      <TransitSection num={9} />

      {/* 10–14 — Life Areas */}
      {LIFE_AREAS.map((area) => (
        <LifeAreaSection
          key={area.id}
          config={area}
          data={lifeAreaData[area.id]}
        />
      ))}

      {/* 15 — Appendix */}
      <AppendixSection
        facts={facts}
        chartId={data.chartId}
        kbVersion={kbVersion}
        generatedAt={generatedAt}
        num={16}
      />

      <p className="mt-8 border-t border-line pt-4 text-center text-[11px] text-ink-muted print:text-gray-400">
        HoraHub · Jyotiṣa Engine · positions by Swiss Ephemeris · classical rules from BPHS,
        Phaladeepika, Horasara, Light on Life · no fabricated predictions.
      </p>
    </div>
  );
}
