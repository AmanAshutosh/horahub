import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="hh-field">
      <span className="hh-field-label">{label}</span>
      {hint && <span className="hh-field-hint">{hint}</span>}
      {children}
    </label>
  );
}

export const inputClass = 'hh-input';
