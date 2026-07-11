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
  /** True when the planet was in retrograde motion at this instant. Absent on charts computed before this field existed — treat as unknown, not false. */
  retrograde?: boolean;
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

export interface DashaNode {
  lord: string;
  startMs: number;
  endMs: number;
  years: number;
  partial?: boolean;
  children?: DashaNode[];
}

export interface DivisionalHouse {
  house: number; // 1..12
  sign: number; // 0..11
  lord: PlanetName;
  occupants: PlanetName[];
}

export interface DivisionalChart {
  division: number;
  label: string;
  lagnaSign: number;
  planets: Record<PlanetName, { sign: number; house: number }>;
  houses: DivisionalHouse[];
}

/** Six-fold planetary strength — see src/ephemeris/shadbala.ts for scope (a documented partial implementation). */
export interface ShadbalaResult {
  sthanaBala: number;
  digBala: number;
  kalaBala: number;
  chestaBala: number;
  naisargikaBala: number;
  drikBala: number;
  totalRupas: number;
  isPartial: true;
}

export interface ChartFacts {
  /** Schema version of this object, stamped by assembleChartFacts. Absent = version 1 (legacy, pre-varga/pre-Shadbala). */
  factsVersion?: number;
  ayanamsa: number;
  ascendant: { sign: number; degree: number };
  lagnaSign: number;
  moon: { sign: number; nakshatra: number; pada: number };
  planets: Record<PlanetName, PlanetPlacement>;
  houses: HousePlacement[];
  dasha: {
    periods: DashaPeriod[];
    /** @deprecated legacy shape — current mahadasha's antardashas only. Use `tree` for full coverage. */
    antardashas: DashaPeriod[];
    currentMahaIndex: number;
    /** @deprecated legacy shape, indexes into `antardashas`. Use `currentPath` for full coverage. */
    currentAntarIndex: number;
    /** Full 3-level hierarchy: 9 mahadashas -> 9 antardashas each -> 9 pratyantardashas each. */
    tree: DashaNode[];
    currentPath: { mahaIndex: number; antarIndex: number; pratyantarIndex: number };
  };
  /** Full divisional charts, keyed "D2".."D12" (current coverage — see src/ephemeris/varga.ts). */
  divisionalCharts?: Record<string, DivisionalChart>;
  /** Partial Shadbala per classical graha (Sun..Saturn) — see src/ephemeris/shadbala.ts for scope. */
  shadbala?: Partial<Record<PlanetName, ShadbalaResult>>;
}

/** Normalized, timezone-resolved birth input that the engine consumes. */
export interface BirthInput {
  utcMs: number; // resolved UTC instant of birth
  latitude: number;
  longitude: number;
}
