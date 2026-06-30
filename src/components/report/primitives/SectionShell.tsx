import type { ReactNode } from 'react';

interface Props {
  id: string;
  num: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Print: start this section on a new page. */
  breakBefore?: boolean;
}

export function SectionShell({ id, num, title, subtitle, children, breakBefore }: Props) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 ${breakBefore ? 'print:break-before-page' : ''}`}
    >
      <div className="mb-4 mt-10 border-b border-line pb-3 print:border-gray-300">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-muted print:text-gray-400">
            {String(num).padStart(2, '0')}
          </span>
          <span className="h-px flex-1 bg-line print:bg-gray-300" />
        </div>
        <h2 className="text-[20px] font-bold leading-tight text-gold print:text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[12px] text-ink-muted print:text-gray-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
