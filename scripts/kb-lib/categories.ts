/**
 * Expanded, multi-label category triage patterns. A sentence may match zero,
 * one, or several categories. These are a coarse keyword/structure signal
 * used for pre-encoding statistics and as a starting tag set on draft rules —
 * NOT a validated classification. A human reviews and corrects these in the
 * Rule Validation phase.
 */
export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

const nakshatraAlt = NAKSHATRAS.join('|');

export const CATEGORY_PATTERNS: Record<string, RegExp> = {
  career: /\b(career|profession|occupation|livelihood|employment|vocation)\b/i,
  marriage: /\b(marriage|spouse|wife|husband|conjugal|matrimony|matrimonial)\b/i,
  love: /\b(love|romance|romantic|courtship|dating|beloved|infatuation|lovers?)\b/i,
  finance: /\b(wealth|riches|money|finance|financial|income|prosperity|poverty)\b/i,
  health: /\b(disease|diseases|health|illness|ailment|sickness|injury|wound|fever)\b/i,
  business: /\b(business|trade|commerce|partnership|enterprise)\b/i,
  education: /\b(education|learning|knowledge|scholar|student|study|studies|vidya)\b/i,
  foreign: /\b(foreign|abroad|overseas|distant land|videsha)\b/i,
  spirituality: /\b(spiritual|spirituality|spiritual growth|inner peace|self[- ]realization|dharma|moksha|liberation|renunciation|sannyasa|devotion|asceticism)\b/i,
  children: /\b(children|child|progeny|son|sons|daughter|daughters|offspring|putra)\b/i,
  family: /\b(family|parents|father|mother|siblings|brother|sister|relatives|kinsmen|domestic|home\s+life|ancestral)\b/i,
  mentalNature: /\b(temperament|personality|disposition|character|mental\s+(?:strength|nature|makeup|state)|intellect|intelligence|psychology|psychological)\b/i,
  property: /\b(property|land|house\s+(?:and|or)\s+land|real estate|estate|building|vehicle)\b/i,
  longevity: /\b(longevity|life\s*span|length of life|ayurdaya|death|mortality)\b/i,
  remedies: /\b(remedy|remedies|gemstone|mantra|donation|fasting|propitiat\w*|upaya|worship|puja|pooja)\b/i,
  timing: /\b(at the time of|during the period|years? of age|in the \d+\w{0,2} year)\b/i,
  dasha: /\b(dasha|dasa|mahadasha|mahadasa|antardasha|antardasa|bhukti)\b/i,
  transit: /\b(transit|transiting|gochara)\b/i,
  yoga: /\byogas?\b/i,
  planet: new RegExp(`\\b(${PLANETS.join('|')}|graha)\\b`, 'i'),
  house: /\b(1st|2nd|3rd|[4-9]th|10th|11th|12th)\s+house\b|\bbhava\b/i,
  sign: new RegExp(`\\b(${SIGNS.join('|')}|rasi|rashi)\\b`, 'i'),
  nakshatra: new RegExp(`\\b(nakshatra|asterism|${nakshatraAlt})\\b`, 'i'),
  divisionalCharts: /\b(navamsa|hora|drekkana|d-?9|d-?10|d-?7|d-?12|varga|amsa|shodasavarga|vimsamsa)\b/i,
};

export type CategoryName = keyof typeof CATEGORY_PATTERNS;

/** Life-domain categories — used to pick a structuredRule effect's `domain`. Excludes structural tags (planet/house/sign/etc). */
export const DOMAIN_CATEGORIES = [
  'career', 'marriage', 'love', 'finance', 'health', 'business', 'education', 'foreign',
  'spirituality', 'children', 'family', 'mentalNature', 'property', 'longevity', 'remedies', 'timing',
];

export function classifyCategories(text: string): string[] {
  const hits: string[] = [];
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(text)) hits.push(category);
  }
  return hits;
}
