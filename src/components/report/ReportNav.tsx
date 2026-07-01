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
    <nav className="report-nav print:hidden">
      <div className="report-nav-list">
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
            className="report-nav-chip"
            data-active={active === id}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
