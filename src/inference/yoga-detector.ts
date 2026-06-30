/**
 * Yoga detector — pure function, no I/O.
 *
 * Detects classical planetary combinations (yogas) present in the natal chart
 * using only ChartFacts. The detection logic is based on classical Parashari
 * definitions, not on KB rules. Results feed:
 *   1. The condition-checker's 'yoga-presence' case
 *   2. The YogaSection report output
 *
 * We detect a curated set of well-defined yogas only. Free-text yoga names
 * in the KB (e.g. "born in the Yoga") are parsing artefacts and are NOT
 * treated as detectable.
 */
import type { ChartFacts, PlanetName } from '@/types/chart';
import type { DetectedYoga } from './types';
import { planetAspectsB, areConjunct } from './condition-checker';

// ── Helpers ───────────────────────────────────────────────────────────────────

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const TRIKONA_HOUSES = new Set([1, 5, 9]);

function isInKendra(planet: PlanetName, facts: ChartFacts): boolean {
  return KENDRA_HOUSES.has(facts.planets[planet].house);
}

function isExaltedOrOwn(planet: PlanetName, facts: ChartFacts): boolean {
  const d = facts.planets[planet].dignity;
  return d === 'exalted' || d === 'own';
}

function isDebilitated(planet: PlanetName, facts: ChartFacts): boolean {
  return facts.planets[planet].dignity === 'debilitated';
}

/** House of planet B relative to planet A (1 = same house, 7 = 7th). */
function houseOffsetFrom(a: PlanetName, b: PlanetName, facts: ChartFacts): number {
  const diff = (facts.planets[b].house - facts.planets[a].house + 12) % 12;
  return diff === 0 ? 1 : diff + 1;
}

/** All planets in kendra or trikona from Lagna. */
function planetsInKendraOrTrikona(facts: ChartFacts): PlanetName[] {
  const all: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  return all.filter((p) => KENDRA_HOUSES.has(facts.planets[p].house) || TRIKONA_HOUSES.has(facts.planets[p].house));
}

/** Lord of a given house. */
function houseLord(houseNum: number, facts: ChartFacts): PlanetName | null {
  const h = facts.houses[houseNum - 1];
  return h ? h.lord : null;
}

// ── Individual yoga detectors ─────────────────────────────────────────────────

function detectMahapurusha(facts: ChartFacts): DetectedYoga[] {
  const yogas: DetectedYoga[] = [];

  const checks: Array<{ planet: PlanetName; name: string }> = [
    { planet: 'Jupiter', name: 'Hamsa Yoga' },
    { planet: 'Venus',   name: 'Malavya Yoga' },
    { planet: 'Saturn',  name: 'Sasha Yoga' },
    { planet: 'Mars',    name: 'Ruchaka Yoga' },
    { planet: 'Mercury', name: 'Bhadra Yoga' },
  ];

  for (const { planet, name } of checks) {
    const inKendra = isInKendra(planet, facts);
    const exaltedOrOwn = isExaltedOrOwn(planet, facts);

    if (inKendra && exaltedOrOwn) {
      yogas.push({
        name,
        strength: facts.planets[planet].dignity === 'exalted' ? 'exact' : 'approximate',
        planets: [planet],
        houses: [facts.planets[planet].house],
        formationNote: `${planet} in ${facts.planets[planet].dignity} state in house ${facts.planets[planet].house} (kendra)`,
        kgRuleIds: [],
      });
    } else if (inKendra && !isDebilitated(planet, facts)) {
      yogas.push({
        name,
        strength: 'partial',
        planets: [planet],
        houses: [facts.planets[planet].house],
        formationNote: `${planet} in kendra (house ${facts.planets[planet].house}) but not in own/exalted sign`,
        kgRuleIds: [],
      });
    }
  }

  return yogas;
}

function detectGajakesari(facts: ChartFacts): DetectedYoga[] {
  const jupHouse = facts.planets['Jupiter'].house;
  const moonHouse = facts.planets['Moon'].house;
  const offsetFromMoon = houseOffsetFrom('Moon', 'Jupiter', facts);
  const isKendra = KENDRA_HOUSES.has(offsetFromMoon);

  if (!isKendra) return [];

  const strength = isExaltedOrOwn('Jupiter', facts) ? 'exact' : 'approximate';
  return [{
    name: 'Gajakesari Yoga',
    strength,
    planets: ['Jupiter', 'Moon'],
    houses: [jupHouse, moonHouse],
    formationNote: `Jupiter in house ${jupHouse} (house ${offsetFromMoon} from Moon in house ${moonHouse})`,
    kgRuleIds: [],
  }];
}

function detectBudhaAditya(facts: ChartFacts): DetectedYoga[] {
  if (!areConjunct('Sun', 'Mercury', facts)) return [];
  return [{
    name: 'Budha-Aditya Yoga',
    strength: 'exact',
    planets: ['Sun', 'Mercury'],
    houses: [facts.planets['Sun'].house],
    formationNote: `Sun and Mercury in house ${facts.planets['Sun'].house}`,
    kgRuleIds: [],
  }];
}

function detectChandraMangal(facts: ChartFacts): DetectedYoga[] {
  if (!areConjunct('Moon', 'Mars', facts)) return [];
  return [{
    name: 'Chandra-Mangal Yoga',
    strength: 'exact',
    planets: ['Moon', 'Mars'],
    houses: [facts.planets['Moon'].house],
    formationNote: `Moon and Mars conjunct in house ${facts.planets['Moon'].house}`,
    kgRuleIds: [],
  }];
}

