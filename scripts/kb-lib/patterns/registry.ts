/**
 * The Pattern Registry: every condition-extraction rule the parser knows is
 * one entry in PATTERN_REGISTRY below, not an inline regex inside parser
 * logic. kb-encode.ts never builds a regex itself — it calls
 * `matchAllPatterns(text)` and records whichever pattern IDs fired.
 *
 * Two kinds of entry:
 *   - 'template': a single slot-templated regex (see slots.ts for the named
 *     entity lists a {SLOT} token expands to). Covers the large majority of
 *     linguistic variation through optional groups and alternation, e.g.
 *     {PLACEMENT_VERB} alone expands to "occupies|is in|placed in|...".
 *   - 'custom': the handful of constructs that aren't well-expressed as a
 *     single regex (counting 2+ distinct planets, the "Planet-Planet" dasha
 *     shorthand gated on nearby period words). Still one declarative record
 *     with an id, description, and conditionType — just backed by a small
 *     matcher function instead of a template string.
 *
 * `mutuallyExclusiveWith` lets a lower-precedence pattern defer to one
 * that already matched in the same sentence (e.g. don't read "Mars in
 * Leo" as a sign-placement once the house-placement pattern already
 * claimed it), without the engine hardcoding that relationship.
 */
import { SLOT_SOURCES, ordinalToHouseNum, PLANETS, SECONDARY_POINTS } from './slots';
import type { ConditionType, RuleCondition } from '../rule-schema';

export interface PatternMatch {
  condition: RuleCondition;
}

export interface PatternRuleBase {
  id: string;
  conditionType: ConditionType;
  description: string;
  /** Example phrasings this pattern is designed to cover — documentation, not matching logic. */
  variants: string[];
  mutuallyExclusiveWith?: string[];
}

export interface TemplatePatternRule extends PatternRuleBase {
  kind: 'template';
  /** A string with {SLOT_NAME} tokens (see slots.ts SLOT_SOURCES). Repeat a slot with a numeric suffix, e.g. {PLANET} and {PLANET2}, to capture two distinct instances. */
  template: string;
  /** Plain substrings; at least one must appear (case-insensitively, as a whole word) in the sentence for this pattern to be allowed to fire. Use to gate an otherwise-generic template (e.g. require a dasha word before accepting "Planet-Planet" shorthand). */
  requiresAnyOf?: string[];
  extract: (groups: Record<string, string | undefined>, fullMatch: string) => Omit<RuleCondition, 'type' | 'raw'> | null;
}

export interface CustomPatternRule extends PatternRuleBase {
  kind: 'custom';
  match: (text: string) => Omit<RuleCondition, 'type' | 'raw'> & { raw: string } | null;
}

/**
 * Looser recall-oriented fallback: each named slot must match SOMEWHERE in
 * the sentence (no adjacency requirement between them), gated by at least
 * one of `requiresAnyOf`. Lower precision than a 'template' adjacency match
 * by design — pair it with `mutuallyExclusiveWith` pointing at the stricter
 * template pattern for the same conditionType so the precise match always
 * wins when both could fire.
 */
export interface CooccurrencePatternRule extends PatternRuleBase {
  kind: 'cooccurrence';
  slots: string[];
  requiresAnyOf: string[];
  extract: (slotValues: Record<string, string>) => Omit<RuleCondition, 'type' | 'raw'> | null;
}

export type PatternRule = TemplatePatternRule | CustomPatternRule | CooccurrencePatternRule;

interface CompiledTemplate {
  regex: RegExp;
  groupNames: string[]; // index 0 unused (matches m[0]); groupNames[i] = slot name for capture group i
}

function compileTemplate(template: string): CompiledTemplate {
  const groupNames: string[] = [];
  const source = template.replace(/\{(\w+)\}/g, (_, slotToken: string) => {
    const slotBase = slotToken.replace(/\d+$/, '');
    const slotSource = SLOT_SOURCES[slotBase];
    if (!slotSource) throw new Error(`Unknown pattern slot: {${slotToken}}`);
    groupNames.push(slotToken);
    return `(${slotSource})`;
  });
  return { regex: new RegExp(source, 'i'), groupNames };
}

function hasAnyWord(text: string, words: string[]): boolean {
  return words.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));
}

