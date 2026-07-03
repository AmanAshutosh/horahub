import type { ReportEvidence } from '@/types/report';

function SourceQualityDot({ v }: { v: number }) {
  const color = v >= 0.8 ? 'bg-good' : v >= 0.5 ? 'bg-warn' : 'bg-danger';
  const label = v >= 0.8 ? 'High' : v >= 0.5 ? 'Medium' : 'Low';
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-muted">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />
      Source quality: {label}
    </span>
  );
}

export function EvidenceList({ evidence }: { evidence: ReportEvidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
        Supporting rules ({evidence.length})
      </p>
      {evidence.map((e) => (
        <div
          key={e.ruleId}
          className="rounded-lg border border-line/60 bg-bg/40 p-3 text-[12px] print:border-gray-200 print:bg-white"
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <code className="rounded bg-panel-soft px-1.5 py-px text-[10px] text-accent print:bg-gray-100 print:text-blue-700">
              {e.ruleId}
            </code>
            <span className="text-[11px] font-medium text-ink-muted">
              {e.book}
              {e.chapter && ` · Ch.${e.chapter}`}
              {e.verse && ` v.${e.verse}`}
            </span>
            <SourceQualityDot v={e.extractionConfidence} />
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink-muted print:text-gray-700">{e.text}</p>
          {e.categories.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {e.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-line px-1.5 py-px text-[10px] text-ink-muted"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
