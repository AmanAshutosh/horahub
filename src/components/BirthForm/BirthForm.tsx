'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GenerateChartResponse } from '@/types/api';
import { useChartStore } from '@/store/chartStore';
import { Field, inputClass } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { PlaceSearch } from './PlaceSearch';
import { initialBirthForm, type BirthFormState } from './BirthForm.types';
import { validateBirthForm } from './BirthForm.validation';

export function BirthForm() {
  const router = useRouter();
  const setResult = useChartStore((s) => s.setResult);
  const [form, setForm] = useState<BirthFormState>(initialBirthForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof BirthFormState>(key: K, value: BirthFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit() {
    const problem = validateBirthForm(form);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          gender: form.gender,
          birthDate: form.birthDate,
          birthTime: form.birthTime,
          placeName: form.place!.name,
          latitude: form.place!.latitude,
          longitude: form.place!.longitude,
          tzName: form.place!.timezone,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Could not generate the chart.');
      }
      const data = (await res.json()) as GenerateChartResponse;
      setResult(data);
      router.push(`/report/${data.chartId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl2 border border-line bg-panel p-4">
      <div className="mb-3">
        <Field label="Full name">
          <input
            className={inputClass}
            value={form.fullName}
            autoComplete="off"
            onChange={(e) => update('fullName', e.target.value)}
          />
        </Field>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <Field label="Gender">
          <select
            className={inputClass}
            value={form.gender}
            onChange={(e) => update('gender', e.target.value as BirthFormState['gender'])}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
        <Field label="Date of birth">
          <input
            type="date"
            className={inputClass}
            value={form.birthDate}
            onChange={(e) => update('birthDate', e.target.value)}
          />
        </Field>
      </div>

      <div className="mb-3">
        <Field label="Time of birth (24h)">
          <input
            type="time"
            className={inputClass}
            value={form.birthTime}
            onChange={(e) => update('birthTime', e.target.value)}
          />
        </Field>
      </div>

      <div className="mb-3">
        <PlaceSearch
          query={form.placeQuery}
          selected={form.place}
          onQuery={(q) => setForm((f) => ({ ...f, placeQuery: q, place: null }))}
          onSelect={(p) => setForm((f) => ({ ...f, place: p, placeQuery: p.name }))}
        />
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={onSubmit}
        className="mt-1.5 w-full rounded-[12px] bg-gradient-to-r from-gold to-gold-soft py-3.5 text-[15px] font-extrabold tracking-wide text-[#1a1305] disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Spinner /> Generating…
          </>
        ) : (
          'Generate Report'
        )}
      </button>
      {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}
