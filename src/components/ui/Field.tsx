import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-medium tracking-wide text-ink-muted">
        {label}
      </span>
      {hint && (
        <span className="mb-2 block text-[11px] text-ink-subtle">{hint}</span>
      )}
      {children}
    </label>
  );
}

export const inputClass = [
  'w-full rounded-xl border border-line bg-bg px-3.5 py-2.5',
  'text-[15px] text-ink placeholder:text-ink-subtle',
  'outline-none transition-colors duration-150',
  'focus:border-gold/40 focus:ring-2 focus:ring-gold/15',
  'hover:border-line/80',
  // Select-specific: no native arrow on some browsers
  'appearance-none',
].join(' ');
