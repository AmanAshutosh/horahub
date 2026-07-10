/**
 * Rule Matcher — two-phase candidate retrieval and condition verification.
 *
 * Phase 1 (fast): Query the Knowledge Graph adjacency index to get candidate
 *   rule IDs relevant to the chart's planets, houses, dashas, and categories.
 *
 * Phase 2 (precise): For each candidate that has a parsed structuredRule,
 *   run checkAllConditions() against ChartFacts. For unstructured rules
 *   (no parsed conditions), include them as 'dimension' matches if at least
 *   one relevant entity in the rule's dimensions matches the chart.
 *
 * Output: deduplicated MatchedRule[] sorted by confidence descending.
 */
import type { ChartFacts, PlanetName } from '@/types/chart';
import type { Rule } from '../../scripts/kb-lib/rule-schema';
import type { MatchedRule } from './types';
import type { QueryResult } from '../../scripts/kg/schema';
import { getKnowledgeGraph, getRuleIndex } from './loader';
import { checkAllConditions } from './condition-checker';
import { computeConfidence } from './confidence';

// ── Domain configuration ──────────────────────────────────────────────────────

/** Life-area categories that map to KB category nodes. */
const LIFE_AREA_CATEGORIES = [
  'career', 'marriage', 'love', 'health', 'finance', 'education', 'spirituality', 'family', 'mentalNature', 'remedies',
];

/** Additional general categories to query for comprehensive coverage. */
const GENERAL_CATEGORIES = ['planet', 'house', 'dasha', 'yoga', 'nakshatra', 'timing'];

/** Hard cap on candidates per query to keep inference fast. */
const MAX_CANDIDATES_PER_QUERY = 200;

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_PLANETS: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

/** Extract rule ID string from a KG node id of the form "rule:BPHS_CH1_V1_R001". */
function nodeIdToRuleId(nodeId: string): string {
  return nodeId.startsWith('rule:') ? nodeId.slice(5) : nodeId;
}

/**
 * Collect rule IDs from a KG query result (QueryResult.evidence array).
 * Cap to MAX_CANDIDATES to avoid scanning thousands of unstructured rules.
 */
function candidateIdsFromQuery(
  kg: ReturnType<typeof getKnowledgeGraph>,
  queryFn: () => QueryResult | null,
): string[] {
  if (!kg) return [];
  try {
    const result = queryFn();
    if (!result) return [];
    return result.evidence
      .slice(0, MAX_CANDIDATES_PER_QUERY)
      .map((e) => e.ruleId);
  } catch {
    return [];
  }
}

// ── Dimension relevance check (for unstructured rules) ────────────────────────

/**
 * For a rule with no parsed conditions, check if the rule's mentioned
 * entities are "relevant" to this chart — i.e. the chart contains at least
 * one of the planets/houses/signs the rule text mentions.
 *
 * This is intentionally generous: unstructured rules are assigned lower
 * confidence, so the report automatically ranks structured matches first.
 */
function isDimensionRelevant(rule: Rule, facts: ChartFacts): boolean {
  // Relevant planets: those in the rule's dimensions that appear in the chart
  // (every chart has all 9 planets, so "relevant" = any planet mention passes)
  if (rule.dimensions.planets.length > 0 || rule.dimensions.secondaryPoints.length > 0) {
    return true; // rule mentions at least one planet
  }

  // House relevance: rule mentions a house that has a planet in this chart
  for (const h of rule.dimensions.houses) {
    if (facts.houses[h - 1]?.occupants.length ?? 0 > 0) return true;
  }

  // Sign relevance: rule mentions a sign occupied by at least one planet
  for (const signName of rule.dimensions.signs) {
    const SIGN_INDEX: Record<string, number> = {
      Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5,
      Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11,
    };
    const idx = SIGN_INDEX[signName];
    if (idx !== undefined) {
      const hasPlanet = ALL_PLANETS.some((p) => facts.planets[p].sign === idx);
      if (hasPlanet) return true;
    }
  }

  // Category-only rules (no entity mentions) are always relevant to the domain
  return rule.dimensions.planets.length === 0 &&
    rule.dimensions.houses.length === 0 &&
    rule.dimensions.signs.length === 0;
}

// ── Conflict/corroboration lookup ─────────────────────────────────────────────

