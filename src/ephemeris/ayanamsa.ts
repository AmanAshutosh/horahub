// Lahiri ayanāṁśa (linear precession model). At J2000.0 ≈ 23.853°,
// advancing ~50.29"/yr. Accurate to well within a nakṣatra boundary.
export function lahiriAyanamsa(schlyterDay: number): number {
  const jd = 2451543.5 + schlyterDay;
  const years = (jd - 2451545.0) / 365.25;
  return 23.853 + years * (50.29 / 3600);
}
