/**
 * Named entity "slots" used to build pattern templates (see registry.ts).
 * A slot is just a list of surface forms an entity can take; the template
 * compiler turns `{PLANET}` etc. into a capturing alternation group. Keeping
 * these lists here (not inline in regexes) is what lets the registry stay
 * data, not code: adding a nakshatra or a secondary point never touches the
 * matching engine.
 */
import { PLANETS, SIGNS, NAKSHATRAS } from '../categories';

export { PLANETS, SIGNS, NAKSHATRAS };

/** Classical sub-points (upagrahas) — explicitly NOT navagraha. Recognized as condition subjects but kept out of RuleDimensions.planets so the by-planet index stays the 9 true grahas only. */
export const SECONDARY_POINTS = ['Gulika', 'Mandi', 'Dhuma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu'];

export const WORD_ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6,
  seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
};

export function ordinalToHouseNum(raw: string): number | null {
  const lower = raw.toLowerCase();
  const digitMatch = lower.match(/^(\d+)/);
  if (digitMatch) return Number(digitMatch[1]);
  return WORD_ORDINALS[lower] ?? null;
}

const DIGIT_ORDINAL = '(?:1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)';
const WORD_ORDINAL = `(?:${Object.keys(WORD_ORDINALS).join('|')})`;

/**
 * Slot name -> alternation source (no surrounding parens; the template
 * compiler wraps each substitution in its own capture group). Every slot
 * used in a pattern template must be listed here.
 */
export const SLOT_SOURCES: Record<string, string> = {
  PLANET: PLANETS.join('|'),
  // "subject of a placement/aspect statement" — a true graha OR a recognized secondary point.
  SUBJECT: [...PLANETS, ...SECONDARY_POINTS].join('|'),
  SECONDARY_POINT: SECONDARY_POINTS.join('|'),
  ORDINAL: `${DIGIT_ORDINAL}|${WORD_ORDINAL}`,
  SIGN: SIGNS.join('|'),
  NAKSHATRA: NAKSHATRAS.join('|'),
  DIGNITY: 'exalted|debilitated|own\\s+house|own\\s+sign|moolatrikona',
  PLACEMENT_VERB:
    'occupies|occupy|occupying|is\\s+in|placed\\s+in|posited\\s+in|situated\\s+in|located\\s+in|stationed\\s+in|falls?\\s+in',
  CONJUNCTION_VERB: 'conjoined|conjunct|combust|combine[sd]?|combining|joined|together\\s+with|along\\s+with',
  DASHA_WORD: 'dasha|dasa|mahadasha|mahadasa|bhukti|antardasha|antardasa',
  YOGA_FORMATION_VERB:
    'born\\s+in|is\\s+formed|are\\s+formed|is\\s+caused|results?\\s+in|causes?|occurs?|forms?|gives?\\s+rise\\s+to|leads?\\s+to',
};