function getConflictCorroboration(
  ruleId: string,
  kg: ReturnType<typeof getKnowledgeGraph>,
): { conflictingRuleIds: string[]; corroboratingRuleIds: string[] } {
  if (!kg) return { conflictingRuleIds: [], corroboratingRuleIds: [] };
  try {
    const conflicts = kg.findConflicts(ruleId);
    const related = kg.findRelatedRules(ruleId);
    const conflictingRuleIds = conflicts.evidence.map((e) => e.ruleId);
    const corroboratingRuleIds = related.evidence
      .filter((e) => {
        // Only include corroborating rules (different book, same condition)
        const rel = kg.findSupportingEvidence(ruleId);
        return rel.some((ev) => ev.ruleId === e.ruleId);
      })
      .map((e) => e.ruleId);
    return { conflictingRuleIds, corroboratingRuleIds };
  } catch {
    return { conflictingRuleIds: [], corroboratingRuleIds: [] };
  }
}

// ── Rule → MatchedRule conversion ─────────────────────────────────────────────

function toMatchedRule(
  rule: Rule,
  matchType: 'structured' | 'dimension',
  matchedConditionRaws: string[],
  conflictingRuleIds: string[],
  corroboratingRuleIds: string[],
): MatchedRule {
  const confidence = computeConfidence({
    matchType,
    bookCode: rule.bookCode,
    priority: rule.priority,
    extractionConfidence: rule.extractionConfidence,
    validationConfidence: rule.validationConfidence,
    conflictCount: conflictingRuleIds.length,
    corroborationCount: corroboratingRuleIds.length,
    isComposite: rule.isComposite,
  });

  return {
    ruleId: rule.id,
    book: rule.book,
    bookCode: rule.bookCode,
    chapter: rule.chapter,
    verse: rule.verse,
    page: rule.page,
    priority: rule.priority,
    categories: rule.categories,
    sourceText: rule.translation,
    matchType,
    matchedConditionRaws,
    effectDirection: rule.structuredRule?.effect.direction ?? 'unspecified',
    effectDomain: rule.structuredRule?.effect.domain ?? null,
    confidence,
    extractionConfidence: rule.extractionConfidence,
    validationConfidence: rule.validationConfidence,
    conflictingRuleIds,
    corroboratingRuleIds,
    hasRemedy: rule.remedy !== null,
    hasTiming: rule.timing !== null,
    isComposite: rule.isComposite,
  };
}

// ── Main matcher ──────────────────────────────────────────────────────────────

export interface MatchOptions {
  /** Limit candidates per KG query. Default 200. */
  maxCandidatesPerQuery?: number;
  /** Only return structured matches (no dimension). Default false. */
  structuredOnly?: boolean;
  /** If provided, only match rules from these categories. */
  filterCategories?: string[];
}

/**
 * Match rules against the chart.
 *
 * Returns deduplicated MatchedRule[] sorted by confidence descending.
 */
