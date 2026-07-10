import type { ChartFacts, PlanetName } from '@/types/chart';
import type { Citation, ReadingItem, ReadingSection } from '@/types/reading';
import type { KnowledgeBase } from '@/kb';
import { signName } from './format';

const PLANET_ORDER: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

function planetCitation(kb: KnowledgeBase, planet: PlanetName): Citation {
  const r = kb.planets[planet];
  return { work: r.source.work, ref: r.source.ref, tradition: r.source.tradition, text: r.source.text };
}

function planetsSection(facts: ChartFacts, kb: KnowledgeBase): ReadingSection {
  const items: ReadingItem[] = PLANET_ORDER.map((p) => {
    const pl = facts.planets[p];
    const rule = kb.planets[p];
    const dignity = pl.dignity !== 'neutral' ? `, ${pl.dignity}` : '';
    return {
      title: `${p} in ${signName(pl.sign)} (House ${pl.house})`,
      body: `Your chart shows ${p} in ${signName(pl.sign)}${dignity}, in house ${pl.house}. This placement indicates ${rule.themes} come through that house's affairs for you — significations classical texts traditionally associate with ${p} in this position.`,
      tags: [pl.dignity],
      citation: planetCitation(kb, p),
    };
  });
  return { id: 'planets', heading: 'Planetary Positions', items };
}

function housesSection(facts: ChartFacts, kb: KnowledgeBase): ReadingSection {
  const items: ReadingItem[] = facts.houses.map((h) => {
    const rule = kb.houses[h.house]!;
    const lordPlacement = facts.planets[h.lord];
    const occ = h.occupants.length ? h.occupants.join(', ') : null;
    const body =
      `In your case, house ${h.house} falls in ${signName(h.sign)}, and its lord ${h.lord} ` +
      `sits in house ${lordPlacement.house} (${signName(lordPlacement.sign)}` +
      `${lordPlacement.dignity !== 'neutral' ? `, ${lordPlacement.dignity}` : ''}). ` +
      (occ
        ? `${occ} occupies this house directly, so their significations colour this area for you.`
        : `No planet occupies this house directly, so the placement of its lord carries the main reading here.`) +
      ` Classical texts traditionally associate this house with ${rule.themes}.`;
    return {
      title: `House ${h.house} · ${rule.title}`,
      body,
      tags: [signName(h.sign), `lord ${h.lord}`],
      citation: {
        work: 'BPHS', ref: 'house chapters', tradition: 'Parashari',
        text: 'House significations per BPHS, encoded in HoraHub\'s own schema.',
      },
    };
  });
  return { id: 'houses', heading: 'Bhāva (House) Reading', items };
}

function dashaEffectsSection(facts: ChartFacts, kb: KnowledgeBase): ReadingSection {
  const { periods, currentMahaIndex } = facts.dasha;
  const start = Math.max(0, currentMahaIndex);
  const items: ReadingItem[] = periods.slice(start, start + 5).map((p, k) => {
    const lord = p.lord as PlanetName;
    const rule = kb.planets[lord];
    const placement = facts.planets[lord];
    const isCurrent = start + k === currentMahaIndex;
    return {
      title: `${p.lord} Mahādaśā${isCurrent ? ' · current' : ''}`,
      body:
        `Your current ${p.lord} period is traditionally associated with ${rule.themes}. ` +
        `In your chart, ${p.lord} sits in ${signName(placement.sign)} (house ${placement.house}` +
        `${placement.dignity !== 'neutral' ? `, ${placement.dignity}` : ''}), so classical texts suggest this period's themes express mainly through house ${placement.house}'s affairs for you.`,
      citation: planetCitation(kb, lord),
      note: 'Signification of the period, not a forecast. Detailed daśā-phala needs BPHS Vol.2 chapters.',
    };
  });
  return { id: 'effects', heading: 'Daśā Effects', items };
}

/**
 * Pure interpretation: (ChartFacts, KnowledgeBase) → ReadingSection[].
 * No I/O, no clock beyond Date.now() inside dasha facts, fully testable.
 * Deliberately emits no fabricated confidence scores.
 */
export function interpret(facts: ChartFacts, kb: KnowledgeBase): ReadingSection[] {
  return [planetsSection(facts, kb), housesSection(facts, kb), dashaEffectsSection(facts, kb)];
}

export { signName, fmtDate } from './format';
