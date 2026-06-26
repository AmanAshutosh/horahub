import { RASHI } from '@/constants/astro';

export const signName = (i: number): string => RASHI[i] ?? '—';

export function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const ordinal = (n: number): string => `${n}`;
