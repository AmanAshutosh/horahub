import type { ChartFacts } from '@/types/chart';
import type { ReadingSection } from '@/types/reading';
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
      include: { readings: true },
    });
  },

  create(inputHash: string, facts: ChartFacts, profileId?: string) {
    return prisma.chart.create({
      data: { inputHash, facts: toJson(facts), profileId: profileId ?? null },
    });
  },

  findById(id: string) {
    return prisma.chart.findUnique({ where: { id }, include: { readings: true } });
  },

  upsertReading(chartId: string, kbVersion: string, sections: ReadingSection[]) {
    return prisma.reading.upsert({
      where: { chartId_kbVersion: { chartId, kbVersion } },
      create: { chartId, kbVersion, sections: toJson(sections) },
      update: { sections: toJson(sections) },
    });
  },
};
