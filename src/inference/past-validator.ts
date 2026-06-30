/**
 * Past validator — generates observations for elapsed dasha periods.
 *
 * Purpose: Help the user cross-check whether the horoscope is accurate by
 * listing what classical texts say about each dasha lord's period, anchored
 * to actual past calendar dates.
 *
 * This is NOT prediction. Every observation links directly to a matched rule
 * and its verbatim source text. No interpretation is added.
 */
import type { ChartFacts } from '@/types/chart';
import type { MatchedRule, PastObservation } from './types';

function msToYear(ms: number): number {
  return new Date(ms).getFullYear();
}

export function buildPastValidation(
  facts: ChartFacts,
  allMatches: MatchedRule[],
): PastObservation[] {
  const { periods, currentMahaIndex } = facts.dasha;
  const now = Date.now();
  const observations: PastObservation[] = [];

  // Include all periods up to and including the current one
  const upTo = Math.min(periods.length - 1, currentMahaIndex);

  for (let i = 0; i <= upTo; i++) {
    const period = periods[i];
    if (!period) continue;

    const isPast = period.endMs < now;
    const isCurrent = i === currentMahaIndex;

    // Find rules mentioning this dasha lord
    const relevantMatches = allMatches.filter((m) =>
      m.categories.includes('dasha') &&
      m.sourceText.toLowerCase().includes(period.lord.toLowerCase()),
    );

    // Collect domain tags from the relevant matches
    const domains = [...new Set(
      relevantMatches.flatMap((m) =>
        m.categories.filter((c) => ['career', 'marriage', 'health', 'finance'].includes(c)),
      ),
    )];

    const startYear = msToYear(period.startMs);
    const endYear = msToYear(period.endMs);

    const label = isCurrent
      ? `${period.lord} Mahadasha (${startYear}–present, ends ${endYear})`
      : `${period.lord} Mahadasha (${startYear}–${endYear})`;

    observations.push({
      periodLabel: label,
      dashLord: period.lord,
      startYear,
      endYear,
      isPast,
      ruleIds: relevantMatches.map((m) => m.ruleId),
      domains,
    });
  }

  return observations;
}
