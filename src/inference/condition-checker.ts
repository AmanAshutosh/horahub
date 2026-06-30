/**
 * Condition checker — pure deterministic matching.
 *
 * Given a RuleCondition and the computed ChartFacts, returns true only when
 * the condition is verifiably satisfied. No probability, no inference, no
 * "approximately true". If a condition cannot be verified (missing data,
 * unrecognised planet name, etc.) it returns false — conservative is correct.
 *
 * For 'house-lord-strength' conditions we approximate strength via dignity
 * because shadbala is not computed: exalted/own → strong, debilitated → weak.
 */
import type { ChartFacts, PlanetName } from '@/types/chart';
import type { RuleCondition } from '../../scripts/kb-lib/rule-schema';

// ── Static lookup tables ──────────────────────────────────────────────────────

const SIGN_INDEX: Readonly<Record<string, number>> = {
  Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5,
  Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11,
};

const NAKSHATRA_INDEX: Readonly<Record<string, number>> = {
  Ashwini: 0, Bharani: 1, Krittika: 2, Rohini: 3, Mrigashira: 4, Ardra: 5,
  Punarvasu: 6, Pushya: 7, Ashlesha: 8, Magha: 9, 'Purva Phalguni': 10,
  'Uttara Phalguni': 11, Hasta: 12, Chitra: 13, Swati: 14, Vishakha: 15,
  Anuradha: 16, Jyeshtha: 17, Mula: 18, 'Purva Ashadha': 19,
  'Uttara Ashadha': 20, Shravana: 21, Dhanishtha: 22, Shatabhisha: 23,
  'Purva Bhadrapada': 24, 'Uttara Bhadrapada': 25, Revati: 26,
  // common variant spellings
  Dhanistha: 22, 'Purva Bhadra': 24, 'Uttara Bhadra': 25,
};

/**
 * Parashari aspect offsets from the aspecting planet's sign (0-indexed).
 * Key = planet name, value = set of sign-offsets it aspects (7th = offset 6,
 * 4th = offset 3, etc.).
 */
