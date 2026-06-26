const NAK_SIZE = 360 / 27;
const PADA_SIZE = NAK_SIZE / 4;

export interface NakshatraInfo {
  index: number; // 0..26
  pada: number; // 1..4
  withinDeg: number; // degrees traversed inside the nakṣatra
  fraction: number; // 0..1 fraction of the nakṣatra traversed
}

export function nakshatraOf(siderealLon: number): NakshatraInfo {
  const index = Math.floor(siderealLon / NAK_SIZE);
  const withinDeg = siderealLon - index * NAK_SIZE;
  const pada = Math.floor(withinDeg / PADA_SIZE) + 1;
  return { index, pada, withinDeg, fraction: withinDeg / NAK_SIZE };
}

/** Navāṁśa (D9) sign index 0..11 — uniform formula valid for all signs. */
export function navamsaSign(siderealLon: number): number {
  return Math.floor(siderealLon / (10 / 3)) % 12;
}