export function matchRules(
  facts: ChartFacts,
  detectedYogaNames: ReadonlySet<string>,
  opts: MatchOptions = {},
): MatchedRule[] {
  const kg = getKnowledgeGraph();
  const ruleIndex = getRuleIndex();
  const cap = opts.maxCandidatesPerQuery ?? MAX_CANDIDATES_PER_QUERY;

  // Collect candidate rule IDs (may contain duplicates — deduplicated later)
  const candidateIdSet = new Set<string>();

  // ── 1. Category queries ────────────────────────────────────────────────────

  const categoriesToQuery = opts.filterCategories ?? [...LIFE_AREA_CATEGORIES, ...GENERAL_CATEGORIES];
  for (const cat of categoriesToQuery) {
    const ids = candidateIdsFromQuery(kg, () => kg?.findRulesByCategory(cat) ?? null);
    ids.slice(0, cap).forEach((id) => candidateIdSet.add(id));
  }

  // ── 2. Planet queries (planets in non-neutral dignity, or in key houses) ───

  for (const planet of ALL_PLANETS) {
    const pl = facts.planets[planet];
    // Prioritise planets in kendra (1,4,7,10) or with notable dignity
    const isKeyPlanet = [1, 4, 7, 10].includes(pl.house) || pl.dignity !== 'neutral';
    if (isKeyPlanet) {
      const ids = candidateIdsFromQuery(kg, () => kg?.findRulesByPlanet(planet) ?? null);
      ids.slice(0, cap).forEach((id) => candidateIdSet.add(id));
    }
  }

  // ── 3. House queries (all 12 houses) ──────────────────────────────────────

  for (let h = 1; h <= 12; h++) {
    const ids = candidateIdsFromQuery(kg, () => kg?.findRulesByHouse(h) ?? null);
    ids.slice(0, Math.floor(cap / 2)).forEach((id) => candidateIdSet.add(id));
  }

  // ── 4. Dasha queries ───────────────────────────────────────────────────────

  const { periods, currentMahaIndex, antardashas, currentAntarIndex } = facts.dasha;
  const currentMaha = periods[currentMahaIndex];
  if (currentMaha) {
    const ids = candidateIdsFromQuery(kg, () => kg?.findRulesByDasha(currentMaha.lord) ?? null);
    ids.slice(0, cap).forEach((id) => candidateIdSet.add(id));
  }
  // Also query adjacent dasha periods (past 2 + next 2)
  for (let k = Math.max(0, currentMahaIndex - 2); k <= Math.min(periods.length - 1, currentMahaIndex + 2); k++) {
    if (k === currentMahaIndex) continue;
    const p = periods[k];
    if (!p) continue;
    const ids = candidateIdsFromQuery(kg, () => kg?.findRulesByDasha(p.lord) ?? null);
    ids.slice(0, Math.floor(cap / 4)).forEach((id) => candidateIdSet.add(id));
  }

  // Also query current antardasha
  const currentAntar = antardashas[currentAntarIndex];
  if (currentAntar) {
    const ids = candidateIdsFromQuery(kg, () => kg?.findRulesByDasha(currentAntar.lord) ?? null);
    ids.slice(0, Math.floor(cap / 2)).forEach((id) => candidateIdSet.add(id));
  }

  // ── 5. Yoga queries ────────────────────────────────────────────────────────

  for (const yogaName of detectedYogaNames) {
    const ids = candidateIdsFromQuery(kg, () => kg?.findRulesByYoga(yogaName) ?? null);
    ids.slice(0, cap).forEach((id) => candidateIdSet.add(id));
  }

  // ── Phase 2: Verify conditions ─────────────────────────────────────────────

  const results: MatchedRule[] = [];
  const seen = new Set<string>();

  for (const ruleId of candidateIdSet) {
    if (seen.has(ruleId)) continue;
    seen.add(ruleId);

    const rule = ruleIndex.get(ruleId);
    if (!rule) continue;

    // Filter by category if requested
    if (opts.filterCategories && !opts.filterCategories.some((c) => rule.categories.includes(c))) {
      continue;
    }

    // Skip rules with extremely low quality
    if (rule.extractionConfidence < 0.2) continue;

    if (rule.structuredRule && rule.structuredRule.conditions.length > 0) {
      // Structured match: verify all conditions
      const passed = checkAllConditions(rule.structuredRule.conditions, facts, detectedYogaNames);
      if (passed) {
        const { conflictingRuleIds, corroboratingRuleIds } = getConflictCorroboration(ruleId, kg);
        results.push(toMatchedRule(
          rule,
          'structured',
          rule.structuredRule.conditions.map((c) => c.raw),
          conflictingRuleIds,
          corroboratingRuleIds,
        ));
      }
    } else if (!opts.structuredOnly) {
      // Dimension match: entity-level relevance check
      if (isDimensionRelevant(rule, facts)) {
        const { conflictingRuleIds, corroboratingRuleIds } = getConflictCorroboration(ruleId, kg);
        results.push(toMatchedRule(
          rule,
          'dimension',
          [],
          conflictingRuleIds,
          corroboratingRuleIds,
        ));
      }
    }
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

/**
 * Match rules for a specific life-area category only.
 * Used by the domain aggregator to scope matches per section.
 */
export function matchRulesForCategory(
  category: string,
  facts: ChartFacts,
  detectedYogaNames: ReadonlySet<string>,
): MatchedRule[] {
  return matchRules(facts, detectedYogaNames, {
    filterCategories: [category],
    maxCandidatesPerQuery: 300,
  });
}

/**
 * Match rules for yoga section: returns rules mentioning detected yoga names
 * plus structured yoga-presence rules that match.
 */
export function matchYogaRules(
  facts: ChartFacts,
  detectedYogaNames: ReadonlySet<string>,
): MatchedRule[] {
  return matchRules(facts, detectedYogaNames, {
    filterCategories: ['yoga'],
    maxCandidatesPerQuery: 200,
  });
}

export { nodeIdToRuleId };
