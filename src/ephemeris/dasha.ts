import type { DashaPeriod } from '@/types/chart';
import { nakshatraOf } from './nakshatra';

// Vimśottari sequence beginning at Aśvinī, with mahādaśā lengths (years).
const VIMSHOTTARI: ReadonlyArray<readonly [string, number]> = [
  ['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7],
  ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17],
];
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const TOTAL_YEARS = 120;

export interface DashaTree {
  periods: DashaPeriod[];
  antardashas: DashaPeriod[];
  currentMahaIndex: number;
  currentAntarIndex: number;
}

/** Build Vimśottari mahādaśā + current-mahādaśā antardaśā from Moon's longitude. */
export function buildVimshottari(moonSiderealLon: number, birthUtcMs: number): DashaTree {
  const nak = nakshatraOf(moonSiderealLon);
  const startLord = nak.index % 9;
  const periods: DashaPeriod[] = [];
  let cursor = birthUtcMs;

  const firstYears = VIMSHOTTARI[startLord]![1] * (1 - nak.fraction);
  let end = cursor + firstYears * YEAR_MS;
  periods.push({ lord: VIMSHOTTARI[startLord]![0], startMs: cursor, endMs: end, years: VIMSHOTTARI[startLord]![1], partial: true });
  cursor = end;
  for (let k = 1; k <= 9; k += 1) {
    const [lord, years] = VIMSHOTTARI[(startLord + k) % 9]!;
    end = cursor + years * YEAR_MS;
    periods.push({ lord, startMs: cursor, endMs: end, years, partial: false });
    cursor = end;
  }

  const now = Date.now();
  const currentMahaIndex = periods.findIndex((p) => now >= p.startMs && now < p.endMs);

  const antardashas: DashaPeriod[] = [];
  if (currentMahaIndex >= 0) {
    const maha = periods[currentMahaIndex]!;
    const mahaYears = VIMSHOTTARI[(startLord + currentMahaIndex) % 9]![1];
    const s = VIMSHOTTARI.findIndex((v) => v[0] === maha.lord);
    let ac = maha.startMs;
    for (let k = 0; k < 9; k += 1) {
      const [lord, years] = VIMSHOTTARI[(s + k) % 9]!;
      const dur = (years / TOTAL_YEARS) * mahaYears * YEAR_MS;
      antardashas.push({ lord, startMs: ac, endMs: ac + dur, years, partial: false });
      ac += dur;
    }
  }
  const currentAntarIndex = antardashas.findIndex((a) => now >= a.startMs && now < a.endMs);

  return { periods, antardashas, currentMahaIndex, currentAntarIndex };
}
