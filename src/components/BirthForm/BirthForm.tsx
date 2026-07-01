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
  const setPerson = useChartStore((s) => s.setPerson);
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
      setPerson({
        fullName: form.fullName,
        gender: form.gender,
        birthDate: form.birthDate,
        birthTime: form.birthTime,
        placeName: form.place!.name,
      });
      router.push(`/report/${data.chartId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-scale-up rounded-2xl border border-line bg-panel shadow-neu-sm">
      {/* Form card header */}
      <div className="border-b border-line px-6 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/70">
          Generate your chart
        </p>
        <p className="mt-0.5 text-[12px] text-ink-subtle">
          All fields required — exact birth time gives the most accurate rising sign.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-4 px-6 py-5">
        {/* Full name */}
        <Field label="Full name">
          <input
            className={inputClass}
            placeholder="As it appears on your birth record"
            value={form.fullName}
            autoComplete="off"
            onChange={(e) => update('fullName', e.target.value)}
          />
        </Field>

        {/* Gender + Date row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gender">
            <div className="relative">
              <select
                className={inputClass}
                value={form.gender}
                onChange={(e) => update('gender', e.target.value as BirthFormState['gender'])}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {/* Custom chevron — restores arrow removed by appearance-none */}
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">
                ▾
              </span>
            </div>
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

        {/* Time */}
        <Field
          label="Time of birth"
          hint="24-hour format (HH:MM) — determines which sign was rising at birth"
        >
          <input
            type="time"
            className={inputClass}
            value={form.birthTime}
            onChange={(e) => update('birthTime', e.target.value)}
          />
        </Field>

        {/* Place */}
        <PlaceSearch
          query={form.placeQuery}
          selected={form.place}
          onQuery={(q) => setForm((f) => ({ ...f, placeQuery: q, place: null }))}
          onSelect={(p) => setForm((f) => ({ ...f, place: p, placeQuery: p.name }))}
        />
      </div>

      {/* Submit */}
      <div className="px-6 pb-6">
        {error && (
          <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-gold to-gold-soft py-3.5 text-[15px] font-bold tracking-wide text-[#1a1305] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner /> Generating report…
            </span>
          ) : (
            'Generate Report'
          )}
        </button>
      </div>
    </div>
  );
}
