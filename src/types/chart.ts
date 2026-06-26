export type PlanetName =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

export type Dignity = 'exalted' | 'debilitated' | 'own' | 'neutral';

export interface PlanetPlacement {
  siderealLon: number;
  sign: number; // 0..11
  degInSign: number;
  house: number; // 1..12 (whole-sign from Lagna)
  nakshatra: number; // 0..26
  pada: number; // 1..4
  navamsaSign: number; // 0..11
  dignity: Dignity;
}

export interface HousePlacement {
  house: number; // 1..12
  sign: number; // 0..11
  lord: PlanetName;
  occupants: PlanetName[];
}

export interface DashaPeriod {
  lord: string;
  startMs: number;
  endMs: number;
  years: number;
  partial?: boolean;
}

export interface ChartFacts {
  ayanamsa: number;
  ascendant: { sign: number; degree: number };
  lagnaSign: number;
  moon: { sign: number; nakshatra: number; pada: number };
  planets: Record<PlanetName, PlanetPlacement>;
  houses: HousePlacement[];
  dasha: {
    periods: DashaPeriod[];
    antardashas: DashaPeriod[];
    currentMahaIndex: number;
    currentAntarIndex: number;
  };
}

/** Normalized, timezone-resolved birth input that the engine consumes. */
export interface BirthInput {
  utcMs: number; // resolved UTC instant of birth
  latitude: number;
  longitude: number;
}
