/**
 * Call-plan orchestrator (Phase C3) — the only place that actually turns a
 * ReportBrief into prose. Produces exactly the NarrativeSections shape
 * planned for NarrativeReport.sections (Phase D's Prisma model).
 *
 * Call plan (see project plan for the full reasoning):
 *   1 call  — overview / "Overall Life Direction"
 *   <=17 calls — one per life domain (skipped for domains with no data)
 *   <=~7 calls — one per windowed Mahadasha
 *   <=~63 calls — one per windowed Antardasha, using its parent Mahadasha's
 *                 own generated text as context so "what changes vs. the
 *                 mahadasha" reads coherently
 *
 * All calls run with bounded concurrency (mapWithConcurrency) rather than
 * fully serial or fully parallel. Mahadasha calls run to completion before
 * Antardasha calls start, specifically so each Antardasha prompt can carry
 * its parent's finished text as context.
 */
import 'server-only';
import type { LlmClient } from './client';
import type { ReportBrief, MahadashaBrief, AntardashaBrief, LifeDomainBrief, LifeDomain } from '@/narrative';
import { llmClient } from './index';
import { NARRATIVE_SYSTEM_PROMPT } from './prompts/narrative-system';
import { buildOverviewPrompt } from './prompts/overview';
import { buildLifeDomainPrompt } from './prompts/life-domain';
import { buildMahadashaPrompt, buildAntardashaPrompt } from './prompts/dasha-breakdown';
import { mapWithConcurrency } from './concurrency';

const DEFAULT_CONCURRENCY = 5;

export interface DashaSectionText {
  lord: string;
  startMs: number;
  endMs: number;
  isCurrent: boolean;
  isPast: boolean;
  text: string;
}

export interface AntardashaSectionText extends DashaSectionText {
  parentLord: string;
}

export interface NarrativeSections {
  overview: string | null;
  /** Keyed by life-domain label (e.g. "Career") — only domains with data appear here. */
  lifeDomains: Record<string, string>;
  mahadashas: DashaSectionText[];
  antardashas: AntardashaSectionText[];
}

export interface GenerateReportOptions {
  client?: LlmClient;
  concurrency?: number;
}

async function generateOne(client: LlmClient, prompt: string): Promise<string> {
  return client.generate(prompt, { system: NARRATIVE_SYSTEM_PROMPT });
}

async function generateLifeDomains(
  domains: LifeDomainBrief[],
  client: LlmClient,
  concurrency: number,
): Promise<Record<string, string>> {
  const withPrompts = domains
    .map((d) => ({ domain: d.domain, prompt: buildLifeDomainPrompt(d) }))
    .filter((x): x is { domain: LifeDomain; prompt: string } => x.prompt !== null);

  const texts = await mapWithConcurrency(withPrompts, concurrency, (x) => generateOne(client, x.prompt));

  const result: Record<string, string> = {};
  withPrompts.forEach((x, i) => {
    result[x.domain] = texts[i]!;
  });
  return result;
}

async function generateMahadashas(
  mahadashas: MahadashaBrief[],
  client: LlmClient,
  concurrency: number,
): Promise<{ sections: DashaSectionText[]; textByLord: Map<string, string> }> {
  const withPrompts = mahadashas
    .map((m) => ({ maha: m, prompt: buildMahadashaPrompt(m) }))
    .filter((x): x is { maha: MahadashaBrief; prompt: string } => x.prompt !== null);

  const texts = await mapWithConcurrency(withPrompts, concurrency, (x) => generateOne(client, x.prompt));

  const sections: DashaSectionText[] = [];
  const textByLord = new Map<string, string>();
  withPrompts.forEach((x, i) => {
    const text = texts[i]!;
    sections.push({ lord: x.maha.lord, startMs: x.maha.startMs, endMs: x.maha.endMs, isCurrent: x.maha.isCurrent, isPast: x.maha.isPast, text });
    // Last write wins if the same lord appears twice in the windowed set (it won't in practice — each maha is a distinct period).
    textByLord.set(x.maha.lord, text);
  });
  return { sections, textByLord };
}

async function generateAntardashas(
  mahadashas: MahadashaBrief[],
  mahaTextByLord: Map<string, string>,
  client: LlmClient,
  concurrency: number,
): Promise<AntardashaSectionText[]> {
  const allAntardashas = mahadashas.flatMap((m) => m.antardashas);
  const withPrompts = allAntardashas
    .map((a) => ({ antar: a, prompt: buildAntardashaPrompt(a, mahaTextByLord.get(a.parentLord)) }))
    .filter((x): x is { antar: AntardashaBrief; prompt: string } => x.prompt !== null);

  const texts = await mapWithConcurrency(withPrompts, concurrency, (x) => generateOne(client, x.prompt));

  return withPrompts.map((x, i) => ({
    lord: x.antar.lord,
    startMs: x.antar.startMs,
    endMs: x.antar.endMs,
    isCurrent: x.antar.isCurrent,
    isPast: x.antar.isPast,
    parentLord: x.antar.parentLord,
    text: texts[i]!,
  }));
}

/**
 * Turn a deterministic ReportBrief into prose. This is the only function in
 * the codebase that should call an LLM for report generation.
 */
export async function generateNarrativeReport(
  brief: ReportBrief,
  opts: GenerateReportOptions = {},
): Promise<NarrativeSections> {
  const client = opts.client ?? llmClient;
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;

  const overviewPrompt = buildOverviewPrompt(brief);
  const [overview, lifeDomains, { sections: mahadashas, textByLord }] = await Promise.all([
    overviewPrompt ? generateOne(client, overviewPrompt) : Promise.resolve(null),
    generateLifeDomains(brief.lifeDomains, client, concurrency),
    generateMahadashas(brief.mahadashas, client, concurrency),
  ]);

  const antardashas = await generateAntardashas(brief.mahadashas, textByLord, client, concurrency);

  return { overview, lifeDomains, mahadashas, antardashas };
}
