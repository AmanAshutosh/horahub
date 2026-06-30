import type { ChartFacts } from '@/types/chart';
import type { ReadingSection } from '@/types/reading';
import { RASHI } from '@/constants/astro';
import { SectionShell } from '../primitives/SectionShell';
import { DataTable } from '../primitives/DataTable';
import { Accordion } from '@/components/ui/Accordion';
import { Cite } from '@/components/ui/Cite';
import type { ReportTable } from '@/types/report';

const HOUSE_NAMES: Record<number, string> = {
  1: 'Tanu (Self)', 2: 'Dhana (Wealth)', 3: 'Sahaja (Siblings)',
  4: 'Sukha (Home)', 5: 'Putra (Children)', 6: 'Ari (Enemies)',
  7: 'Kalatra (Partner)', 8: 'Mrityu (Longevity)', 9: 'Dharma (Fortune)',
  10: 'Karma (Career)', 11: 'Labha (Gains)', 12: 'Vyaya (Loss)',
};

interface Props {
  facts: ChartFacts;
  housesSection?: ReadingSection;
  num: number;
}

export function HouseAnalysisSection({ facts, housesSection, num }: Props) {
  const rows = facts.houses.map((h) => {
    const lordHouse = facts.planets[h.lord].house;
    return {
      cells: [
        `H${h.house} · ${HOUSE_NAMES[h.house] ?? ''}`,
        RASHI[h.sign] ?? '—',
        h.lord,
        `H${lordHouse}`,
        h.occupants.length > 0 ? h.occupants.join(', ') : '—',
      ] as (string | number | null)[],
    };
  });

  const table: ReportTable = {
    caption: 'House cusps, lords and occupants computed from the birth chart.',
    columns: ['House', 'Sign', 'Lord', "Lord's House", 'Occupants'],
    rows,
  };

  return (
    <SectionShell
      id="houses"
      num={num}
      title="House Analysis"
      subtitle="Bhāva structure and lordship — source-backed notes where available"
    >
      <DataTable table={table} compact />

      {housesSection && (
        <div className="mt-5">
          <p className="mb-2 text-[11.5px] text-ink-muted print:text-gray-500">
            Source-backed notes for each Bhāva:
          </p>
          {housesSection.items.map((item) => (
            <Accordion key={item.title} title={item.title} subtitle={item.tags?.join(' · ')}>
              <p>{item.body}</p>
              {item.citation && <Cite citation={item.citation} />}
            </Accordion>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