const PARASHARI_ASPECTS: Readonly<Record<string, readonly number[]>> = {
  Sun:      [6],
  Moon:     [6],
  Mercury:  [6],
  Venus:    [6],
  Mars:     [3, 6, 7],
  Jupiter:  [4, 6, 8],
  Saturn:   [2, 6, 9],
  Rahu:     [4, 6, 8],
  Ketu:     [4, 6, 8],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPlanetName(name: string): name is PlanetName {
  return ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']
    .includes(name);
}

/** True when planet A casts a Parashari aspect onto the sign of planet B. */
function planetAspectsB(
  aspector: string,
  aspected: string,
  facts: ChartFacts,
): boolean {
  if (!isPlanetName(aspector) || !isPlanetName(aspected)) return false;
  const aSign = facts.planets[aspector].sign;
  const bSign = facts.planets[aspected].sign;
  const offset = ((bSign - aSign) % 12 + 12) % 12;
  return (PARASHARI_ASPECTS[aspector] ?? []).includes(offset);
}

/** Both planets in the same house (whole-sign conjunction). */
function areConjunct(p1: string, p2: string, facts: ChartFacts): boolean {
  if (!isPlanetName(p1) || !isPlanetName(p2)) return false;
  return facts.planets[p1].house === facts.planets[p2].house;
}

/** Approximate strength from dignity: exalted/own → 'strong', debilitated → 'weak', else 'neutral' */
function dignityStrength(dignity: string): 'strong' | 'weak' | 'neutral' {
  if (dignity === 'exalted' || dignity === 'own') return 'strong';
  if (dignity === 'debilitated') return 'weak';
  return 'neutral';
}

// ── Main checker ──────────────────────────────────────────────────────────────

/**
 * Check a single condition against the natal chart.
 *
 * Returns true only when the condition is DEFINITIVELY satisfied.
 * Returns false for conditions that cannot be verified (e.g. yoga-presence
 * without a yoga detector, or unrecognised planet names).
 *
 * Caller passes detectedYogaNames for yoga-presence checks.
 */
export function checkCondition(
  cond: RuleCondition,
  facts: ChartFacts,
  detectedYogaNames: ReadonlySet<string> = new Set(),
): boolean {
  switch (cond.type) {
    case 'planet-in-house': {
      if (!cond.planet || cond.house == null) return false;
      if (!isPlanetName(cond.planet)) return false;
      return facts.planets[cond.planet].house === cond.house;
    }

    case 'planet-in-sign': {
      if (!cond.planet || !cond.sign) return false;
      if (!isPlanetName(cond.planet)) return false;
      const signIdx = SIGN_INDEX[cond.sign];
      if (signIdx === undefined) return false;
      return facts.planets[cond.planet].sign === signIdx;
    }

    case 'planet-dignity': {
      if (!cond.planet || !cond.dignity) return false;
      if (!isPlanetName(cond.planet)) return false;
      // dignity field on condition uses the same vocabulary as PlanetPlacement
      return facts.planets[cond.planet].dignity === cond.dignity;
    }

    case 'planet-conjunction': {
      // cond.planet = one of the conjuncting planets; partner is in the rule's
      // dimensions.planets (accessible via cond.raw, but we check all pairs)
      if (!cond.planet || !isPlanetName(cond.planet)) return false;
      // We don't have the partner encoded directly on RuleCondition for
      // planet-conjunction. Treat as: this planet is in the same house as ANY
      // other planet mentioned alongside it. Since condition only has one
      // planet, verify it's in a house with at least one occupant.
      const house = facts.planets[cond.planet].house;
      return (facts.houses[house - 1]?.occupants.length ?? 0) > 1;
    }

    case 'planet-aspect': {
      // cond.planet = the planet being aspected
      // cond.aspectingPlanet = the planet doing the aspecting (may be undefined)
      if (!cond.planet) return false;
      if (!cond.aspectingPlanet) {
        // Generic "aspected" — check if ANY planet aspects cond.planet
        const allPlanets = Object.keys(facts.planets) as PlanetName[];
        return allPlanets.some(
          (p) => p !== cond.planet && planetAspectsB(p, cond.planet!, facts),
        );
      }
      return planetAspectsB(cond.aspectingPlanet, cond.planet, facts);
    }

    case 'house-lord-strength': {
      // cond.house = the house whose lord we check; cond.dignity = 'strong' | 'weak'
      if (cond.house == null) return false;
      const houseData = facts.houses[cond.house - 1];
      if (!houseData) return false;
      const lord = houseData.lord;
      if (!isPlanetName(lord)) return false;
      const strength = dignityStrength(facts.planets[lord].dignity);
      if (strength === 'neutral') return false; // cannot verify
      if (!cond.dignity) return strength === 'strong'; // default: check for strength
      return strength === cond.dignity;
    }

    case 'dasha-period': {
      if (!cond.planet) return false;
      const { periods, currentMahaIndex, antardashas, currentAntarIndex } = facts.dasha;
      const currentMaha = periods[currentMahaIndex];
      if (!currentMaha) return false;
      if (currentMaha.lord !== cond.planet) return false;
      // If antardasha planet is specified, verify it too
      if (cond.antardashaPlanet) {
        const currentAntar = antardashas[currentAntarIndex];
        if (!currentAntar) return false;
        return currentAntar.lord === cond.antardashaPlanet;
      }
      return true;
    }

    case 'nakshatra-placement': {
      if (!cond.planet || !cond.nakshatra) return false;
      if (!isPlanetName(cond.planet)) return false;
      const nakIdx = NAKSHATRA_INDEX[cond.nakshatra];
      if (nakIdx === undefined) return false;
      return facts.planets[cond.planet].nakshatra === nakIdx;
    }

    case 'yoga-presence': {
      if (!cond.yoga) return false;
      // Exact match first, then case-insensitive
      if (detectedYogaNames.has(cond.yoga)) return true;
      const lower = cond.yoga.toLowerCase();
      for (const name of detectedYogaNames) {
        if (name.toLowerCase() === lower) return true;
      }
      return false;
    }

    case 'unstructured':
      // No verifiable condition — never confirmed as a structured match
      return false;

    default:
      return false;
  }
}

/**
 * Check ALL conditions of a structured rule. Returns true only when every
 * condition passes (AND semantics). Empty conditions array → false.
 */
export function checkAllConditions(
  conditions: RuleCondition[],
  facts: ChartFacts,
  detectedYogaNames: ReadonlySet<string> = new Set(),
): boolean {
  if (conditions.length === 0) return false;
  return conditions.every((c) => checkCondition(c, facts, detectedYogaNames));
}

/** Re-export lookup helpers for use in yoga-detector. */
export { SIGN_INDEX, NAKSHATRA_INDEX, PARASHARI_ASPECTS, planetAspectsB, areConjunct };
