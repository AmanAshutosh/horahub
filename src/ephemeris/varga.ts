import type { DivisionalChart, DivisionalHouse, PlanetName } from '@/types/chart';
import { SIGN_LORD } from '@/constants/astro';
import { norm360 } from './math';

const PLANET_ORDER: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

/**
 * Divisional chart (varga) engine — Parashari scheme.
 *
 * Covers D2, D3, D4, D7, D9, D10, D12 (this file's current scope). Each
 * division's *starting sign* follows its own classical rule (modality,
 * odd/even parity, or a fixed same-sign start) — there is no single
 * "continuous longitude / (30/n)" shortcut that is valid across all
 * vargas. D9's classical modality-based rule happens to coincide with
 * pure continuous counting; most others (D3, D4, D12, ...) do not, so
 * each scheme below is modelled explicitly rather than approximated.
 *
 * D16/D20/D24/D27/D30/D60 are intentionally out of scope for this file —
 * D30 and D60 in particular use non-uniform / less-consensal formulas and
 * should land behind reference-chart verification (see project plan).
 */

const MODALITY: ReadonlyArray<'movable' | 'fixed' | 'dual'> = [
  'movable', 'fixed', 'dual', 'movable', 'fixed', 'dual',
  'movable', 'fixed', 'dual', 'movable', 'fixed', 'dual',
];

/** Odd-numbered signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius) are at even array indices. */
const isOddSign = (sign: number): boolean => sign % 2 === 0;

export type VargaDivision = 2 | 3 | 4 | 7 | 9 | 10 | 12;

export const VARGA_LABELS: Record<VargaDivision, string> = {
  2: 'D2 · Hora',
  3: 'D3 · Drekkana',
  4: 'D4 · Chaturthamsa',
  7: 'D7 · Saptamsha',
  9: 'D9 · Navamsa',
  10: 'D10 · Dasamsha',
  12: 'D12 · Dwadashamsha',
};

/** Starting sign (0..11) for the given division's part-numbering, applied to `sign`. */
function startingSign(division: VargaDivision, sign: number): number {
  switch (division) {
    case 3: // Drekkana — always starts at the sign itself (trine counting from there).
    case 12: // Dwadashamsha — always starts at the sign itself.
      return sign;
    case 4: // Chaturthamsa — always starts at the sign itself (kendra counting from there).
      return sign;
    case 7: // Saptamsha — odd signs start at themselves; even signs start at the 7th sign from them.
      return isOddSign(sign) ? sign : (sign + 6) % 12;
    case 9: { // Navamsa — movable starts at itself, fixed at the 9th, dual at the 5th.
      const modality = MODALITY[sign]!;
      if (modality === 'movable') return sign;
      if (modality === 'fixed') return (sign + 8) % 12;
      return (sign + 4) % 12;
    }
    case 10: // Dasamsha — odd signs start at themselves; even signs start at the 9th sign from them.
      return isOddSign(sign) ? sign : (sign + 8) % 12;
    default:
      return sign;
  }
}

/**
 * Signs advanced per part, from the starting sign. D3 (trine) and D4 (kendra)
 * do not walk consecutive signs — they step by the trine/kendra spacing.
 */
function stepSize(division: VargaDivision): number {
  if (division === 3) return 4; // trine: same, 5th (+4), 9th (+8)
  if (division === 4) return 3; // kendra: same, 4th (+3), 7th (+6), 10th (+9)
  return 1;
}

/** Part index (0-based) within the sign for the given division, from degrees-in-sign (0..30). */
function partIndex(division: VargaDivision, degInSign: number): number {
  const partSize = 30 / division;
  return Math.min(division - 1, Math.floor(degInSign / partSize));
}

/**
 * D2 (Hora) is a binary chart — every sign resolves to either Cancer (Moon's
 * hora) or Leo (Sun's hora). Odd signs: 0-15° Leo, 15-30° Cancer.
 * Even signs: 0-15° Cancer, 15-30° Leo.
 */
const CANCER = 3;
const LEO = 4;
function horaSign(sign: number, degInSign: number): number {
  const firstHalf = degInSign < 15;
  const oddSign = isOddSign(sign);
  if (oddSign) return firstHalf ? LEO : CANCER;
  return firstHalf ? CANCER : LEO;
}

/** Resolve the varga sign (0..11) for a given absolute sidereal longitude. */
export function vargaSignOf(division: VargaDivision, siderealLon: number): number {
  const lon = norm360(siderealLon);
  const sign = Math.floor(lon / 30);
  const degInSign = lon % 30;
  if (division === 2) return horaSign(sign, degInSign);
  const start = startingSign(division, sign);
  const part = partIndex(division, degInSign);
  return (start + part * stepSize(division)) % 12;
}

/**
 * Build a full divisional chart (lagna + 12 houses + lords + occupants),
 * applying the same varga formula to the ascendant's longitude that is
 * applied to each planet — mirrors how assembleChartFacts derives D1.
 */
export function buildDivisionalChart(
  division: VargaDivision,
  sidereal: Record<PlanetName, number>,
  ascendantLon: number,
): DivisionalChart {
  const lagnaSign = vargaSignOf(division, ascendantLon);

  const planets = {} as Record<PlanetName, { sign: number; house: number }>;
  for (const name of PLANET_ORDER) {
    const sign = vargaSignOf(division, sidereal[name]);
    planets[name] = { sign, house: ((sign - lagnaSign + 12) % 12) + 1 };
  }

  const houses: DivisionalHouse[] = [];
  for (let h = 1; h <= 12; h += 1) {
    const sign = (lagnaSign + h - 1) % 12;
    houses.push({
      house: h,
      sign,
      lord: SIGN_LORD[sign]!,
      occupants: PLANET_ORDER.filter((p) => planets[p].house === h),
    });
  }

  return { division, label: VARGA_LABELS[division], lagnaSign, planets, houses };
}

/** Build every varga in this module's scope from one set of longitudes. */
export function buildAllDivisionalCharts(
  sidereal: Record<PlanetName, number>,
  ascendantLon: number,
): Record<string, DivisionalChart> {
  const divisions: VargaDivision[] = [2, 3, 4, 7, 9, 10, 12];
  const result: Record<string, DivisionalChart> = {};
  for (const d of divisions) {
    result[`D${d}`] = buildDivisionalChart(d, sidereal, ascendantLon);
  }
  return result;
}
