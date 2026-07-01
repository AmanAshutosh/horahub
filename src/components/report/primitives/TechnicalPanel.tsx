'use client';
import { useState, type ReactNode } from 'react';

/**
 * Collapsible panel for technical/astrological details.
 * Primary content stays in the parent; jargon lives here.
 * Print: always expanded via .tech-panel-print so printed reports stay complete.
 */
export function TechnicalPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tech-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tech-panel-trigger print:hidden"
      >
        <span className="tech-panel-icon" data-open={open}>▶</span>
        <span>{open ? 'Hide technical details' : 'Technical details'}</span>
      </button>

      {open && (
        <div className="tech-panel-body print:hidden">{children}</div>
      )}

      <div className="tech-panel-print">{children}</div>
    </div>
  );
}
