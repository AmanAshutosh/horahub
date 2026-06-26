'use client';
import Link from 'next/link';
import type { GenerateChartResponse } from '@/types/api';
import { ReportNav } from './ReportNav';
import { SummaryHeader } from './SummaryHeader';
import { PlanetGrid } from './PlanetGrid';
import { SouthChart } from './SouthChart';
import { SectionAccordions } from './SectionAccordions';
import { DashaTimeline } from './DashaTimeline';

export function ReportView({ data }: { data: GenerateChartResponse }) {
  const { facts, reading } = data;
  const planetsSection = reading.find((s) => s.id === 'planets');
  const housesSection = reading.find((s) => s.id === 'houses');
  const effectsSection = reading.find((s) => s.id === 'effects');

  return (
    <main className="mx-auto max-w-[760px] px-4 pb-24 pt-4">
      <ReportNav />

      <Link
        href="/"
        className="mb-2 inline-block rounded-[11px] border border-line bg-panel-soft px-3.5 py-2 text-[13px]"
      >
        ← New chart
      </Link>

      <SummaryHeader facts={facts} ayanLabel={data.resolved.utcOffset || undefined} />
      <PlanetGrid facts={facts} section={planetsSection} />

      <section id="charts" className="scroll-mt-24">
        <h2 className="mb-2.5 mt-5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-gold before:inline-block before:h-px before:w-3.5 before:bg-gold">
          Charts
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <SouthChart facts={facts} variant="rasi" label="Rāśi (D1) — As = Lagna" />
          <SouthChart facts={facts} variant="navamsa" label="Navāṁśa (D9)" />
        </div>
      </section>

      {housesSection && <SectionAccordions section={housesSection} />}
      <DashaTimeline facts={facts} />
      {effectsSection && <SectionAccordions section={effectsSection} openFirst />}

      <p className="mt-5 text-center text-[11.5px] text-ink-muted">
        HoraHub · positions by analytic ephemeris · interpretation cites classical sources · no
        fabricated confidence. Not a substitute for medical, legal or financial advice.
      </p>
    </main>
  );
}