const compiledCache = new Map<string, CompiledTemplate>();
function getCompiled(rule: TemplatePatternRule): CompiledTemplate {
  if (!compiledCache.has(rule.id)) compiledCache.set(rule.id, compileTemplate(rule.template));
  return compiledCache.get(rule.id)!;
}

export const PATTERN_REGISTRY: PatternRule[] = [
  {
    id: 'PLANET_DIGNITY',
    kind: 'template',
    conditionType: 'planet-dignity',
    description: 'A planet explicitly stated to be exalted, debilitated, in its own house/sign, or in Moolatrikona.',
    variants: ['Mercury is exalted', 'Saturn debilitated', 'Sun in his own house', "Mars's Moolatrikona"],
    template: '{SUBJECT}\\b[^.]{0,25}\\b{DIGNITY}\\b',
    extract: (g) => ({ planet: g.SUBJECT, dignity: g.DIGNITY!.toLowerCase().replace(/\s+/g, '-') }),
  },
  {
    id: 'PLANET_HOUSE_PLACEMENT',
    kind: 'template',
    conditionType: 'planet-in-house',
    description: 'A planet (or secondary point) placed in a numbered house, with or without the word "house" present.',
    variants: ['occupies the 4th house', 'occupies the 4th', 'is in the 4th house', 'placed in the 4th', 'located in the fourth house'],
    template: '{SUBJECT}\\b[^.]{0,15}\\b(?:{PLACEMENT_VERB})\\s+(?:the\\s+|his\\s+|her\\s+)?{ORDINAL}\\b(?:\\s+(?:house|bhava))?',
    extract: (g) => {
      const house = ordinalToHouseNum(g.ORDINAL!);
      if (house == null) return null;
      return { planet: g.SUBJECT, house, isSecondaryPoint: SECONDARY_POINTS.includes(g.SUBJECT!) || undefined };
    },
  },
  {
    id: 'PLANET_LAGNA_PLACEMENT',
    kind: 'template',
    conditionType: 'planet-in-house',
    description: 'A planet placed in the Lagna/Ascendant — a synonym for the 1st house that does not take a "house" suffix.',
    variants: ['Mars occupy the Lagna', 'Saturn in the Ascendant'],
    template: '{SUBJECT}\\b[^.]{0,15}\\b(?:{PLACEMENT_VERB})\\s+(?:the\\s+)?(lagna|ascendant)\\b',
    extract: (g) => ({ planet: g.SUBJECT, house: 1, isSecondaryPoint: SECONDARY_POINTS.includes(g.SUBJECT!) || undefined }),
  },
  {
    id: 'PLANET_IN_SIGN',
    kind: 'template',
    conditionType: 'planet-in-sign',
    description: 'A planet placed in a named sign — only when no house/Lagna placement already claimed this sentence.',
    variants: ['Mars in Aries', 'Saturn occupies Taurus'],
    template: '{SUBJECT}\\b[^.]{0,15}\\b(?:{PLACEMENT_VERB})\\s+(?:the\\s+sign\\s+of\\s+)?{SIGN}\\b',
    mutuallyExclusiveWith: ['PLANET_HOUSE_PLACEMENT', 'PLANET_LAGNA_PLACEMENT'],
    extract: (g) => ({ planet: g.SUBJECT, sign: g.SIGN }),
  },
  {
    id: 'PLANET_HOUSE_COOCCURRENCE',
    kind: 'cooccurrence',
    conditionType: 'planet-in-house',
    description: 'Recall fallback: a planet and a house number both appear in the sentence with a placement verb present somewhere, without requiring them to sit next to each other. Lower precision than PLANET_HOUSE_PLACEMENT — only fires when that stricter pattern didn\'t.',
    variants: ['planet and house mentioned anywhere in the same sentence alongside a placement verb'],
    slots: ['SUBJECT', 'ORDINAL'],
    requiresAnyOf: SLOT_SOURCES.PLACEMENT_VERB!.split('|'),
    mutuallyExclusiveWith: ['PLANET_HOUSE_PLACEMENT', 'PLANET_LAGNA_PLACEMENT'],
    extract: (g) => {
      const house = ordinalToHouseNum(g.ORDINAL!);
      return house == null ? null : { planet: g.SUBJECT, house, isSecondaryPoint: SECONDARY_POINTS.includes(g.SUBJECT!) || undefined };
    },
  },
  {
    id: 'PLANET_SIGN_COOCCURRENCE',
    kind: 'cooccurrence',
    conditionType: 'planet-in-sign',
    description: 'Recall fallback for planet-in-sign — same loosening as PLANET_HOUSE_COOCCURRENCE.',
    variants: ['planet and sign mentioned anywhere in the same sentence alongside a placement verb'],
    slots: ['SUBJECT', 'SIGN'],
    requiresAnyOf: SLOT_SOURCES.PLACEMENT_VERB!.split('|'),
    mutuallyExclusiveWith: ['PLANET_HOUSE_PLACEMENT', 'PLANET_LAGNA_PLACEMENT', 'PLANET_IN_SIGN', 'PLANET_HOUSE_COOCCURRENCE'],
    extract: (g) => ({ planet: g.SUBJECT, sign: g.SIGN }),
  },
  {
    id: 'PLANET_IN_NAKSHATRA',
    kind: 'template',
    conditionType: 'nakshatra-placement',
    description: 'A planet placed in a named nakshatra.',
    variants: ['Moon in Ashwini', 'Sun occupies Bharani'],
    template: '{SUBJECT}\\b[^.]{0,15}\\b(?:{PLACEMENT_VERB})\\s+(?:the\\s+)?{NAKSHATRA}\\b',
    extract: (g) => ({ planet: g.SUBJECT, nakshatra: g.NAKSHATRA }),
  },
  {
    id: 'PLANET_NAKSHATRA_COOCCURRENCE',
    kind: 'cooccurrence',
    conditionType: 'nakshatra-placement',
    description: 'Recall fallback for nakshatra-placement — same loosening as PLANET_HOUSE_COOCCURRENCE.',
    variants: ['planet and nakshatra mentioned anywhere in the same sentence alongside a placement verb'],
    slots: ['SUBJECT', 'NAKSHATRA'],
    requiresAnyOf: SLOT_SOURCES.PLACEMENT_VERB!.split('|'),
    mutuallyExclusiveWith: ['PLANET_IN_NAKSHATRA'],
    extract: (g) => ({ planet: g.SUBJECT, nakshatra: g.NAKSHATRA }),
  },
  {
    id: 'PLANET_PAIR_CONJUNCTION',
    kind: 'template',
    conditionType: 'planet-conjunction',
    description: 'Two named planets explicitly conjoined/combust/together.',
    variants: ['Mars conjunct Saturn', 'Sun combust with Mercury', 'Venus together with Jupiter'],
    template: '{PLANET}\\b[^.]{0,30}\\b(?:{CONJUNCTION_VERB})\\b[^.]{0,15}\\b{PLANET2}\\b',
    extract: (g) => ({ planet: g.PLANET }),
  },
  {
    id: 'MULTI_PLANET_HOUSE_COMBINATION',
    kind: 'custom',
    conditionType: 'planet-conjunction',
    description: '3+ named planets stated to combine/join in a single house, Rasi, or Amsa — a classical multi-graha yoga shape distinct from a simple pair conjunction.',
    variants: ['the Moon, Mars and Mercury combine in a single house', 'the Sun, Mars and Saturn occupy ... together'],
    match: (text) => {
      const planetMatches = [...text.matchAll(new RegExp(`\\b(${PLANETS.join('|')})\\b`, 'gi'))];
      const distinctPlanets = [...new Set(planetMatches.map((m) => m[1]!))];
      if (distinctPlanets.length < 3) return null;
      if (!hasAnyWord(text, ['combine', 'combines', 'combined', 'combining', 'joined', 'together'])) return null;
      if (!hasAnyWord(text, ['house', 'bhava', 'rasi', 'sign', 'amsa', 'navamsa'])) return null;
      return { planet: distinctPlanets[0], raw: distinctPlanets.join('+') };
    },
  },
  {
    id: 'HOUSE_LORD_STRENGTH',
    kind: 'template',
    conditionType: 'house-lord-strength',
    description: 'The lord of a numbered house referenced as a condition subject (strength, placement, etc. of that lord).',
    variants: ['5th lord', 'lord of the 7th', 'tenth lord'],
    template: '{ORDINAL}\\s+lord\\b',
    extract: (g) => {
      const house = ordinalToHouseNum(g.ORDINAL!);
      return house == null ? null : { house };
    },
  },
  {
    id: 'DASHA_PERIOD',
    kind: 'template',
    conditionType: 'dasha-period',
    description: 'A planet\'s mahadasha/antardasha/bhukti, in either word order.',
    variants: ["Mars's dasha", 'During the Dasa of Mars', 'In the Dasa of Mars', 'Under the Dasa of Mars', 'Mars Bhukti'],
    template: "(?:{PLANET}\\s*['']?s?\\s+(?:{DASHA_WORD})|(?:during|in|under)\\s+the\\s+(?:{DASHA_WORD})\\s+of\\s+{PLANET2})\\b",
    extract: (g) => ({ planet: g.PLANET ?? g.PLANET2 }),
  },
  {
    id: 'DASHA_SHORTHAND_PAIR',
    kind: 'template',
    conditionType: 'dasha-period',
    description: 'The "Mahadasha-Antardasha" shorthand (e.g. "Rahu-Venus"), only accepted when the sentence also names a period explicitly.',
    variants: ['died during Rahu-Venus', 'Saturn-Mercury bhukti'],
    template: '\\b{PLANET}-{PLANET2}\\b',
    requiresAnyOf: ['dasha', 'dasa', 'bhukti', 'antardasha', 'antardasa', 'period', 'mahadasha', 'mahadasa'],
    extract: (g) => ({ planet: g.PLANET, antardashaPlanet: g.PLANET2 }),
  },
  {
    id: 'PLANET_ASPECTED_BY_NAMED',
    kind: 'template',
    conditionType: 'planet-aspect',
    description: 'A planet explicitly stated to be aspected by a named planet — specific enough to compare across rules.',
    variants: ['Moon aspected by Jupiter', 'aspected by Mars'],
    template: '{SUBJECT}\\b[^.]{0,30}\\baspected\\s+by\\s+{PLANET2}\\b',
    extract: (g) => ({ planet: g.SUBJECT, aspectingPlanet: g.PLANET2 }),
  },
  {
    id: 'PLANET_ASPECT_GENERIC',
    kind: 'template',
    conditionType: 'planet-aspect',
    description: 'A planet stated to be aspected without naming the aspecting planet — kept for dimension/index coverage, but too generic for cross-book conflict comparison (see kb-conflicts.ts).',
    variants: ['Moon aspected', 'Saturn aspects the Lagna'],
    template: '{SUBJECT}\\b[^.]{0,25}\\b(?:aspect|aspects|aspected|aspecting|drishti)\\b',
    mutuallyExclusiveWith: ['PLANET_ASPECTED_BY_NAMED'],
    extract: (g) => ({ planet: g.SUBJECT }),
  },
  {
    id: 'PLANET_ASPECT_COOCCURRENCE',
    kind: 'cooccurrence',
    conditionType: 'planet-aspect',
    description: 'Recall fallback: a planet and an aspect word both appear somewhere in the sentence without the 25-character adjacency PLANET_ASPECT_GENERIC requires.',
    variants: ['planet and "aspect"/"drishti" mentioned anywhere in the same sentence'],
    slots: ['SUBJECT'],
    requiresAnyOf: ['aspect', 'aspects', 'aspected', 'aspecting', 'drishti'],
    mutuallyExclusiveWith: ['PLANET_ASPECTED_BY_NAMED', 'PLANET_ASPECT_GENERIC'],
    extract: (g) => ({ planet: g.SUBJECT }),
  },
  {
    id: 'PLANET_DIGNITY_COOCCURRENCE',
    kind: 'cooccurrence',
    conditionType: 'planet-dignity',
    description: 'Recall fallback: a planet and a dignity word both appear somewhere in the sentence without the 25-character adjacency PLANET_DIGNITY requires.',
    variants: ['planet and "exalted"/"debilitated"/etc. mentioned anywhere in the same sentence'],
    slots: ['SUBJECT', 'DIGNITY'],
    requiresAnyOf: SLOT_SOURCES.DIGNITY!.split('|'),
    mutuallyExclusiveWith: ['PLANET_DIGNITY'],
    extract: (g) => ({ planet: g.SUBJECT, dignity: g.DIGNITY!.toLowerCase().replace(/\s+/g, '-') }),
  },
  {
    id: 'YOGA_NAMED_FORMATION',
    kind: 'template',
    conditionType: 'yoga-presence',
    description: 'A named Yoga ("X Yoga") alongside formation language (born in, results in, causes, etc.). Tolerates a trailing parenthesis from OCR\'d alternate spellings, e.g. "(Durudhura) Yoga".',
    variants: ['born in Gajakesari Yoga', 'Raja Yoga results in', 'the Durudhura) Yoga'],
    template: '([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})\\)?\\s+Yoga\\b',
    requiresAnyOf: [
      'born in', 'is formed', 'are formed', 'is caused', 'results in', 'result in',
      'causes', 'cause', 'occurs', 'forms', 'gives rise to', 'leads to',
    ],
    extract: (g, fullMatch) => ({ yoga: `${fullMatch.replace(/\)?\s+Yoga$/i, '')} Yoga`.replace(/\s+/g, ' ') }),
  },
  {
    id: 'YOGA_DECLARED',
    kind: 'template',
    conditionType: 'yoga-presence',
    description: 'The "the Yoga is/produced is/called <Name>" declaration form, which doesn\'t need separate formation language since the declaration itself is the formation statement.',
    variants: ['the Yoga is Chakra', 'the Yoga produced is Ubhayachari', 'the yoga called Pushkala'],
    template: '\\bthe\\s+yoga\\s+(?:is|produced\\s+is|called)\\s+([A-Z][a-zA-Z\\-]+)',
    extract: (g, fullMatch) => {
      const m = fullMatch.match(/\b(?:is|produced\s+is|called)\s+([A-Z][a-zA-Z-]+)/i);
      return m ? { yoga: `${m[1]} Yoga` } : null;
    },
  },
];

