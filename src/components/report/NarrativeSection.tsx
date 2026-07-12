'use client';
import type { NarrativeReportResponse } from '@/types/api';

interface Props {
  status: 'idle' | 'generating' | 'failed' | 'complete';
  narrative: NarrativeReportResponse | null;
  onGenerate: () => void;
}

function Paragraphs({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="narrative-paragraph">{p}</p>
      ))}
    </>
  );
}

export function NarrativeSection({ status, narrative, onGenerate }: Props) {
  if (status === 'idle') {
    return (
      <div className="narrative-section narrative-cta print:hidden">
        <p className="narrative-label">Your Personalized Reading</p>
        <p className="narrative-cta-heading">See your life story, written in plain English.</p>
        <p className="narrative-cta-body">
          Everything above is the raw astrological data. This turns it into a warm, personal
          reading — what&apos;s happening in your life right now, why, and what to do about it.
        </p>
        <button type="button" className="narrative-cta-button" onClick={onGenerate}>
          Generate my personalized report
        </button>
      </div>
    );
  }

  if (status === 'generating') {
    return (
      <div className="narrative-section narrative-loading print:hidden">
        <p className="narrative-label">Your Personalized Reading</p>
        <p className="narrative-cta-heading">Writing your report…</p>
        <p className="narrative-cta-body">
          This takes a minute or two — we&apos;re turning your chart into a reading covering
          your career, relationships, health, and more.
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="narrative-section narrative-loading print:hidden">
        <p className="narrative-label">Your Personalized Reading</p>
        <p className="narrative-cta-heading">Something went wrong generating your report.</p>
        <button type="button" className="narrative-cta-button" onClick={onGenerate}>
          Try again
        </button>
      </div>
    );
  }

  if (!narrative) return null;
  const { sections } = narrative;
  const domainEntries = Object.entries(sections.lifeDomains);
  const currentMaha = sections.mahadashas.find((m) => m.isCurrent);
  const currentAntar = sections.antardashas.find((a) => a.isCurrent);

  return (
    <div className="narrative-section">
      <p className="narrative-label">Your Personalized Reading</p>

      {sections.overview && (
        <div className="narrative-overview">
          <Paragraphs text={sections.overview} />
        </div>
      )}

      {(currentMaha || currentAntar) && (
        <div className="narrative-block">
          <h3 className="narrative-block-title">Where You Are Right Now</h3>
          {currentMaha && <Paragraphs text={currentMaha.text} />}
          {currentAntar && <Paragraphs text={currentAntar.text} />}
        </div>
      )}

      {domainEntries.map(([domain, text]) => (
        <div key={domain} className="narrative-block">
          <h3 className="narrative-block-title">{domain}</h3>
          <Paragraphs text={text} />
        </div>
      ))}

      <p className="narrative-footnote">
        Written from your chart&apos;s deterministic astrological reasoning — nothing above was
        invented beyond what your placements, periods, and classical texts already indicate.
      </p>
    </div>
  );
}
