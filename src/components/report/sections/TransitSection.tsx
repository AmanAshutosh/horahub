import type { ReportSectionData } from '@/types/report';
import { SectionShell } from '../primitives/SectionShell';
import { PendingState } from '../primitives/PendingState';
import { DataTable } from '../primitives/DataTable';
import { CitationList } from '../primitives/CitationList';

const WILL_CONTAIN = [
  'Current planetary positions overlaid on natal chart',
  'Key transit triggers (Saturn, Jupiter, Rahu/Ketu over natal planets)',
  'Transit over Lagna lord and Moon sign',
  'Ashtakavarga transit strength (if computed)',
  'Source citations from BPHS transit chapters',
];

interface Props {
  data?: ReportSectionData | null;
  num: number;
}

export function TransitSection({ data, num }: Props) {
  const isPending = !data || data.status === 'pending';

  return (
    <SectionShell
      id="transit"
      num={num}
      title="Transit Timeline"
      subtitle="Current planetary transits over the natal chart"
    >
      {isPending ? (
        <PendingState willContain={WILL_CONTAIN} />
      ) : (
        <>
          {data.summary && (
            <p className="mb-4 text-[13.5px] leading-relaxed text-[#cfd0dd] print:text-gray-700">
              {data.summary}
            </p>
          )}
          {data.tables?.map((t, i) => <DataTable key={i} table={t} />)}
          {data.citations && <CitationList citations={data.citations} />}
        </>
      )}
    </SectionShell>
  );
}