function detectSaraswati(facts: ChartFacts): DetectedYoga[] {
  // Jupiter, Venus, Mercury all in kendra (1,4,7,10), trikona (1,5,9), or 2nd
  const saraswatiHouses = new Set([1, 2, 4, 5, 7, 9, 10]);
  const jH = facts.planets['Jupiter'].house;
  const vH = facts.planets['Venus'].house;
  const mH = facts.planets['Mercury'].house;
  if (saraswatiHouses.has(jH) && saraswatiHouses.has(vH) && saraswatiHouses.has(mH)) {
    return [{
      name: 'Saraswati Yoga',
      strength: 'approximate',
      planets: ['Jupiter', 'Venus', 'Mercury'],
      houses: [...new Set([jH, vH, mH])],
      formationNote: `Jupiter (H${jH}), Venus (H${vH}), Mercury (H${mH}) all in kendra/trikona/2nd`,
      kgRuleIds: [],
    }];
  }
  return [];
}

function detectRajaYoga(facts: ChartFacts): DetectedYoga[] {
  const kendraHouses = [1, 4, 7, 10];
  const trikonaHouses = [1, 5, 9];
  const yogas: DetectedYoga[] = [];

  for (const k of kendraHouses) {
    const kLord = houseLord(k, facts);
    if (!kLord) continue;
    for (const t of trikonaHouses) {
      if (k === t) continue;
      const tLord = houseLord(t, facts);
      if (!tLord || tLord === kLord) continue;

      const conjunct = areConjunct(kLord, tLord, facts);
      const mutualAspect = planetAspectsB(kLord, tLord, facts) && planetAspectsB(tLord, kLord, facts);

      if (conjunct || mutualAspect) {
        const label = conjunct ? 'conjunction' : 'mutual aspect';
        yogas.push({
          name: `Raja Yoga (L${k}–L${t})`,
          strength: 'approximate',
          planets: [kLord, tLord],
          houses: [facts.planets[kLord].house, facts.planets[tLord].house],
          formationNote: `Lord of house ${k} (${kLord}) and lord of house ${t} (${tLord}) in ${label}`,
          kgRuleIds: [],
        });
      }
    }
  }

  return yogas;
}

function detectDhanaYoga(facts: ChartFacts): DetectedYoga[] {
  const l2 = houseLord(2, facts);
  const l11 = houseLord(11, facts);
  if (!l2 || !l11 || l2 === l11) return [];

  const conjunct = areConjunct(l2, l11, facts);
  const l2InKendra = isInKendra(l2, facts);
  const l11InKendra = isInKendra(l11, facts);

  if (conjunct) {
    return [{
      name: 'Dhana Yoga',
      strength: 'exact',
      planets: [l2, l11],
      houses: [facts.planets[l2].house],
      formationNote: `Lord of 2nd (${l2}) and lord of 11th (${l11}) conjunct in house ${facts.planets[l2].house}`,
      kgRuleIds: [],
    }];
  }
  if (l2InKendra && l11InKendra) {
    return [{
      name: 'Dhana Yoga',
      strength: 'partial',
      planets: [l2, l11],
      houses: [facts.planets[l2].house, facts.planets[l11].house],
      formationNote: `Lord of 2nd (${l2}, H${facts.planets[l2].house}) and lord of 11th (${l11}, H${facts.planets[l11].house}) both in kendra`,
      kgRuleIds: [],
    }];
  }

  return [];
}

function detectKemaldruma(facts: ChartFacts): DetectedYoga[] {
  // Moon has no planet in adjacent houses (2nd and 12th from Moon), and
  // Moon itself is not in a kendra. Inauspicious yoga.
  const moonHouse = facts.planets['Moon'].house;
  const prev = ((moonHouse - 2 + 12) % 12) + 1;
  const next = (moonHouse % 12) + 1;

  const allPlanets: PlanetName[] = ['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const hasNeighbour = allPlanets.some(
    (p) => facts.planets[p].house === prev || facts.planets[p].house === next,
  );
  const moonInKendra = KENDRA_HOUSES.has(moonHouse);

  if (!hasNeighbour && !moonInKendra) {
    return [{
      name: 'Kemadruma Yoga',
      strength: 'exact',
      planets: ['Moon'],
      houses: [moonHouse],
      formationNote: `Moon in house ${moonHouse} with no planets in houses ${prev} or ${next} and not in kendra`,
      kgRuleIds: [],
    }];
  }
  return [];
}

// ── Main export ───────────────────────────────────────────────────────────────

/** Detect all supported classical yogas from the natal chart. Pure function. */
export function detectYogas(facts: ChartFacts): DetectedYoga[] {
  const allYogas: DetectedYoga[] = [
    ...detectMahapurusha(facts),
    ...detectGajakesari(facts),
    ...detectBudhaAditya(facts),
    ...detectChandraMangal(facts),
    ...detectSaraswati(facts),
    ...detectRajaYoga(facts),
    ...detectDhanaYoga(facts),
    ...detectKemaldruma(facts),
  ];

  // Deduplicate by name + planets (same yoga detected by multiple paths)
  const seen = new Set<string>();
  return allYogas.filter((y) => {
    const key = `${y.name}::${[...y.planets].sort().join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Returns Set of detected yoga names for use in condition-checker. */
export function detectedYogaNameSet(yogas: DetectedYoga[]): ReadonlySet<string> {
  return new Set(yogas.map((y) => y.name));
}

/** Utility: all detected yoga names as lower-case for fuzzy matching. */
export function planetsInKendraOrTrikonaFromFacts(facts: ChartFacts): PlanetName[] {
  return planetsInKendraOrTrikona(facts);
}
