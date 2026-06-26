import type { Citation } from '@/types/reading';

export function Cite({ citation }: { citation: Citation }) {
  return (
    <div className="mt-2.5 rounded-lg border border-[#25303f] border-l-[3px] border-l-accent bg-[#10131a] px-3 py-2 text-[12px]">
      <div className="text-[10px] font-bold uppercase tracking-wide text-accent">
        📖 {citation.work} · {citation.ref}
      </div>
      <div className="mt-0.5 italic text-[#c4ccda]">{citation.text}</div>
    </div>
  );
}
