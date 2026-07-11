/**
 * Dosha detector — pure function, no I/O.
 *
 * Detects classical inauspicious planetary combinations (doshas), modelled
 * on yoga-detector.ts's structure. Kept as a separate module from yoga
 * detection: doshas are semantically distinct (inauspicious, with their own
 * cancellation logic) even though the existing Kemadruma detector is filed
 * under "yoga" today.
 *
 * Documented simplifications (v1 scope):
 *  - Mangal Dosha is checked from Lagna (primary) and Moon (secondary
 *    annotation only). Venus-based checking and synastry-based cancellation
 *    (checking a partner's chart) are out of scope.
 *  - Mangal Dosha cancellation covers own-sign/exalted Mars and a Jupiter
 *    aspect/conjunction. "Friendly sign" cancellation is not checked — the
 *    engine has no planetary friendship table (only dignity), and guessing
 *    one risks silently-wrong cancellations.
 */
import type { ChartFacts, PlanetName } from '@/types/chart';
import type { DetectedDosha } from './types';
import { planetAspectsB, areConjunct } from './condition-checker';

const MANGAL_DOSHA_HOUSES = new Set([1, 2, 4, 7, 8, 12]);

function houseFrom(base: PlanetName, target: PlanetName, facts: ChartFacts): number {
  const diff = (facts.planets[target].house - facts.planets[base].house + 12) % 12;
  return diff + 1;
}

function detectMangalDosha(facts: ChartFacts): DetectedDosha[] {
  const marsHouse = facts.planets.Mars.house;
  const fromLagna = MANGAL_DOSHA_HOUSES.has(marsHouse);
  const marsFromMoon = houseFrom('Moon', 'Mars', facts);
  const fromMoon = MANGAL_DOSHA_HOUSES.has(marsFromMoon);

  if (!fromLagna && !fromMoon) return [];

  const cancellationReasons: string[] = [];
  const dignity = facts.planets.Mars.dignity;
  if (dignity === 'own' || dignity === 'exalted') {
    cancellationReasons.push(`Mars is ${dignity} in house ${marsHouse}, which classically weakens or cancels the dosha`);
  }
  const jupiterInvolved =
    areConjunct('Mars', 'Jupiter', facts) ||
    planetAspectsB('Jupiter', 'Mars', facts) ||
    planetAspectsB('Mars', 'Jupiter', facts);
  if (jupiterInvolved) {
    cancellationReasons.push('Jupiter aspects or is conjunct Mars, which classically mitigates the dosha');
  }

  const parts: string[] = [];
  if (fromLagna) parts.push(`Mars in house ${marsHouse} from Lagna`);
  if (fromMoon) parts.push(`Mars in house ${marsFromMoon} from Moon`);

  return [{
    name: 'Mangal Dosha',
    severity: cancellationReasons.length > 0 ? 'cancelled' : 'medium',
    planets: ['Mars'],
    houses: [...new Set([marsHouse, ...(fromMoon ? [marsFromMoon] : [])])],
    formationNote: parts.join('; '),
    cancellationReasons,
    kgRuleIds: [],
  }];
}

/** Named Kaal Sarp sub-variants, keyed by Rahu's house-from-Lagna (1..12). */
const KAAL_SARP_VARIANTS: Readonly<Record<number, string>> = {
  1: 'Anant', 2: 'Kulik', 3: 'Vasuki', 4: 'Shankhpal', 5: 'Padma', 6: 'Mahapadma',
  7: 'Takshak', 8: 'Karkotak', 9: 'Shankhchud', 10: 'Ghatak', 11: 'Vishdhar', 12: 'Sheshnag',
};

const CLASSICAL_GRAHAS: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function detectKaalSarpDosha(facts: ChartFacts): DetectedDosha[] {
  const rahuLon = facts.planets.Rahu.siderealLon;
  const relativeAngles = CLASSICAL_GRAHAS.map((p) => {
    const lon = facts.planets[p].siderealLon;
    return ((lon - rahuLon) % 360 + 360) % 360;
  });

  const firstHalfCount = relativeAngles.filter((a) => a > 0 && a < 180).length;
  const secondHalfCount = relativeAngles.filter((a) => a > 180 && a < 360).length;
  const allInFirstHalf = firstHalfCount === CLASSICAL_GRAHAS.length;
  const allInSecondHalf = secondHalfCount === CLASSICAL_GRAHAS.length;
  // "Partial" = exactly one graha sits on the minority side (6-1 split).
  const minoritySide = Math.min(firstHalfCount, secondHalfCount);

  const rahuHouse = facts.planets.Rahu.house;
  const variant = KAAL_SARP_VARIANTS[rahuHouse] ?? 'Unclassified';

  if (allInFirstHalf || allInSecondHalf) {
    return [{
      name: `Kaal Sarp Dosha — ${variant}`,
      severity: 'medium',
      planets: ['Rahu', 'Ketu'],
      houses: [rahuHouse, facts.planets.Ketu.house],
      formationNote: `All seven classical grahas fall on one side of the Rahu-Ketu axis (Rahu in house ${rahuHouse})`,
      cancellationReasons: [],
      kgRuleIds: [],
    }];
  }

  if (minoritySide === 1) {
    return [{
      name: `Kaal Sarp Dosha (partial) — ${variant}`,
      severity: 'low',
      planets: ['Rahu', 'Ketu'],
      houses: [rahuHouse, facts.planets.Ketu.house],
      formationNote: `Six of the seven classical grahas fall on one side of the Rahu-Ketu axis (Rahu in house ${rahuHouse}); one graha breaks the pattern`,
      cancellationReasons: [],
      kgRuleIds: [],
    }];
  }

  return [];
}

/** Detect all supported classical doshas from the natal chart. Pure function. */
export function detectDoshas(facts: ChartFacts): DetectedDosha[] {
  return [
    ...detectMangalDosha(facts),
    ...detectKaalSarpDosha(facts),
  ];
}

/** Returns Set of detected dosha names for use in condition-checker / narrative layer. */
export function detectedDoshaNameSet(doshas: DetectedDosha[]): ReadonlySet<string> {
  return new Set(doshas.map((d) => d.name));
}
