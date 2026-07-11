import type { PlanetName, PlanetPlacement, ShadbalaResult } from '@/types/chart';
import { norm360 } from './math';

/**
 * Shadbala (six-fold planetary strength) — a documented PARTIAL
 * implementation, not textbook-perfect classical precision. This mirrors
 * condition-checker.ts's existing honesty about approximation (it used
 * dignity as a Shadbala stand-in specifically because this didn't exist).
 *
 * Included, computed directly from chart data:
 *  - Sthana Bala:  Uchcha Bala, Kendradi Bala, Ojayugmarasyamsa Bala.
 *  - Dig Bala:     whole-sign house-distance approximation (not exact
 *                   degree-in-house from the four angles).
 *  - Kala Bala:    Paksha Bala only (Sun-Moon elongation / lunar phase).
 *  - Chesta Bala:  a coarse binary approximation from the retrograde flag
 *                   (retrograde vs direct), not true motion-rate vs mean
 *                   motion — we don't track a planet's actual daily speed.
 *  - Naisargika Bala: the fixed classical constant table (exact).
 *
 * Deliberately NOT included (would require data/tables this engine doesn't
 * have, and guessing at them risks silently-wrong "strong/weak" verdicts):
 *  - Saptavargaja Bala (needs a planetary friend/enemy grid per varga —
 *    only dignity, i.e. exalted/own/neutral/debilitated, is available).
 *  - Dina-Ratri Bala, Hora Bala, Ayana Bala, Yuddha Bala (need sunrise or
 *    solar-declination calculations not present in this ephemeris).
 *  - Drik Bala (needs graded, not binary, aspect strength).
 *
 * Because of the above, `totalRupas` is NOT comparable to the classical
 * minimum-required-rupas thresholds (those assume all six limbs are
 * present) — callers must treat this as a *relative* strength signal
 * between planets in the same chart, not an absolute classical verdict.
 */

const CLASSICAL_GRAHAS: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// ── Sthana Bala components ──────────────────────────────────────────────────

/** Exact exaltation longitude (sign*30 + degree), for the 7 classical grahas. */
const EXALTATION_LON: Record<Exclude<PlanetName, 'Rahu' | 'Ketu'>, number> = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200,
};

function uchchaBala(planet: PlanetName, lon: number): number {
  const exalt = EXALTATION_LON[planet as Exclude<PlanetName, 'Rahu' | 'Ketu'>];
  if (exalt === undefined) return 0;
  const debilitation = norm360(exalt + 180);
  const raw = Math.abs(norm360(lon - debilitation));
  const shortArc = raw > 180 ? 360 - raw : raw;
  return (shortArc / 180) * 60;
}

const KENDRA = new Set([1, 4, 7, 10]);
const PANAPHARA = new Set([2, 5, 8, 11]);

function kendradiBala(house: number): number {
  if (KENDRA.has(house)) return 60;
  if (PANAPHARA.has(house)) return 30;
  return 15; // apoklima
}

/** Male grahas gain strength in odd signs, female in even; Mercury/Saturn (neuter) always score full. Rashi-only (does not also weight Navamsa placement). */
const ODD_SIGN_GRAHAS = new Set<PlanetName>(['Sun', 'Mars', 'Jupiter']);
const EVEN_SIGN_GRAHAS = new Set<PlanetName>(['Moon', 'Venus']);
const NEUTER_GRAHAS = new Set<PlanetName>(['Mercury', 'Saturn']);

function ojayugmarasyamsaBala(planet: PlanetName, sign: number): number {
  if (NEUTER_GRAHAS.has(planet)) return 15;
  const isOddSign = sign % 2 === 0; // Aries(0) is the 1st sign = odd
  if (ODD_SIGN_GRAHAS.has(planet)) return isOddSign ? 15 : 0;
  if (EVEN_SIGN_GRAHAS.has(planet)) return !isOddSign ? 15 : 0;
  return 0;
}

// ── Dig Bala ─────────────────────────────────────────────────────────────────

/** House of maximum directional strength per planet; the opposite house (6 away) is weakest. */
const DIG_BALA_STRONGEST_HOUSE: Record<Exclude<PlanetName, 'Rahu' | 'Ketu'>, number> = {
  Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1, Saturn: 7, Moon: 4, Venus: 4,
};

