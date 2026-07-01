'use client';
import { useEffect, useState } from 'react';

const SECTIONS = [
  ['cover',    'Cover'],
  ['career',   'Career'],
  ['marriage', 'Relationships'],
  ['health',   'Health'],
  ['finance',  'Finance'],
  ['yogas',    'Patterns'],
  ['charts',   'Birth Chart'],
  ['planets',  'Planets'],
  ['houses',   'Life Areas'],
  ['dasha',    'Timeline'],
  ['transit',  'Today'],
  ['remedies', 'Remedies'],
  ['tech-ref', 'Reference'],
  ['appendix', 'Appendix'],
] as const;

export function ReportNav() {
  const [active, setActive] = useState<string>('cover');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-0 z-20 -mx-4 mb-3 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur print:hidden">
      <div className="no-scrollbar flex gap-1 overflow-x-auto">
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
            className={`flex-none rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
              active === id
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-line text-ink-muted hover:border-ink-muted/40 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
