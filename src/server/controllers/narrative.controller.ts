import { NextResponse } from 'next/server';
import { narrativeService } from '@/server/services/narrative.service';
import { NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/** HTTP concerns only: parse, delegate, respond. */
export const narrativeController = {
  async generate(chartId: string): Promise<NextResponse> {
    logger.debug({ chartId }, 'POST /api/chart/[id]/narrative — generation requested');
    const report = await narrativeService.generate(chartId);
    logger.debug({ chartId, narrativeReportId: report.id, status: report.status }, 'POST /api/chart/[id]/narrative — done');
    return NextResponse.json(report, { status: 201 });
  },

  async getLatest(chartId: string): Promise<NextResponse> {
    const report = await narrativeService.getLatest(chartId);
    if (!report) throw new NotFoundError('Narrative report');
    return NextResponse.json(report);
  },
};
