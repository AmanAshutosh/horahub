import type { ChartFacts } from '@/types/chart';
import { SectionShell } from '../primitives/SectionShell';
import { DataTable } from '../primitives/DataTable';
import type { ReportTable } from '@/types/report';

interface Props {
  facts: ChartFacts;
  chartId: string;
  kbVersion: string;
  generatedAt: string;
  num: number;
}

export function AppendixSection({ facts, chartId, kbVersion, generatedAt, num }: Props) {
  const calcTable: ReportTable = {
    caption: 'Calculation parameters',
    columns: ['Parameter', 'Value'],
    rows: [
      { cells: ['Ephemeris', 'Swiss Ephemeris (DE431)'] },
      { cells: ['Ayanamsa', 'Lahiri (Chitrapaksha)'] },
      { cells: ['Ayanamsa value', facts.ayanamsa.toFixed(6) + '°'] },
      { cells: ['House system', 'Whole-Sign (each sign = one house)'] },
      { cells: ['Dasha system', 'Vimśottari (120-year cycle)'] },
      { cells: ['Ascendant precision', 'Approximate (±1° near sign boundaries)'] },
    ],
  };

  const metaTable: ReportTable = {
    caption: 'Report metadata',
    columns: ['Field', 'Value'],
    rows: [
      { cells: ['Chart ID', chartId] },
      { cells: ['Knowledge Base version', kbVersion] },
      { cells: ['Generated at', generatedAt] },
      { cells: ['Structured rules in KB', '1,352 (draft status, pending validation)'] },
      { cells: ['Books indexed', '4 (BPHS, Phaladeepika, Horasara, Light on Life)'] },
      { cells: ['Interpretation status', 'Pending Inference Engine connection'] },
    ],
  };

  const sourcesTable: ReportTable = {
    caption: 'Classical texts in the Knowledge Base',
    columns: ['Code', 'Title', 'Translator', 'Rules extracted'],
    rows: [
      { cells: ['BPHS', 'Brihat Parashara Hora Shastra', 'R. Santhanam', '47 structured'] },
      { cells: ['PHAL', 'Phaladeepika (Mantreswara)', 'V. Subrahmanya Sastri', '321 structured'] },
      { cells: ['HORA', 'Horasara (Prithuyasas)', 'V. Subrahmanya Sastri', '410 structured'] },
      { cells: ['LOL', 'Light on Life', 'Robert Svoboda', '574 structured'] },
    ],
  };

  return (
    <SectionShell
      id="appendix"
      num={num}
      title="Appendix — Technical Details"
      subtitle="Calculation method, data sources and report metadata"
      breakBefore
    >
      <div className="space-y-5">
        <DataTable table={calcTable} compact />
        <DataTable table={metaTable} compact />
        <DataTable table={sourcesTable} compact />
      </div>
      <p className="mt-5 text-[11.5px] leading-relaxed text-ink-muted print:text-gray-500">
        Disclaimer: This report presents astronomical data and extracted classical rules without
        interpretation or life predictions. It is not a substitute for medical, legal, financial or
        personal advice. Structured rule coverage is 16.1% (1,352 / 8,384 rules) — accuracy of
        extracted rules has not been validated by a human expert. Interpretation sections are marked
        &ldquo;Pending Knowledge Engine&rdquo; until the Inference Engine is approved and connected.
      </p>
    </SectionShell>
  );
}
