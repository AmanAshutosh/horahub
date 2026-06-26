'use client';
import { useEffect, useState } from 'react';

const SECTIONS = [
  ['sum', 'Birth'],
  ['planets', 'Planets'],
  ['charts', 'Charts'],
  ['houses', 'Houses'],
  ['dasha', 'Daśā'],
  ['effects', 'Effects'],
] as const;

export function ReportNav() {
  const [active, setActive] = useState<string>('sum');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-0 z-20 -mx-4 mb-3 border-b border-line bg-bg/85 px-4 py-2.5 backdrop-blur">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
            className={`flex-none rounded-full border px-3 py-1.5 text-[12.5px] ${
              active === id ? 'border-gold text-gold' : 'border-line text-ink-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
