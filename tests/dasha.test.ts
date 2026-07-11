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

  it('builds a full 3-level tree (10 mahadashas, 9 antardashas each, 9 pratyantardashas each)', () => {
    const { tree } = buildVimshottari(35.7, Date.UTC(1998, 7, 15, 9, 0));
    expect(tree).toHaveLength(10); // partial birth period + 9 full cycles
    for (const maha of tree) {
      expect(maha.children).toHaveLength(9);
      for (const antar of maha.children!) {
        expect(antar.children).toHaveLength(9);
      }
    }
  });

  it('every level of the tree sums exactly to its parent\'s duration, with no gaps or overlaps', () => {
    const { tree } = buildVimshottari(35.7, Date.UTC(1998, 7, 15, 9, 0));
    for (const maha of tree) {
      expect(maha.children![0]!.startMs).toBe(maha.startMs);
      expect(maha.children![8]!.endMs).toBeCloseTo(maha.endMs, 6);
      for (let i = 1; i < 9; i++) {
        expect(maha.children![i]!.startMs).toBeCloseTo(maha.children![i - 1]!.endMs, 6);
      }
      for (const antar of maha.children!) {
        expect(antar.children![0]!.startMs).toBe(antar.startMs);
        expect(antar.children![8]!.endMs).toBeCloseTo(antar.endMs, 6);
      }
    }
  });

  it('resolves a currentPath into the tree that matches currentMahaIndex/currentAntarIndex', () => {
    const facts = buildVimshottari(35.7, Date.UTC(1998, 7, 15, 9, 0));
    expect(facts.currentPath.mahaIndex).toBe(facts.currentMahaIndex);
    expect(facts.currentPath.antarIndex).toBeGreaterThanOrEqual(0);
    expect(facts.currentPath.pratyantarIndex).toBeGreaterThanOrEqual(0);
    const mahaNode = facts.tree[facts.currentPath.mahaIndex]!;
    const antarNode = mahaNode.children![facts.currentPath.antarIndex]!;
    const now = Date.now();
    expect(now).toBeGreaterThanOrEqual(mahaNode.startMs);
    expect(now).toBeLessThan(mahaNode.endMs);
    expect(now).toBeGreaterThanOrEqual(antarNode.startMs);
    expect(now).toBeLessThan(antarNode.endMs);
  });
});
