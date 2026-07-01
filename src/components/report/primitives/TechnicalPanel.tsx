'use client';
import { useState, type ReactNode } from 'react';

/**
 * Collapsible panel for technical/astrological details.
 * Primary content stays in the parent; jargon lives here.
 * Print: always expanded so printed reports remain complete.
 */
export function TechnicalPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      {/* Interactive trigger — screen only */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-ink-subtle transition-colors hover:text-ink-muted print:hidden"
      >
        <span
          className={`inline-block text-[8px] transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          ▶
        </span>
        <span className="uppercase tracking-[0.12em]">
          {open ? 'Hide technical details' : 'Technical details'}
        </span>
      </button>

      {/* Screen: conditionally shown */}
      {open && (
        <div className="mt-2 rounded-xl border border-line/60 bg-bg/60 px-4 py-3 text-[11.5px] leading-relaxed text-ink-muted animate-fade print:hidden">
          {children}
        </div>
      )}

      {/* Print: always shown, no toggle */}
      <div className="hidden border-t border-gray-200 pt-1.5 text-[10pt] leading-relaxed text-gray-400 print:block print:mt-2">
        {children}
      </div>
    </div>
  );
}
