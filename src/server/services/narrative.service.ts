import type { ChartFacts } from '@/types/chart';
import { buildReportBrief, BRIEF_VERSION } from '@/narrative';
import { generateNarrativeReport } from '@/llm/generate-report';
import { PROMPT_VERSION } from '@/llm';
import { chartRepository } from '@/server/repositories/chart.repository';
import { AppError, DatabaseNotConfiguredError, NotFoundError } from '@/lib/errors';
import { isDatabasePlaceholder } from '@/lib/prisma';
import { env } from '@/config';
import { logger } from '@/lib/logger';

/**
 * Orchestrates narrative report generation:
 *   buildReportBrief (deterministic) → persist ReportBrief
 *     → generateNarrativeReport (LLM, ~dozens of calls) → persist NarrativeReport.
 *
 * Kept separate from chart.service.ts on purpose — chart generation is fast
 * and synchronous today; narrative generation is many LLM calls and a very
 * different latency profile. This is a v1 SYNCHRONOUS implementation (the
 * HTTP request awaits the full generation) — NarrativeReport.status exists
 * to support a future background-job version without a schema change, but
 * building that job queue is explicitly out of scope for this project (see
 * NARRATIVE_ENGINE_HANDOFF.md).
 */
export const narrativeService = {
  async generate(chartId: string) {
    if (isDatabasePlaceholder(env.DATABASE_URL)) throw new DatabaseNotConfiguredError();

    const chart = await chartRepository.findById(chartId);
    if (!chart) throw new NotFoundError('Chart');

    const facts = chart.facts as unknown as ChartFacts;
    const kbVersion = env.KB_VERSION;

    const brief = buildReportBrief(facts);
    if (!brief) {
      throw new AppError('Knowledge base graph is not built — cannot generate a narrative report yet.', 503);
    }

    const reportBriefRow = await chartRepository.createReportBrief(chartId, kbVersion, BRIEF_VERSION, brief);
    logger.debug({ chartId, reportBriefId: reportBriefRow.id }, 'narrative.service: report brief persisted');

    const llmProvider = env.LLM_PROVIDER;
    const llmModel = env.ANTHROPIC_MODEL;

    try {
      const sections = await generateNarrativeReport(brief);
      const narrativeReport = await chartRepository.createNarrativeReport({
        chartId,
        reportBriefId: reportBriefRow.id,
        llmProvider,
        llmModel,
        promptVersion: PROMPT_VERSION,
        sections,
        status: 'complete',
      });
      logger.debug({ chartId, narrativeReportId: narrativeReport.id }, 'narrative.service: narrative report generated');
      return narrativeReport;
    } catch (err) {
      logger.error({ err, chartId }, 'narrative.service: generation failed');
      await chartRepository.createNarrativeReport({
        chartId,
        reportBriefId: reportBriefRow.id,
        llmProvider,
        llmModel,
        promptVersion: PROMPT_VERSION,
        sections: { overview: null, lifeDomains: {}, mahadashas: [], antardashas: [] },
        status: 'failed',
      });
      throw err;
    }
  },

  async getLatest(chartId: string) {
    if (isDatabasePlaceholder(env.DATABASE_URL)) throw new DatabaseNotConfiguredError();
    return chartRepository.findLatestNarrativeReport(chartId);
  },
};
