/**
 * Timeline engine — maps dasha periods to relevant matched rules.
 *
 * For each dasha period (past, current, future) we identify which matched
 * rules mention that period's lord and tag the domains those rules address.
 * No interpretation or prediction is generated — only the association between
 * a dasha lord and the rules in the KB that concern it.
 */
import type { ChartFacts } from '@/types/chart';
import type { MatchedRule, TimelineEvent } from './types';

/** Number of dasha periods to include before/after current period. */
const PERIODS_BEFORE = 3;
const PERIODS_AFTER = 4;

export function buildTimeline(
  facts: ChartFacts,
  allMatches: MatchedRule[],
): TimelineEvent[] {
  const { periods, currentMahaIndex, antardashas, currentAntarIndex } = facts.dasha;
  const now = Date.now();

  const events: TimelineEvent[] = [];

  // ── Mahadasha periods ──────────────────────────────────────────────────────

  const start = Math.max(0, currentMahaIndex - PERIODS_BEFORE);
  const end = Math.min(periods.length - 1, currentMahaIndex + PERIODS_AFTER);

  for (let i = start; i <= end; i++) {
    const period = periods[i];
    if (!period) continue;

    const isCurrent = i === currentMahaIndex;
    const isPast = period.endMs < now;

    // Rules for this dasha lord
    const relevantMatches = allMatches.filter(
      (m) => m.categories.includes('dasha') && m.sourceText.toLowerCase().includes(period.lord.toLowerCase()),
    );

    const domains = [...new Set(
      relevantMatches.flatMap((m) => m.categories.filter((c) =>
        ['career', 'marriage', 'health', 'finance'].includes(c),
      )),
    )];

    events.push({
      type: 'mahadasha',
      lord: period.lord,
      startMs: period.startMs,
      endMs: period.endMs,
      isCurrent,
      isPast,
      relevantRuleIds: relevantMatches.map((m) => m.ruleId),
      domains,
    });
  }

  // ── Current Mahadasha — Antardasha periods ─────────────────────────────────

  if (currentMahaIndex >= 0 && antardashas.length > 0) {
    for (let i = 0; i < antardashas.length; i++) {
      const antar = antardashas[i];
      if (!antar) continue;

      const isCurrent = i === currentAntarIndex;
      const isPast = antar.endMs < now;

      // Only include past 2 + current + next 3
      if (!isCurrent && !isPast && i > currentAntarIndex + 3) continue;
      if (isPast && i < currentAntarIndex - 2) continue;

      const relevantMatches = allMatches.filter(
        (m) => m.categories.includes('dasha') &&
          m.sourceText.toLowerCase().includes(antar.lord.toLowerCase()),
      );

      events.push({
        type: 'antardasha',
        lord: antar.lord,
        startMs: antar.startMs,
        endMs: antar.endMs,
        isCurrent,
        isPast,
        relevantRuleIds: relevantMatches.map((m) => m.ruleId),
        domains: [],
      });
    }
  }

  return events;
}
