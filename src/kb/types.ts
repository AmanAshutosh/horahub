import type { PlanetName } from '@/types/chart';

export interface PlanetRule {
  ruleKey: string;
  planet: PlanetName;
  themes: string;
  source: { work: string; ref: string; tradition: string; text: string };
}

export interface HouseRule {
  ruleKey: string;
  house: number;
  title: string;
  themes: string;
}

export interface KnowledgeBase {
  version: string;
  planets: Record<PlanetName, PlanetRule>;
  houses: Record<number, HouseRule>;
}
