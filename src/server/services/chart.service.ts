import type { GenerateChartDto } from '@/server/validators/chart.validator';
import type { GenerateChartResponse } from '@/types/api';
import type { ChartFacts } from '@/types/chart';
import { ephemeris } from '@/ephemeris/provider';
import { interpret } from '@/interpret';
import { loadKnowledgeBase } from '@/kb';
import { chartRepository } from '@/server/repositories/chart.repository';
import { cache } from '@/lib/cache';
import { birthHash } from '@/lib/hash';
import { localToUtc } from '@/lib/timezone';
import { AppError } from '@/lib/errors';
import { APP, env } from '@/config';
import { logger } from '@/lib/logger';

/**
 * Orchestrates chart generation:
 *   resolve timezone → compute facts (cached) → interpret (versioned) → persist.
 * Because charts are deterministic, identical births are a cache/db hit.
 */
export const chartService = {
  async generate(dto: GenerateChartDto): Promise<GenerateChartResponse> {
    const [y, mo, d] = dto.birthDate.split('-').map(Number) as [number, number, number];
    const [h, mi] = dto.birthTime.split(':').map(Number) as [number, number];
    const resolved = localToUtc(y, mo, d, h, mi, dto.tzName);
    if (!resolved) throw new AppError('Unrecognised timezone', 422);

    const hash = birthHash(dto);
    const kb = loadKnowledgeBase();
    const kbVersion = env.KB_VERSION;

    // 1. chart facts: cache → db → compute
    let facts = await cache.get<ChartFacts>(`chart:${hash}`);
    let chartId: string;

    const existing = await chartRepository.findByHash(hash);
    if (existing) {
      chartId = existing.id;
      facts = facts ?? (existing.facts as unknown as ChartFacts);
    } else {
      facts = facts ?? ephemeris.compute({ utcMs: resolved.utcMs, latitude: dto.latitude, longitude: dto.longitude });
      const created = await chartRepository.create(hash, facts, undefined);
      chartId = created.id;
      logger.debug({ chartId, hash }, 'chart computed and stored');
    }
    await cache.set(`chart:${hash}`, facts, APP.chartCacheTtlSeconds);

    // 2. reading for the active KB version (re-used if already rendered)
    const reading = interpret(facts, kb);
    await chartRepository.upsertReading(chartId, kbVersion, reading);

    return {
      chartId,
      facts,
      reading,
      kbVersion,
      resolved: { utcOffset: resolved.offsetLabel, coordinates: { lat: dto.latitude, lon: dto.longitude } },
    };
  },

  async getById(id: string): Promise<GenerateChartResponse | null> {
    const chart = await chartRepository.findById(id);
    if (!chart) return null;
    const facts = chart.facts as unknown as ChartFacts;
    const kbVersion = env.KB_VERSION;
    const existing = chart.readings.find((r: { kbVersion: string; sections: unknown }) => r.kbVersion === kbVersion);
    const reading = existing
      ? (existing.sections as unknown as GenerateChartResponse['reading'])
      : interpret(facts, loadKnowledgeBase());
    return {
      chartId: chart.id,
      facts,
      reading,
      kbVersion,
      resolved: { utcOffset: '', coordinates: { lat: 0, lon: 0 } },
    };
  },
};
