'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { GenerateChartResponse, NarrativeReportResponse } from '@/types/api';
import { useChartStore } from '@/store/chartStore';
import { ReportView } from '@/components/report';
import { Spinner } from '@/components/ui/Spinner';

type NarrativeStatus = 'idle' | 'generating' | 'failed' | 'complete';

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const stored = useChartStore((s) => s.result);
  const person = useChartStore((s) => s.person);
  const [data, setData] = useState<GenerateChartResponse | null>(
    stored && stored.chartId === params.id ? stored : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<NarrativeReportResponse | null>(null);
  const [narrativeStatus, setNarrativeStatus] = useState<NarrativeStatus>('idle');

  useEffect(() => {
    if (data) return;
    fetch(`/api/chart/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Chart not found.');
        return (await r.json()) as GenerateChartResponse;
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load.'));
  }, [params.id, data]);

  // Check for an already-generated narrative report once the chart has loaded.
  useEffect(() => {
    if (!data) return;
    fetch(`/api/chart/${data.chartId}/narrative`)
      .then(async (r) => {
        if (!r.ok) return; // 404 — none generated yet, stays 'idle'
        const report = (await r.json()) as NarrativeReportResponse;
        setNarrative(report);
        setNarrativeStatus('complete');
      })
      .catch(() => {
        // Non-fatal — the rest of the report still renders; user can retry via the CTA.
      });
  }, [data]);

  const generateNarrative = useCallback(() => {
    if (!data) return;
    setNarrativeStatus('generating');
    fetch(`/api/chart/${data.chartId}/narrative`, { method: 'POST' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Generation failed.');
        return (await r.json()) as NarrativeReportResponse;
      })
      .then((report) => {
        setNarrative(report);
        setNarrativeStatus(report.status === 'complete' ? 'complete' : 'failed');
      })
      .catch(() => setNarrativeStatus('failed'));
  }, [data]);

  if (error) {
    return (
      <main className="mx-auto max-w-[760px] px-4 py-10 text-center text-ink-muted">
        {error} — <Link href="/" className="text-primary underline">start a new chart</Link>.
      </main>
    );
  }
  if (!data) {
    return (
      <main className="mx-auto max-w-[760px] px-4 py-10 text-center text-ink-muted">
        <Spinner /> Loading report…
      </main>
    );
  }
  return (
    <ReportView
      data={data}
      person={person}
      narrative={narrative}
      narrativeStatus={narrativeStatus}
      onGenerateNarrative={generateNarrative}
    />
  );
}
