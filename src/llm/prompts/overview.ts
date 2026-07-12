import type { ReportBrief } from '@/narrative';
import { formatObservations, formatPeriod } from './format';

/**
 * Builds the "Overall Life Direction" opening section — the report's
 * front-of-book summary, written after (in the call plan, not necessarily
 * in wall-clock order) the domain/dasha sections, but read first.
 */
export function buildOverviewPrompt(brief: ReportBrief): string | null {
  if (brief.overallDirection.length === 0) return null;

  const currentMaha = brief.mahadashas.find((m) => m.isCurrent);
  const currentAntar = currentMaha?.antardashas.find((a) => a.isCurrent);

  return `Write the opening "Overall Life Direction" section of a personal astrology report — the first thing the reader sees, setting the tone for everything that follows. Use ONLY the structured data below.

Current period: ${currentMaha ? formatPeriod(currentMaha) : 'unknown'}${currentAntar ? `, within a ${formatPeriod(currentAntar)} sub-period` : ''}.

Cross-domain observations (the most significant signals across the whole chart, already merged and prioritized):
${formatObservations(brief.overallDirection)}

WHAT TO WRITE
Two or three warm, clear paragraphs that give the reader a sense of where their life is headed right now and why — the "big picture" before the report goes into specific life areas. Do not repeat information verbatim from the observations list; synthesize it into a coherent narrative arc. Do not list every domain — pick the two or three most significant threads and weave them together. End on a grounded, encouraging note without being generic or falsely positive if the data leans cautionary.`;
}
