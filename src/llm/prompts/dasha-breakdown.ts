import type { MahadashaBrief, AntardashaBrief } from '@/narrative';
import { formatPeriod, formatSourceTexts } from './format';

/**
 * Returns null when there's no classical text data at all for this period —
 * same "don't spend a call writing about nothing" contract as
 * life-domain.ts's buildLifeDomainPrompt.
 */
export function buildMahadashaPrompt(brief: MahadashaBrief): string | null {
  if (brief.sourceTexts.length === 0) return null;

  return `Write a breakdown of this Mahadasha (major life period) for a personal astrology report, using ONLY the structured data below.

PERIOD: ${formatPeriod(brief)}

Classical source texts naming this period's ruling influence:
${formatSourceTexts(brief.sourceTexts)}

WHAT TO WRITE
Cover, in flowing prose (not bullet points, not headers) in this order:
1. Overview — what this period is broadly about.
2. Purpose — why this phase of life exists, what it's building toward.
3. Life Lessons — what this period tends to teach.
4. Biggest Opportunities — where this period rewards effort most.
5. Biggest Mistakes — the most common way people waste this period.
6. Career, Finance, Relationships, Health — one or two sentences each, only where the source texts actually support a claim; skip any of these four you have no grounding for rather than padding.
7. What To Avoid.
8. Summary — two or three sentences a reader could hold onto.

If this period is marked "past" in the data, write about it in past tense as something already lived through, not as a prediction. If it's marked "CURRENT," write about it as the present. If "upcoming," write about it as what's ahead.`;
}

/**
 * antardashaBrief.parentLord names the mahadasha this antardasha sits
 * inside; parentSummary (optional) can carry a short prior overview from
 * that mahadasha's own generated text, so "what changes vs. the mahadasha"
 * reads coherently — the orchestrator (Phase C3) decides whether to pass it.
 */
export function buildAntardashaPrompt(brief: AntardashaBrief, parentSummary?: string): string | null {
  if (brief.sourceTexts.length === 0) return null;

  return `Write a breakdown of this Antardasha (sub-period) for a personal astrology report, using ONLY the structured data below.

SUB-PERIOD: ${formatPeriod(brief)}, running within the larger ${brief.parentLord} period.
${parentSummary ? `\nWhat the larger ${brief.parentLord} period is generally about, for context (do not repeat this verbatim, just stay consistent with it): ${parentSummary}\n` : ''}
Classical source texts naming this sub-period's ruling influence:
${formatSourceTexts(brief.sourceTexts)}

WHAT TO WRITE
Cover, in flowing prose (not bullet points, not headers) in this order:
1. What Changes — how this sub-period shifts the tone of the larger period it sits inside.
2. What Becomes Easier.
3. What Becomes Harder.
4. Main Opportunities.
5. Warnings — specific, not generic.

Keep this shorter than a full Mahadasha breakdown — two to four short paragraphs. If this period is marked "past," write in past tense; "CURRENT" as present; "upcoming" as what's ahead.`;
}
