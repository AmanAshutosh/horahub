import type { Citation } from '@/types/reading';

export function Cite({ citation }: { citation: Citation }) {
  return (
    <div className="hh-cite">
      <p className="hh-cite-source">{citation.work} · {citation.ref}</p>
      <p className="hh-cite-text">{citation.text}</p>
    </div>
  );
}
