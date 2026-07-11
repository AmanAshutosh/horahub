/**
 * The 17 user-facing life domains the Narrative Engine reports on (per the
 * product spec — see NARRATIVE_ENGINE_HANDOFF.md).
 */
export const LIFE_DOMAINS = [
  'Career', 'Money', 'Marriage', 'Relationships', 'Family', 'Parents', 'Children',
  'Health', 'Mental Health', 'Education', 'Business', 'Property', 'Travel',
  'Foreign Settlement', 'Legal Matters', 'Spiritual Growth', 'Overall Life Direction',
] as const;

export type LifeDomain = (typeof LIFE_DOMAINS)[number];

/**
 * Existing KB categories (src/inference/domain-aggregator.ts's
 * LIFE_AREA_DOMAINS) mapped to the narrative layer's domain labels.
 *
 * KNOWN GAP: Parents, Children, Business, Property, Travel, Foreign
 * Settlement, and Legal Matters have NO KB category on the other side of
 * this map — the underlying ~17k-rule KB was never tagged with those
 * categories (confirmed: scripts/kb-lib/rule-schema.ts has no such category
 * strings). Until a KB re-extraction pass adds them, those domains will
 * always compile to zero Observations. Downstream (B3, not yet built) must
 * render "insufficient data" for them rather than fabricate content.
 */
export const KB_CATEGORY_TO_DOMAIN: Readonly<Record<string, LifeDomain>> = {
  career: 'Career',
  finance: 'Money',
  marriage: 'Marriage',
  love: 'Relationships',
  family: 'Family',
  health: 'Health',
  mentalNature: 'Mental Health',
  education: 'Education',
  spirituality: 'Spiritual Growth',
};
