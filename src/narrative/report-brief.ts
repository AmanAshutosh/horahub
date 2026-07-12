/**
 * Report brief assembly (Phase B3) — the final structured output of the
 * deterministic Narrative Engine, and the thing the (not-yet-built) LLM
 * layer (Phase C) will be handed. Still no prose here — every field is
 * either a MergedObservation (already grounded in verbatim source text) or
 * a deterministic derived label (riskLevel, hasData).
 *
 * Server-only (transitively, via runInference -> src/inference/loader.ts's
 * filesystem access) — never import from client code.
 */
import 'server-only';
import type { ChartFacts, DashaNode } from '@/types/chart';
import type { InferenceResult, MatchedRule, RemedyCard } from '@/inference/types';
import type { StrengthTier } from './types';
import type { MergedObservation } from './merge';
import { runInference } from '@/inference';
import { buildDomainRemedyCards } from '@/inference/remedy-engine';
import { compileObservations } from './observation-compiler';
import { mergeObservations, groupMergedByDomain, STRENGTH_ORDER } from './merge';
import { LIFE_DOMAINS, DOMAIN_TO_KB_CATEGORY, type LifeDomain } from './domain-map';

/** How many mahadashas before/after the current one to include a full breakdown for. */
const MAHADASHA_BEFORE = 3;
const MAHADASHA_AFTER = 4;

/** Bump when this file's ReportBrief shape changes materially — drives the persisted cache key (see prisma/schema.prisma's ReportBrief.briefVersion). */
export const BRIEF_VERSION = 'brief-v1';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface LifeDomainBrief {
  domain: LifeDomain;
  /** False when this domain has no KB category coverage or simply no matches for this chart — render "insufficient data", never fabricate. */
  hasData: boolean;
  observations: MergedObservation[];
  remedies: RemedyCard[];
  riskLevel: RiskLevel;
}

export interface DashaPeriodBrief {
  lord: string;
  startMs: number;
  endMs: number;
  isCurrent: boolean;
  isPast: boolean;
  /** Verbatim source sentences from dasha-tagged rules that name this lord. Never fabricated. */
  sourceTexts: string[];
  contributingRuleIds: string[];
}

export interface AntardashaBrief extends DashaPeriodBrief {
  parentLord: string;
}

export interface MahadashaBrief extends DashaPeriodBrief {
  antardashas: AntardashaBrief[];
}

export interface ReportBrief {
  computedAt: string;
  lifeDomains: LifeDomainBrief[];
  mahadashas: MahadashaBrief[];
  /** Cross-domain synthesis: yoga/dosha-driven "big picture" observations plus each domain's own top-priority observation. */
  overallDirection: MergedObservation[];
}

// ── Life-domain assembly ────────────────────────────────────────────────────

const HIGH_RISK_TIERS = new Set<StrengthTier>(['natal', 'mahadasha']);

function riskLevelFor(observations: MergedObservation[]): RiskLevel {
  const negatives = observations.filter((o) => o.polarity === 'negative');
  if (negatives.length === 0) return 'low';
  if (negatives.some((o) => HIGH_RISK_TIERS.has(o.strengthTier))) return 'high';
  return 'medium';
}

function buildLifeDomainBriefs(
  result: InferenceResult,
  mergedByDomain: Map<string, MergedObservation[]>,
): LifeDomainBrief[] {
  return LIFE_DOMAINS.map((domain) => {
    const observations = mergedByDomain.get(domain) ?? [];
    const kbCategory = DOMAIN_TO_KB_CATEGORY[domain];
    const domainResult = kbCategory ? result.domains.find((d) => d.domain === kbCategory) : undefined;
    const remedies = domainResult ? buildDomainRemedyCards(domain, domainResult.matches) : [];

    return {
      domain,
      hasData: observations.length > 0,
      observations,
      remedies,
      riskLevel: riskLevelFor(observations),
    };
  });
}

// ── Overall direction ────────────────────────────────────────────────────────

