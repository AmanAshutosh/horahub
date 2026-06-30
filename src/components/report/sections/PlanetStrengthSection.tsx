import type { ChartFacts, PlanetName } from '@/types/chart';
import { RASHI, NAKSHATRA } from '@/constants/astro';
import { SectionShell } from '../primitives/SectionShell';
import { DataTable } from '../primitives/DataTable';
import type { ReportTable, ReportTableRow } from '@/types/report';

const ORDER: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

const HOUSE_TYPE: Record<number, string> = {
  1: 'Kendra · Trikona', 4: 'Kendra', 5: 'Trikona', 7: 'Kendra', 9: 'Trikona', 10: 'Kendra',
  3: 'Upachaya', 6: 'Dusthana · Upachaya', 8: 'Dusthana', 11: 'Upachaya', 12: 'Dusthana',
};

function houseType(h: number): string {
  return HOUSE_TYPE[h] ?? 'Panapara';
}

const DIGNITY_LABEL: Record<string, string> = {
  exalted: 'Exalted', debilitated: 'Debilitated', own: 'Own / Moolatrikona', neutral: 'Neutral',
};

const DIGNITY_ROW_VARIANT: Record<string, ReportTableRow['variant']> = {
  exalted: 'positive', debilitated: 'negative', own: 'positive', neutral: 'neutral',
};

interface Props {
  facts: ChartFacts;
  num: number;
}

export function PlanetStrengthSection({ facts, num }: Props) {
  const rows: ReportTableRow[] = ORDER.map((p) => {
    const d = facts.planets[p];
    const vargottama = d.sign === d.navamsaSign ? 'Yes' : 'No';
    return {
      cells: [
        p,
        RASHI[d.sign] ?? '—',
        `H${d.house}`,
        houseType(d.house),
        NAKSHATRA[d.nakshatra] ?? '—',
        `P${d.pada}`,
        RASHI[d.navamsaSign] ?? '—',
        vargottama,
        DIGNITY_LABEL[d.dignity] ?? d.dignity,
      ] as (string | number | null)[],
      variant: DIGNITY_ROW_VARIANT[d.dignity],
    };
  });

  const table: ReportTable = {
    caption: 'All values computed from Swiss Ephemeris — no interpretation applied.',
    columns: ['Planet', 'Sign', 'House', 'House Type', 'Nakshatra', 'Pada', 'Navamsa', 'Vargottama', 'Dignity'],
    rows,
  };

  return (
    <SectionShell
      id="strength"
      num={num}
      title="Planet Strength Overview"
      subtitle="Computed positional data for all nine Grahas — Shadbala scoring requires Inference Engine"
    >
      <DataTable table={table} />
      <p className="mt-3 text-[11.5px] text-ink-muted print:text-gray-500">
        Vargottama: planet occupies the same sign in both Rāśi (D1) and Navāṁśa (D9) — generally
        considered a positional strength in classical texts.
        Dignity labels: Exalted (Uchcha), Debilitated (Neecha), Own/Moolatrikona, Neutral.
        Shadbala numerical scoring will be added in the Inference Engine phase.
      </p>
    </SectionShell>
  );
}
