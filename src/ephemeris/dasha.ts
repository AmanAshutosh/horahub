import type { DashaPeriod } from '@/types/chart';
import { nakshatraOf } from './nakshatra';

// Vimśottari sequence beginning at Aśvinī, with mahādaśā lengths (years).
const VIMSHOTTARI: ReadonlyArray<readonly [string, number]> = [
  ['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7],
  ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17],
];
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const TOTAL_YEARS = 120;
const CHILDREN_PER_NODE = 9;

export interface DashaTree {
  periods: DashaPeriod[];
  /** @deprecated legacy shape — antardashas of the CURRENT mahadasha only. Use `tree` for full coverage. */
  antardashas: DashaPeriod[];
  currentMahaIndex: number;
  /** @deprecated legacy shape, indexes into `antardashas`. Use `currentPath` for full coverage. */
  currentAntarIndex: number;
  /** Full 3-level hierarchy: 9 mahadashas -> 9 antardashas each -> 9 pratyantardashas each. */
  tree: DashaNode[];
  /** Index path to the period containing `now`, at each level (-1 if none found). */
  currentPath: { mahaIndex: number; antarIndex: number; pratyantarIndex: number };
}

export interface DashaNode {
  lord: string;
  startMs: number;
  endMs: number;
  years: number;
  partial?: boolean;
  children?: DashaNode[];
}

/**
 * Divide a period proportionally into 9 Vimśottari sub-periods, cycling the
 * 9-lord sequence starting from `lord` itself. Each child's share of the
 * *parent's actual duration* is proportional to that lord's full classical
 * years out of 120 — the same rule used at every level (mahadasha ->
 * antardasha -> pratyantardasha), applied here generically so it recurses
 * cleanly to a 3rd level.
 */
function subdivide(lord: string, startMs: number, endMs: number, depth: number): DashaNode[] {
  const startIdx = VIMSHOTTARI.findIndex((v) => v[0] === lord);
  const parentDurationMs = endMs - startMs;
  const children: DashaNode[] = [];
  let cursor = startMs;
  for (let k = 0; k < CHILDREN_PER_NODE; k += 1) {
    const [childLord, childYears] = VIMSHOTTARI[(startIdx + k) % CHILDREN_PER_NODE]!;
    const dur = (childYears / TOTAL_YEARS) * parentDurationMs;
    const childEnd = cursor + dur;
    children.push({
      lord: childLord,
      startMs: cursor,
      endMs: childEnd,
      years: childYears,
      children: depth > 0 ? subdivide(childLord, cursor, childEnd, depth - 1) : undefined,
    });
    cursor = childEnd;
  }
  return children;
}

function findCurrent(nodes: DashaNode[], now: number): number {
  return nodes.findIndex((n) => now >= n.startMs && now < n.endMs);
}

/** Build the full Vimśottari mahādaśā / antardaśā / pratyantardaśā tree from Moon's longitude. */
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

  // Legacy flat antardasha array — current mahadasha only, preserved exactly
  // as before (uses the lord's full nominal years for the parent span, not
  // the mahadasha's actual — possibly partial — elapsed span). Kept for
  // backward compatibility with condition-checker.ts / timeline.ts / the UI.
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

  // Full tree — every mahadasha's antardashas, and every antardasha's
  // pratyantardashas, each proportioned against its own parent's actual span.
  const tree: DashaNode[] = periods.map((p) => ({
    lord: p.lord,
    startMs: p.startMs,
    endMs: p.endMs,
    years: p.years,
    partial: p.partial,
    children: subdivide(p.lord, p.startMs, p.endMs, 1),
  }));

  const mahaIndex = findCurrent(tree, now);
  const antarNodes = mahaIndex >= 0 ? tree[mahaIndex]!.children ?? [] : [];
  const antarIndex = findCurrent(antarNodes, now);
  const pratyantarNodes = antarIndex >= 0 ? antarNodes[antarIndex]!.children ?? [] : [];
  const pratyantarIndex = findCurrent(pratyantarNodes, now);

  return {
    periods,
    antardashas,
    currentMahaIndex,
    currentAntarIndex,
    tree,
    currentPath: { mahaIndex, antarIndex, pratyantarIndex },
  };
}
