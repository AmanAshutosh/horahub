import type { ReactNode } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[11px] border border-line bg-bg-soft px-3 py-2.5 text-[15px] text-ink outline-none focus:border-accent';