export interface PatternFire {
  patternId: string;
  condition: RuleCondition;
}

export interface MatchAllResult {
  conditions: RuleCondition[];
  firedPatternIds: string[];
  /** Parallel to the above, but pairs each condition with the exact pattern that produced it — use this when you need the correspondence (e.g. sampling). */
  matches: PatternFire[];
}

export function matchAllPatterns(text: string): MatchAllResult {
  const matches: PatternFire[] = [];
  const fired = new Set<string>();

  for (const rule of PATTERN_REGISTRY) {
    if (rule.mutuallyExclusiveWith?.some((id) => fired.has(id))) continue;

    if (rule.kind === 'template') {
      if (rule.requiresAnyOf && !hasAnyWord(text, rule.requiresAnyOf)) continue;
      const { regex, groupNames } = getCompiled(rule);
      const m = text.match(regex);
      if (!m) continue;
      const groups: Record<string, string | undefined> = {};
      groupNames.forEach((name, i) => {
        groups[name] = m[i + 1];
      });
      const partial = rule.extract(groups, m[0]);
      if (!partial) continue;
      matches.push({ patternId: rule.id, condition: { type: rule.conditionType, raw: m[0], ...partial } });
      fired.add(rule.id);
    } else if (rule.kind === 'cooccurrence') {
      if (!hasAnyWord(text, rule.requiresAnyOf)) continue;
      const slotValues: Record<string, string> = {};
      let allSlotsMatched = true;
      for (const slotName of rule.slots) {
        const slotBase = slotName.replace(/\d+$/, '');
        const source = SLOT_SOURCES[slotBase];
        if (!source) throw new Error(`Unknown pattern slot: ${slotName}`);
        const m = text.match(new RegExp(`\\b(${source})\\b`, 'i'));
        if (!m) {
          allSlotsMatched = false;
          break;
        }
        slotValues[slotName] = m[1]!;
      }
      if (!allSlotsMatched) continue;
      const partial = rule.extract(slotValues);
      if (!partial) continue;
      const raw = Object.values(slotValues).join(' ... ');
      matches.push({ patternId: rule.id, condition: { type: rule.conditionType, raw, ...partial } });
      fired.add(rule.id);
    } else {
      const result = rule.match(text);
      if (!result) continue;
      const { raw, ...partial } = result;
      matches.push({ patternId: rule.id, condition: { type: rule.conditionType, raw, ...partial } });
      fired.add(rule.id);
    }
  }

  return { conditions: matches.map((m) => m.condition), firedPatternIds: matches.map((m) => m.patternId), matches };
}
