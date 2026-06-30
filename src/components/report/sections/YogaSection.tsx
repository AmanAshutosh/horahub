import type { ReportSectionData } from '@/types/report';
import { SectionShell } from '../primitives/SectionShell';
import { PendingState } from '../primitives/PendingState';
import { DataTable } from '../primitives/DataTable';
import { CitationList } from '../primitives/CitationList';
import { EvidenceList } from '../primitives/EvidenceList';

const WILL_CONTAIN = [
  'List of detected classical yogas (e.g. Gajakesari, Raja, Dhana)',
  'Formation conditions: planets, houses, signs involved',
  'Source citations from BPHS, Phaladeepika, Horasara',
  'Strength qualifier: exact / approximate / traditional / partial',
  'Note on broken or cancelled yogas (yoga-bhanga)',
];

interface Props {
  data?: ReportSectionData | null;
  num: number;
}

export function YogaSection({ data, num }: Props) {
  const isPending = !data || data.status === 'pending';

  return (
    <SectionShell
      id="yogas"
      num={num}
      title="Yoga Analysis"
      subtitle="Classical planetary combinations detected in this chart"
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
          {data.evidence && <EvidenceList evidence={data.evidence} />}
          {data.note && (
            <p className="mt-3 text-[11.5px] text-ink-muted print:text-gray-500">{data.note}</p>
          )}
        </>
      )}
    </SectionShell>
  );
}
