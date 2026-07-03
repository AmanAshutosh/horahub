import type { ReportSectionData } from '@/types/report';
import { SectionShell } from '../primitives/SectionShell';
import { PendingState } from '../primitives/PendingState';
import { Accordion } from '@/components/ui/Accordion';
import { CitationList } from '../primitives/CitationList';
import { EvidenceList } from '../primitives/EvidenceList';
import { TechnicalPanel } from '../primitives/TechnicalPanel';

const WILL_CONTAIN = [
  'Rare planetary patterns found in your chart, linked to specific life qualities',
  'What each pattern is classically associated with — in plain English',
  'How strongly each pattern shows in your specific chart',
  'Classical source references (BPHS, Phaladeepika, Horasara)',
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
      title="What Makes Your Chart Distinctive"
      subtitle="Rare patterns recognized across classical Vedic texts"
    >
      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        Over centuries, Vedic astrologers identified specific planetary arrangements that tend to
        appear in the charts of people who share certain qualities — unusual wisdom, natural
        leadership, a talent for wealth, or deep spiritual insight. When these patterns appear in
        your chart, they&apos;re worth noting.
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
            <div key={i} className="mt-4">
              {/* Table headers are technical — shown as-is from inference engine */}
              <div className="mb-1 text-[11px] text-ink-muted print:text-gray-400">
                Patterns found in your chart:
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="text-[10.5px] uppercase tracking-wide text-ink-muted">
                      {t.columns.map((col) => (
                        <th key={col} className="border-b border-line py-1.5 text-left pr-4">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, ri) => (
                      <tr key={ri} className={row.variant === 'positive' ? 'text-good' : ''}>
                        {row.cells.map((cell, ci) => (
                          <td
                            key={ci}
                            className="border-b border-line py-1.5 pr-4 print:border-gray-200"
                          >
                            {cell ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {data.items && data.items.length > 0 && (
            <div className="mt-4">
              {data.items.map((item) => (
                <Accordion key={item.title} title={item.title}>
                  <p className="text-[13px] leading-relaxed">{item.body}</p>
                  <TechnicalPanel>
                    {item.tags && item.tags.length > 0 && (
                      <p className="mb-1">
                        <span className="text-ink-subtle">Combination: </span>
                        {item.tags.join(' · ')}
                      </p>
                    )}
                    {item.citations && <CitationList citations={item.citations} />}
                    {item.evidence && <EvidenceList evidence={item.evidence} />}
                  </TechnicalPanel>
                </Accordion>
              ))}
            </div>
          )}

          {data.citations && !data.items?.length && (
            <div className="mt-4">
              <CitationList citations={data.citations} />
            </div>
          )}

          {data.evidence && !data.items?.length && (
            <div className="mt-4">
              <EvidenceList evidence={data.evidence} />
            </div>
          )}

          {data.note && (
            <p className="mt-3 text-[11.5px] text-ink-muted print:text-gray-500">{data.note}</p>
          )}
        </>
      )}
    </SectionShell>
  );
}
