import type { ReactNode } from 'react';

interface Props {
  id: string;
  num: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  breakBefore?: boolean;
}

export function SectionShell({ id, num, title, subtitle, children, breakBefore }: Props) {
  return (
    <section
      id={id}
      className={`report-section${breakBefore ? ' print:break-before-page' : ''}`}
    >
      <div className="report-section-header">
        <span className="report-section-num">{String(num).padStart(2, '0')}</span>
        <h2 className="report-section-title">{title}</h2>
        {subtitle && <p className="report-section-subtitle">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