function buildOverallDirection(mergedByDomain: Map<string, MergedObservation[]>): MergedObservation[] {
  const explicit = mergedByDomain.get('Overall Life Direction' satisfies LifeDomain) ?? [];

  const headlines: MergedObservation[] = [];
  for (const [domain, group] of mergedByDomain) {
    if (domain === ('Overall Life Direction' satisfies LifeDomain)) continue;
    const [top] = [...group].sort((a, b) => {
      const tierDiff = STRENGTH_ORDER[a.strengthTier] - STRENGTH_ORDER[b.strengthTier];
      return tierDiff !== 0 ? tierDiff : b.confidence - a.confidence;
    });
    if (top) headlines.push(top);
  }

  return [...explicit, ...headlines];
}

// ── Mahadasha / Antardasha breakdowns ───────────────────────────────────────

function dedupeByRuleId(matches: MatchedRule[]): MatchedRule[] {
  const seen = new Map<string, MatchedRule>();
  for (const m of matches) if (!seen.has(m.ruleId)) seen.set(m.ruleId, m);
  return [...seen.values()];
}

/** Dasha-tagged matches (from already-capped, already-scored domain results) that name this lord. */
function matchesForLord(allMatches: MatchedRule[], lord: string): MatchedRule[] {
  const lowerLord = lord.toLowerCase();
  return allMatches.filter((m) => m.categories.includes('dasha') && m.sourceText.toLowerCase().includes(lowerLord));
}

function periodBriefFields(node: DashaNode, allMatches: MatchedRule[]): Pick<DashaPeriodBrief, 'sourceTexts' | 'contributingRuleIds'> {
  const matches = matchesForLord(allMatches, node.lord);
  return {
    sourceTexts: matches.map((m) => m.sourceText),
    contributingRuleIds: matches.map((m) => m.ruleId),
  };
}

function buildMahadashaBriefs(facts: ChartFacts, result: InferenceResult): MahadashaBrief[] {
  const allMatches = dedupeByRuleId(result.domains.flatMap((d) => d.matches));
  const now = Date.now();
  const { tree, currentPath, currentMahaIndex } = facts.dasha;
  const currentIndex = currentPath.mahaIndex >= 0 ? currentPath.mahaIndex : currentMahaIndex;

  const start = Math.max(0, currentIndex - MAHADASHA_BEFORE);
  const end = Math.min(tree.length - 1, currentIndex + MAHADASHA_AFTER);

  const briefs: MahadashaBrief[] = [];
  for (let i = start; i <= end; i += 1) {
    const node = tree[i];
    if (!node) continue;
    const isCurrent = i === currentIndex;
    const isPast = node.endMs < now;

    const antardashas: AntardashaBrief[] = (node.children ?? []).map((child, j) => ({
      lord: child.lord,
      startMs: child.startMs,
      endMs: child.endMs,
      isCurrent: isCurrent && j === currentPath.antarIndex,
      isPast: child.endMs < now,
      parentLord: node.lord,
      ...periodBriefFields(child, allMatches),
    }));

    briefs.push({
      lord: node.lord,
      startMs: node.startMs,
      endMs: node.endMs,
      isCurrent,
      isPast,
      antardashas,
      ...periodBriefFields(node, allMatches),
    });
  }
  return briefs;
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Build the full ReportBrief for a chart: runs the deterministic KB
 * inference engine, compiles it into Observations (B1), merges/prioritizes
 * them (B2), and assembles the final per-domain + per-dasha structure (B3).
 *
 * Returns null when the KB graph isn't built (mirrors runInference's own
 * contract) — callers must handle that gracefully, same as
 * generateReportSections() already does.
 */
export function buildReportBrief(facts: ChartFacts): ReportBrief | null {
  const result = runInference(facts);
  if (!result) return null;

  const observations = compileObservations(result);
  const merged = mergeObservations(observations);
  const mergedByDomain = groupMergedByDomain(merged);

  return {
    computedAt: result.computedAt,
    lifeDomains: buildLifeDomainBriefs(result, mergedByDomain),
    mahadashas: buildMahadashaBriefs(facts, result),
    overallDirection: buildOverallDirection(mergedByDomain),
  };
}
