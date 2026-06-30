import type { ChartFacts } from './chart';
import type { ReadingSection } from './reading';
import type { ReportSectionData } from './report';

export interface GenerateChartRequest {
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string; // YYYY-MM-DD (local)
  birthTime: string; // HH:mm (local)
  placeName: string;
  latitude: number;
  longitude: number;
  tzName: string; // IANA
}

export interface GenerateChartResponse {
  chartId: string;
  facts: ChartFacts;
  reading: ReadingSection[];
  /**
   * Inference Engine output — ReportSectionData[] for each life domain.
   * Absent until the KB graph has been built (npm run kg:build).
   * When absent, report sections render as "Pending Knowledge Engine".
   */
  sections?: ReportSectionData[];
  kbVersion: string;
  resolved: { utcOffset: string; coordinates: { lat: number; lon: number } };
}

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  admin2?: string;
  timezone: string;
  population?: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
