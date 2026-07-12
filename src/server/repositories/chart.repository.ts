import type { ChartFacts } from '@/types/chart';
import type { ReadingSection } from '@/types/reading';
import type { ReportBrief } from '@/narrative';
import type { NarrativeSections } from '@/llm/generate-report';
import { prisma } from '@/lib/prisma';
import { toJson } from '@/lib/json';

/**
 * Data access for charts and readings. No business logic lives here, and no
 * SQL leaks above this layer — services depend on these methods only.
 */
export const chartRepository = {
  findByHash(inputHash: string) {
    return prisma.chart.findUnique({
      where: { inputHash },
      include: { readings: true, profile: true },
    });
  },

  create(inputHash: string, facts: ChartFacts, profileId?: string) {
    return prisma.chart.create({
      data: { inputHash, facts: toJson(facts), profileId: profileId ?? null },
    });
  },

  findById(id: string) {
    return prisma.chart.findUnique({ where: { id }, include: { readings: true, profile: true } });
  },

  upsertReading(chartId: string, kbVersion: string, sections: ReadingSection[]) {
    return prisma.reading.upsert({
      where: { chartId_kbVersion: { chartId, kbVersion } },
      create: { chartId, kbVersion, sections: toJson(sections) },
      update: { sections: toJson(sections) },
    });
  },

  /** Overwrite a chart's cached facts — used for migrate-on-read when factsVersion is stale. */
  updateFacts(chartId: string, facts: ChartFacts) {
    return prisma.chart.update({
      where: { id: chartId },
      data: { facts: toJson(facts) },
    });
  },

  // ── Narrative Engine (ReportBrief / NarrativeReport) ────────────────────────

  createReportBrief(chartId: string, kbVersion: string, briefVersion: string, data: ReportBrief) {
    return prisma.reportBrief.upsert({
      where: { chartId_kbVersion_briefVersion: { chartId, kbVersion, briefVersion } },
      create: { chartId, kbVersion, briefVersion, data: toJson(data) },
      update: { data: toJson(data) },
    });
  },

  findReportBrief(chartId: string, kbVersion: string, briefVersion: string) {
    return prisma.reportBrief.findUnique({
      where: { chartId_kbVersion_briefVersion: { chartId, kbVersion, briefVersion } },
    });
  },

  createNarrativeReport(params: {
    chartId: string;
    reportBriefId: string;
    llmProvider: string;
    llmModel: string;
    promptVersion: string;
    sections: NarrativeSections;
    status: 'generating' | 'complete' | 'failed';
  }) {
    const { chartId, reportBriefId, llmProvider, llmModel, promptVersion, sections, status } = params;
    return prisma.narrativeReport.upsert({
      where: { chartId_reportBriefId_llmProvider_llmModel_promptVersion: { chartId, reportBriefId, llmProvider, llmModel, promptVersion } },
      create: { chartId, reportBriefId, llmProvider, llmModel, promptVersion, sections: toJson(sections), status },
      update: { sections: toJson(sections), status },
    });
  },

  /** Latest complete narrative report for a chart, regardless of which brief/model/prompt version produced it. */
  findLatestNarrativeReport(chartId: string) {
    return prisma.narrativeReport.findFirst({
      where: { chartId, status: 'complete' },
      orderBy: { createdAt: 'desc' },
    });
  },
};