function digBala(planet: PlanetName, house: number): number {
  const strongest = DIG_BALA_STRONGEST_HOUSE[planet as Exclude<PlanetName, 'Rahu' | 'Ketu'>];
  if (strongest === undefined) return 0;
  const weakest = ((strongest + 5) % 12) + 1; // 6 houses opposite
  const distFromWeakest = Math.min(
    Math.abs(house - weakest),
    12 - Math.abs(house - weakest),
  );
  return (distFromWeakest / 6) * 60;
}

// ── Kala Bala (Paksha Bala only) ────────────────────────────────────────────

const PAKSHA_BENEFICS = new Set<PlanetName>(['Moon', 'Mercury', 'Jupiter', 'Venus']);

function pakshaBala(planet: PlanetName, sunLon: number, moonLon: number): number {
  if (planet === 'Rahu' || planet === 'Ketu') return 0;
  const elongation = norm360(moonLon - sunLon);
  const phase = elongation <= 180 ? elongation : 360 - elongation; // 0 (new) .. 180 (full)
  const beneficValue = (phase / 180) * 60;
  return PAKSHA_BENEFICS.has(planet) ? beneficValue : 60 - beneficValue;
}

// ── Chesta Bala (coarse retrograde-based approximation) ────────────────────

const CHESTA_ELIGIBLE = new Set<PlanetName>(['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']);

function chestaBala(planet: PlanetName, retrograde: boolean | undefined): number {
  if (!CHESTA_ELIGIBLE.has(planet)) return 0; // Sun/Moon/nodes have no classical Chesta Bala
  if (retrograde === undefined) return 30; // unknown motion state — neutral default, not a guess either way
  return retrograde ? 60 : 30;
}

// ── Naisargika Bala (fixed classical constants) ─────────────────────────────

const NAISARGIKA_BALA: Record<Exclude<PlanetName, 'Rahu' | 'Ketu'>, number> = {
  Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57,
};

// ── Main export ──────────────────────────────────────────────────────────────

/** Compute the (partial — see module doc) Shadbala for the 7 classical grahas. Pure function. */
export function computeShadbala(planets: Record<PlanetName, PlanetPlacement>): Partial<Record<PlanetName, ShadbalaResult>> {
  const result: Partial<Record<PlanetName, ShadbalaResult>> = {};
  const sunLon = planets.Sun.siderealLon;
  const moonLon = planets.Moon.siderealLon;

  for (const planet of CLASSICAL_GRAHAS) {
    const p = planets[planet];
    const sthanaBala = uchchaBala(planet, p.siderealLon) + kendradiBala(p.house) + ojayugmarasyamsaBala(planet, p.sign);
    const dig = digBala(planet, p.house);
    const kala = pakshaBala(planet, sunLon, moonLon);
    const chesta = chestaBala(planet, p.retrograde);
    const naisargika = NAISARGIKA_BALA[planet as Exclude<PlanetName, 'Rahu' | 'Ketu'>] ?? 0;
    const drik = 0; // not implemented — see module doc

    const totalVirupas = sthanaBala + dig + kala + chesta + naisargika + drik;

    result[planet] = {
      sthanaBala,
      digBala: dig,
      kalaBala: kala,
      chestaBala: chesta,
      naisargikaBala: naisargika,
      drikBala: drik,
      totalRupas: totalVirupas / 60,
      isPartial: true,
    };
  }

  return result;
}

/**
 * Relative strength among the 7 classical grahas in THIS chart — true for
 * planets in the upper half of the partial-Shadbala ranking. This is a
 * within-chart comparison, not a classical absolute-minimum check (see
 * module doc for why an absolute check isn't valid here).
 */
export function isRelativelyStrong(
  planet: PlanetName,
  shadbala: Partial<Record<PlanetName, ShadbalaResult>>,
): boolean | null {
  const target = shadbala[planet];
  if (!target) return null;
  const values = CLASSICAL_GRAHAS.map((p) => shadbala[p]?.totalRupas).filter((v): v is number => v !== undefined);
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  return target.totalRupas >= median;
}
