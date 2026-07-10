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
    caption: 'How your chart was calculated',
    columns: ['Parameter', 'Value'],
    rows: [
      { cells: ['Ephemeris',           'Swiss Ephemeris (DE431) — high-precision planetary positions'] },
      { cells: ['Ayanamsa',            'Lahiri (Chitrapaksha) — the standard for Vedic calculations'] },
      { cells: ['Ayanamsa value',      facts.ayanamsa.toFixed(6) + '°'] },
      { cells: ['House system',        'Whole-Sign — each of the 12 houses spans exactly one zodiac sign'] },
      { cells: ['Dasha system',        'Vimshottari — a 120-year cycle starting from the Moon\'s Nakshatra'] },
      { cells: ['Ascendant precision', 'Approximate (±1° near sign boundaries — most accurate with exact birth time)'] },
    ],
  };

  const metaTable: ReportTable = {
    caption: 'Report details',
    columns: ['Field', 'Value'],
    rows: [
      { cells: ['Chart ID',              chartId] },
      { cells: ['Knowledge Base version', kbVersion] },
      { cells: ['Generated at',          generatedAt] },
      { cells: ['Books in the Knowledge Base', '7 (BPHS, Phaladeepika, Horasara, Light on Life, Learn Hindu Astrology Easily, How to Judge a Horoscope Vol. 1 & 2)'] },
      { cells: ['Total rules extracted', '17,050 rules across all seven books'] },
      { cells: ['Structured rules',      '5,073 — these have verified conditions and are used for inference'] },
    ],
  };

  const sourcesTable: ReportTable = {
    caption: 'Classical texts used as the source of all findings in this report',
    columns: ['Code', 'Full Title', 'Translator', 'Structured rules'],
    rows: [
      { cells: ['BPHS',  'Brihat Parashara Hora Shastra',        'R. Santhanam',                              '47'] },
      { cells: ['PHAL',  'Phaladeepika (Mantreswara)',           'V. Subrahmanya Sastri',                     '321'] },
      { cells: ['HORA',  'Horasara (Prithuyasas)',               'V. Subrahmanya Sastri',                     '410'] },
      { cells: ['LOL',   'Light on Life',                        'Robert Svoboda',                            '576'] },
      { cells: ['HAST',  'Learn Hindu Astrology Easily',         'K. N. Rao, K. Ashu Rao',                    '175'] },
      { cells: ['HJH1',  'How to Judge a Horoscope, Vol. 1',     'Bangalore Venkata Raman',                   '1,014'] },
      { cells: ['HJH2',  'How to Judge a Horoscope, Vol. 2',     'Bangalore Venkata Raman, Gayatri Devi Vasudev', '2,530'] },
    ],
  };

  return (
    <SectionShell
      id="appendix"
      num={num}
      title="Appendix — Technical Details"
      subtitle="Calculation method, data sources, and report metadata"
      breakBefore
    >
      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        This appendix shows exactly how your chart was calculated and which classical sources
        back the findings in this report. Every rule cited traces to a specific chapter and verse
        in one of the seven books listed below.
      </p>

      <div className="space-y-5">
        <DataTable table={calcTable} compact />
        <DataTable table={metaTable} compact />
        <DataTable table={sourcesTable} compact />
      </div>

      <p className="mt-5 text-[11.5px] leading-relaxed text-ink-muted print:text-gray-500">
        <strong className="font-medium text-ink-muted print:text-gray-700">Important note:</strong>{' '}
        This report presents astronomical positions and rules extracted from classical Vedic texts.
        All findings are drawn verbatim from those texts — nothing is fabricated or paraphrased
        from general astrology knowledge.
        This is not a substitute for medical, legal, financial, or personal professional advice.
        The structured rule set covers 30% of the total extracted rules (5,073 of 17,050) — accuracy
        of individual rules has not been independently validated by a human expert.
      </p>
    </SectionShell>
  );
}
