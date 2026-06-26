'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { GenerateChartResponse } from '@/types/api';
import { useChartStore } from '@/store/chartStore';
import { ReportView } from '@/components/report';
import { Spinner } from '@/components/ui/Spinner';

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const stored = useChartStore((s) => s.result);
  const [data, setData] = useState<GenerateChartResponse | null>(
    stored && stored.chartId === params.id ? stored : null,
  );
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <main className="mx-auto max-w-[760px] px-4 py-10 text-center text-ink-muted">
        {error} — <Link href="/" className="text-accent underline">start a new chart</Link>.
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
  return <ReportView data={data} />;
}
