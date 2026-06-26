import type { PlanetName } from '@/types/chart';
import planetData from './rules/planet-significations.json';
import houseData from './rules/house-significations.json';
import type { HouseRule, KnowledgeBase, PlanetRule } from './types';

/** Load and index the active knowledge base from versioned rule files. */
export function loadKnowledgeBase(): KnowledgeBase {
  const planets = {} as Record<PlanetName, PlanetRule>;
  for (const rule of planetData.rules as PlanetRule[]) {
    planets[rule.planet] = rule;
  }
  const houses: Record<number, HouseRule> = {};
  for (const rule of houseData.rules as HouseRule[]) {
    houses[rule.house] = rule;
  }
  return { version: planetData.kbVersion, planets, houses };
}

export type { KnowledgeBase, PlanetRule, HouseRule } from './types';
