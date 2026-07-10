/**
 * Inference Engine — main entry point.
 *
 * runInference(facts) → InferenceResult | null
 *
 * Returns null if the Knowledge Graph has not been built yet (kb/graph/
 * does not exist). In that case the report renders all sections as "pending".
 *
 * All stages are synchronous and deterministic. The same ChartFacts always
 * produces the same InferenceResult (given the same KB graph on disk).
 *
 * Server-only: this module uses the filesystem. Never import from client code.
 */
import 'server-only';
import type { ChartFacts } from '@/types/chart';
import type { ReportSectionData } from '@/types/report';
import type { InferenceResult } from './types';
import { getKnowledgeGraph, getRuleIndex } from './loader';
import { detectYogas, detectedYogaNameSet } from './yoga-detector';
import { matchRules } from './rule-matcher';
import { aggregateDomains } from './domain-aggregator';
import { buildTimeline } from './timeline';
import { extractRemedies } from './remedy-engine';
import { buildPastValidation } from './past-validator';
import { computeTransitPositions, matchTransitRules } from './transit';
import { buildReportSections } from './report-builder';
import { logger } from '@/lib/logger';

/**
 * Run the full deterministic inference pipeline against a computed chart.
 *
 * @returns InferenceResult or null if the KB graph is unavailable.
 */
export function runInference(facts: ChartFacts): InferenceResult | null {
  logger.debug('INFERENCE_START');

  // Guard: KB graph must exist
  const kg = getKnowledgeGraph();
  if (!kg) {
    logger.warn('GRAPH_LOAD_FAIL — kb/graph/graph.json not found; run `npm run kg:build`');
    return null;
  }
  logger.debug('GRAPH_LOAD_OK');

  // Guard: rule index must be populated
  const ruleIndex = getRuleIndex();
  if (ruleIndex.size === 0) {
    logger.warn('RULE_INDEX_EMPTY — kb/rules/*/rules.jsonl not found or empty');
    return null;
  }

  const t0 = Date.now();

  // ── Stage 1: Yoga detection ───────────────────────────────────────────────

  const detectedYogas = detectYogas(facts);
  const yogaNames = detectedYogaNameSet(detectedYogas);

  // ── Stage 2: Rule matching ─────────────────────────────────────────────────

  const allMatches = matchRules(facts, yogaNames);
  logger.debug({ matchedRuleCount: allMatches.length }, 'MATCHED_RULE_COUNT');

  // ── Stage 3: Domain aggregation ───────────────────────────────────────────

  const domains = aggregateDomains(allMatches, facts, yogaNames);
  logger.debug({ domainResultsCount: Object.keys(domains).length }, 'DOMAIN_RESULTS_COUNT');

  // ── Stage 4: Timeline ─────────────────────────────────────────────────────

  const timeline = buildTimeline(facts, allMatches);

  // ── Stage 5: Remedy extraction ─────────────────────────────────────────────

  const remedies = extractRemedies(allMatches);

  // ── Stage 6: Past validation ──────────────────────────────────────────────

  const pastObservations = buildPastValidation(facts, allMatches);

  // ── Stage 7: Transit (current planetary positions vs. natal chart) ──────────

  let transit: InferenceResult['transit'] = null;
  try {
    const positions = computeTransitPositions(facts);
    const matches = matchTransitRules(positions);
    transit = { positions, matches };
  } catch (err) {
    logger.warn({ err }, 'TRANSIT_COMPUTE_FAIL — transit section will render as pending');
  }

  const elapsed = Date.now() - t0;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[inference] completed in ${elapsed}ms — ${allMatches.length} matches from ${ruleIndex.size} rules`);
  }

  const structuredMatched = allMatches.filter((m) => m.matchType === 'structured').length;
  const dimensionMatched = allMatches.filter((m) => m.matchType === 'dimension').length;

  return {
    computedAt: new Date().toISOString(),
    totalRulesEvaluated: ruleIndex.size,
    totalMatched: allMatches.length,
    structuredMatched,
    dimensionMatched,
    domains,
    yogas: detectedYogas,
    timeline,
    remedies,
    pastObservations,
    transit,
  };
}

/**
 * Run inference and convert the result to ReportSectionData[].
 * Returns an empty array if the KB graph is unavailable.
 */
export function generateReportSections(facts: ChartFacts): ReportSectionData[] {
  const result = runInference(facts);
  if (!result) return [];
  const sections = buildReportSections(result, facts);
  logger.debug({ sectionsCreated: sections.length }, 'SECTIONS_CREATED');
  return sections;
}

// Re-export for external use
export type { InferenceResult } from './types';
export { buildReportSections } from './report-builder';
