/**
 * Domain aggregator — groups matched rules into per-domain result sets.
 *
 * Each domain (career, marriage, health, finance, remedies, yoga) gets its
 * own DomainResult containing the top-N highest-confidence matches.
 *
 * No text is ever fabricated here. The only text in the output is
 * match.sourceText, which is the verbatim extracted rule translation.
 */
import type { ChartFacts } from '@/types/chart';
import type { MatchedRule, DomainResult } from './types';
import { matchRulesForCategory, matchYogaRules } from './rule-matcher';
import { resolveConflicts, splitByResolution } from './conflict-resolver';

// ── Configuration ─────────────────────────────────────────────────────────────

/** Max matches to keep per domain for the report. */
const MAX_PER_DOMAIN = 15;

/** Min extraction confidence to include in per-domain results. */
const MIN_CONFIDENCE_THRESHOLD = 0.15;

/** Scan-size safety valve for the remedy candidate pool — not a content filter
 *  (buildDomainRemedyCards already caps to a small number of cards downstream). */
const MAX_REMEDY_CANDIDATES = 40;

// ── Helper ────────────────────────────────────────────────────────────────────

function filterAndSort(matches: MatchedRule[]): MatchedRule[] {
  return matches
    .filter((m) => m.confidence >= MIN_CONFIDENCE_THRESHOLD && m.sourceText.trim().length > 10)
    .sort((a, b) => {
      // Primary: confidence descending
      if (Math.abs(a.confidence - b.confidence) > 0.01) return b.confidence - a.confidence;
      // Secondary: structured before dimension
      if (a.matchType !== b.matchType) return a.matchType === 'structured' ? -1 : 1;
      // Tertiary: book priority
      return a.priority - b.priority;
    })
    .slice(0, MAX_PER_DOMAIN);
}

/**
 * Remedy-bearing matches from the full conflict-resolved pool, uncapped by
 * MAX_PER_DOMAIN. Remedy rules routinely lose their slot in the top-15
 * narrative matches to higher-confidence non-remedy rules, which was
 * starving the remedy-card engine of real candidates it should have seen.
 */
function remedyCandidatePool(matches: MatchedRule[]): MatchedRule[] {
  return matches
    .filter((m) => m.hasRemedy && m.confidence >= MIN_CONFIDENCE_THRESHOLD && m.sourceText.trim().length > 10)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_REMEDY_CANDIDATES);
}

function buildDomainResult(
  domain: string,
  allMatches: MatchedRule[],
): DomainResult {
  const resolved = resolveConflicts(allMatches);
  const { primary, secondary } = splitByResolution(resolved);

  // Combine primary + secondary, keeping secondary at end
  const combined = [...primary, ...secondary];
  const top = filterAndSort(combined);

  return {
    domain,
    matchCount: allMatches.length,
    structuredCount: allMatches.filter((m) => m.matchType === 'structured').length,
    dimensionCount: allMatches.filter((m) => m.matchType === 'dimension').length,
    matches: top,
    remedyCandidates: remedyCandidatePool(combined),
  };
}

// ── Life-area domains ─────────────────────────────────────────────────────────

/** Per-domain config: category key and max items. */
const LIFE_AREA_DOMAINS: readonly string[] = [
  'career', 'finance', 'marriage', 'love', 'health', 'education', 'family', 'mentalNature', 'spirituality', 'remedies',
];

/**
 * Aggregate all life-area domains from the full matched rule set.
 *
 * Each domain runs its own category-scoped query against the KG so that
 * unrelated rules don't pollute a domain's results.
 */
export function aggregateDomains(
  allMatches: MatchedRule[],
  facts: ChartFacts,
  detectedYogaNames: ReadonlySet<string>,
): DomainResult[] {
  const domains: DomainResult[] = [];

  // ── Life areas (category-scoped) ──────────────────────────────────────────

  for (const domain of LIFE_AREA_DOMAINS) {
    // First: filter existing allMatches by category
    const fromAll = allMatches.filter((m) => m.categories.includes(domain));
    // Second: run a dedicated category query for fuller coverage
    const fromQuery = matchRulesForCategory(domain, facts, detectedYogaNames);

    // Merge and deduplicate
    const mergedMap = new Map<string, MatchedRule>();
    for (const m of [...fromAll, ...fromQuery]) {
      if (!mergedMap.has(m.ruleId)) mergedMap.set(m.ruleId, m);
      else {
        // Keep the higher-confidence version
        const existing = mergedMap.get(m.ruleId)!;
        if (m.confidence > existing.confidence) mergedMap.set(m.ruleId, m);
      }
    }

    domains.push(buildDomainResult(domain, Array.from(mergedMap.values())));
  }

  // ── Yoga domain ───────────────────────────────────────────────────────────

  const yogaRuleMatches = matchYogaRules(facts, detectedYogaNames);
  // Also include any allMatches tagged with yoga category
  const fromAllYoga = allMatches.filter((m) => m.categories.includes('yoga'));
  const yogaMerged = new Map<string, MatchedRule>();
  for (const m of [...fromAllYoga, ...yogaRuleMatches]) {
    if (!yogaMerged.has(m.ruleId)) yogaMerged.set(m.ruleId, m);
  }

  domains.push(buildDomainResult('yogas', Array.from(yogaMerged.values())));

  return domains;
}
