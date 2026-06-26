import { describe, expect, it } from 'vitest';
import { buildVimshottari } from '@/ephemeris';

describe('Vimśottari daśā', () => {
  it('runs the nine full mahādaśās to exactly 120 years', () => {
    // periods[0] is the partial balance of the birth daśā; the nine full
    // periods that follow form one complete 120-year Vimśottari cycle.
    const tree = buildVimshottari(35.7, Date.UTC(1998, 7, 15, 9, 0));
    const fullPeriods = tree.periods.slice(1);
    const years =
      (fullPeriods[fullPeriods.length - 1]!.endMs - fullPeriods[0]!.startMs) /
      (365.25 * 24 * 3600 * 1000);
    expect(Math.round(years)).toBe(120);
  });

  it('selects a current mahādaśā and antardaśā for a living chart', () => {
    const tree = buildVimshottari(35.7, Date.UTC(1998, 7, 15, 9, 0));
    expect(tree.currentMahaIndex).toBeGreaterThanOrEqual(0);
    expect(tree.antardashas.length).toBe(9);
  });
});
