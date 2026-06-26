import type { PlanetName } from '@/types/chart';

const EXALTATION: Partial<Record<PlanetName, number>> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
const OWN_SIGNS: Partial<Record<PlanetName, number[]>> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};

export type Dignity = 'exalted' | 'debilitated' | 'own' | 'neutral';

export function dignityOf(planet: PlanetName, sign: number): Dignity {
  const exalt = EXALTATION[planet];
  if (exalt !== undefined) {
    if (exalt === sign) return 'exalted';
    if ((exalt + 6) % 12 === sign) return 'debilitated';
  }
  if ((OWN_SIGNS[planet] ?? []).includes(sign)) return 'own';
  return 'neutral';
}
