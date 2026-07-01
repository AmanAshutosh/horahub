'use client';
import { useState, type ReactNode } from 'react';

export function Accordion({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="hh-accordion">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="hh-accordion-trigger"
      >
        <span>
          <span className="hh-accordion-title">{title}</span>
          {subtitle && <span className="hh-accordion-subtitle">{subtitle}</span>}
        </span>
        <span className="hh-accordion-icon" data-open={open}>›</span>
      </button>
      {open && (
        <div className="hh-accordion-body">{children}</div>
      )}
    </div>
  );
}
