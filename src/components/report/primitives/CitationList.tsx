import type { ReportCitation } from '@/types/report';

export function CitationList({ citations }: { citations: ReportCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {citations.map((c, i) => (
        <div
          key={i}
          className="rounded-lg border border-[#25303f] border-l-[3px] border-l-accent bg-[#10131a] px-3 py-2 text-[12px] print:border-gray-300 print:border-l-blue-600 print:bg-white"
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-accent print:text-blue-700">
            {c.work} · {c.ref}
            {c.tradition && ` · ${c.tradition}`}
          </div>
          <div className="mt-0.5 italic text-[#c4ccda] print:text-gray-700">{c.text}</div>
        </div>
      ))}
    </div>
  );
}
