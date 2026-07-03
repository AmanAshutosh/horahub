import type { ReportSectionData } from '@/types/report';
import { SectionShell } from '../primitives/SectionShell';
import { PendingState } from '../primitives/PendingState';
import { DataTable } from '../primitives/DataTable';
import { CitationList } from '../primitives/CitationList';

const WILL_CONTAIN = [
  'Which slow-moving planets (Saturn, Jupiter, Rahu/Ketu) are currently active in your chart',
  'How today\'s sky compares to your birth positions — and what this tends to bring',
  'The areas of life most likely to feel this energy right now',
  'Source references from classical Vedic transit chapters',
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
      title="The Sky Right Now"
      subtitle="How the planets moving overhead today interact with your birth chart"
    >
      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        The planets keep moving after you&apos;re born. When a slow-moving planet — Saturn,
        Jupiter, or the lunar nodes — passes over an important position in your birth chart,
        classical astrology associates this with particular themes becoming more active in your
        life. Think of it like weather: your birth chart is the terrain; these are the conditions
        passing through right now.
      </p>

      {isPending ? (
        <PendingState willContain={WILL_CONTAIN} />
      ) : (
        <>
          {data.summary && (
            <p className="mb-4 text-[13.5px] leading-relaxed text-ink-muted print:text-gray-700">
              {data.summary}
            </p>
          )}
          {data.tables?.map((t, i) => (
            <div key={i} className="mt-3">
              <DataTable table={t} />
            </div>
          ))}
          {data.citations && (
            <div className="mt-3">
              <CitationList citations={data.citations} />
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}
