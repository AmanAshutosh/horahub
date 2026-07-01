import type { ReportCitation } from '@/types/report';

export function CitationList({ citations }: { citations: ReportCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <div className="hh-citation-list">
      {citations.map((c, i) => (
        <div key={i} className="hh-citation-item">
          <p className="hh-citation-source">
            {c.work} · {c.ref}
            {c.tradition ? ` · ${c.tradition}` : ''}
          </p>
          <p className="hh-citation-text">{c.text}</p>
        </div>
      ))}
    </div>
  );
}
