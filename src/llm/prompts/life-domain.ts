import type { LifeDomainBrief } from '@/narrative';
import { formatObservations, formatRemedies } from './format';

/**
 * Builds the user-message prompt for one life domain's report section.
 *
 * Returns null when the domain has no data (LifeDomainBrief.hasData ===
 * false) — the caller (the call-plan orchestrator, Phase C3) should skip
 * the LLM call entirely for these and use a static, honest fallback
 * message instead of spending a call asking the model to write about
 * nothing.
 */
export function buildLifeDomainPrompt(brief: LifeDomainBrief): string | null {
  if (!brief.hasData) return null;

  return `Write the "${brief.domain}" section of a personal life report, using ONLY the structured data below — do not invent facts beyond it.

STRUCTURED DATA FOR THIS DOMAIN
Deterministic risk level (do not restate this number, just let it inform your tone): ${brief.riskLevel}

Observations (most important first, already merged and prioritized):
${formatObservations(brief.observations)}

Remedies found in the data (only mention these if relevant, never invent others):
${formatRemedies(brief.remedies)}

WHAT TO WRITE
Cover, in flowing prose (not bullet points, not headers) in this order:
1. Current Situation — what's happening in this area of the person's life right now.
2. Why — the underlying reason this phase exists, explained simply.
3. What You May Experience — concrete, realistic situations (not vague platitudes).
4. Things To Do — specific, actionable advice grounded in the observations above.
5. Things To Avoid — specific mistakes to watch for, not generic warnings.
6. Best Opportunities — where effort in this area will pay off most.
7. Timing — if the observations mention a dasha or transit period, mention roughly when to expect change; otherwise skip this.
8. Remedies — only if remedy data was provided above; explain why each one is relevant.

Keep the whole section to a few warm, clear paragraphs — depth over length.`;
}
