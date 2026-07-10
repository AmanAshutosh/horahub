/**
 * Transit engine — compares today's real-time planetary positions against a
 * natal chart.
 *
 * There is no structured 'transit'/'gochara' condition type in the KB (every
 * transit-tagged rule is unstructured), so this is a deliberately bespoke,
 * dimension-based matcher — parallel to but separate from rule-matcher.ts's
 * checkAllConditions path. A rule is considered relevant when it names one of
 * the transiting planets AND names a house that matches the planet's computed
 * house-from-Lagna or house-from-Moon. Nothing here is fabricated: every
 * position is a real ephemeris calculation, every match traces to real KB
 * rule text.
 */
import 'server-only';
import type { ChartFacts, PlanetName } from '@/types/chart';
import type { MatchedRule, TransitPlanetPosition } from './types';
import { ephemeris } from '@/ephemeris/provider';
import { getKnowledgeGraph, getRuleIndex } from './loader';
import { toMatchedRule, getConflictCorroboration } from './rule-matcher';

export type { TransitPlanetPosition } from './types';

/** Slow-moving bodies classical transit (gochara) analysis is built around. */
export const TRANSIT_PLANETS: readonly PlanetName[] = ['Saturn', 'Jupiter', 'Rahu', 'Ketu'];

function houseFromRef(sign: number, refSign: number): number {
  return ((sign - refSign + 12) % 12) + 1;
}

/**
 * Today's (or any given instant's) positions for the 4 classical transit
 * planets, expressed relative to this natal chart's own Lagna and Moon.
 * Uses only already-persisted natal data (facts.lagnaSign / facts.moon.sign)
 * — no birth coordinates needed, since planetary longitude here is
 * geocentric and location-independent.
 */
export function computeTransitPositions(natal: ChartFacts, nowMs: number = Date.now()): TransitPlanetPosition[] {
  const sidereal = ephemeris.siderealPositions(nowMs);
  return TRANSIT_PLANETS.map((planet) => {
    const lon = sidereal[planet];
    const sign = Math.floor(lon / 30);
    return {
      planet,
      sign,
      siderealLon: lon,
      houseFromLagna: houseFromRef(sign, natal.lagnaSign),
      houseFromMoon: houseFromRef(sign, natal.moon.sign),
    };
  });
}

/**
 * Match KB rules tagged 'transit' against the computed transit positions.
 * Returns MatchedRule[] built the same way every other section's matches
 * are (same confidence formula, same conflict/corroboration lookup) so
 * transit evidence carries identical semantics to the rest of the report.
 */
export function matchTransitRules(positions: TransitPlanetPosition[]): MatchedRule[] {
  const kg = getKnowledgeGraph();
  if (!kg) return [];
  const ruleIndex = getRuleIndex();

  let candidateIds: string[];
  try {
    candidateIds = kg.findRulesByCategory('transit').evidence.map((e) => e.ruleId);
  } catch {
    return [];
  }

  const results: MatchedRule[] = [];
  const seen = new Set<string>();

  for (const ruleId of candidateIds) {
    if (seen.has(ruleId)) continue;
    const rule = ruleIndex.get(ruleId);
    if (!rule) continue;
    if (rule.extractionConfidence < 0.2) continue;

    const relevant = positions.some(
      (p) =>
        rule.dimensions.planets.includes(p.planet) &&
        (rule.dimensions.houses.includes(p.houseFromLagna) || rule.dimensions.houses.includes(p.houseFromMoon)),
    );
    if (!relevant) continue;

    seen.add(ruleId);
    const { conflictingRuleIds, corroboratingRuleIds } = getConflictCorroboration(ruleId, kg);
    results.push(toMatchedRule(rule, 'dimension', [], conflictingRuleIds, corroboratingRuleIds));
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}
