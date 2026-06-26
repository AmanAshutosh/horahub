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
    <div className="mb-2 overflow-hidden rounded-xl2 border border-line bg-panel-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2.5 px-3.5 py-3 text-left"
      >
        <span>
          <span className="block text-[14px] font-semibold">{title}</span>
          {subtitle && <span className="block text-[11.5px] text-ink-muted">{subtitle}</span>}
        </span>
        <span className={`text-ink-muted transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && <div className="px-3.5 pb-3.5 text-[13px] text-[#cfd0dd] animate-fade">{children}</div>}
    </div>
  );
}
