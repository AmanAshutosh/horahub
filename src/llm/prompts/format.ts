/**
 * Shared, auditable data-formatting helpers for prompt builders. These do
 * simple string templating over already-reasoned ReportBrief data — no
 * chart facts, no raw rule dumps, nothing beyond what's already in the
 * structured brief (per the Narrative Engine spec: the LLM only ever sees
 * fully-reasoned structured data, never ChartFacts).
 */
import type { MergedObservation } from '@/narrative';
import type { DashaPeriodBrief } from '@/narrative';
import type { RemedyCard } from '@/inference/types';

export function formatObservation(o: MergedObservation): string {
  const lines = [`- [${o.polarity}, ${o.strengthTier}] ${o.primaryClaim}`];
  for (const n of o.nuance) lines.push(`  (complication: ${n})`);
  for (const c of o.corroboration) lines.push(`  (also supported by: ${c})`);
  return lines.join('\n');
}

export function formatObservations(observations: MergedObservation[]): string {
  if (observations.length === 0) return '(no data available)';
  return observations.map(formatObservation).join('\n');
}

export function formatRemedy(r: RemedyCard): string {
  const fields = r.fields.map((f) => `${f.type}: ${f.raw}`).join('; ');
  return `- For ${r.responsiblePlanet ?? 'this influence'}: ${r.classicalExplanation} [${fields}]`;
}

export function formatRemedies(remedies: RemedyCard[]): string {
  if (remedies.length === 0) return '(no remedies in the data — do not invent any)';
  return remedies.map(formatRemedy).join('\n');
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function formatPeriod(p: Pick<DashaPeriodBrief, 'lord' | 'startMs' | 'endMs' | 'isCurrent' | 'isPast'>): string {
  const status = p.isCurrent ? 'CURRENT' : p.isPast ? 'past' : 'upcoming';
  return `${p.lord} (${formatDate(p.startMs)} to ${formatDate(p.endMs)}, ${status})`;
}

export function formatSourceTexts(sourceTexts: string[]): string {
  if (sourceTexts.length === 0) return '(no classical text data available for this period)';
  return sourceTexts.map((t) => `- "${t}"`).join('\n');
}
