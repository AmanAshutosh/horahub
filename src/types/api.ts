import type { ChartFacts } from './chart';
import type { ReadingSection } from './reading';

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
