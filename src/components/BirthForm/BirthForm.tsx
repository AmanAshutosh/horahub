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
    if (problem) { setError(problem); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName:  form.fullName,
          gender:    form.gender,
          birthDate: form.birthDate,
          birthTime: form.birthTime,
          placeName: form.place!.name,
          latitude:  form.place!.latitude,
          longitude: form.place!.longitude,
          tzName:    form.place!.timezone,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Could not generate the chart.');
      }
      const data = (await res.json()) as GenerateChartResponse;
      setResult(data);
      setPerson({
        fullName:  form.fullName,
        gender:    form.gender,
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
    <div className="hh-form-card animate-scale-up">
      {/* Header */}
      <div className="home-form-header">
        <p className="home-form-eyebrow">
          <span className="home-form-eyebrow-star">✦</span>
          Generate your chart
        </p>
        <p className="home-form-hint">
          All fields required — exact birth time determines your rising sign.
        </p>
      </div>

      {/* Fields */}
      <div className="home-form-body">
        <Field label="Full name">
          <input
            className={inputClass}
            placeholder="As it appears on your birth record"
            value={form.fullName}
            autoComplete="off"
            onChange={(e) => update('fullName', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Gender">
            <div className="relative">
              <select
                className={`${inputClass} hh-select`}
                value={form.gender}
                onChange={(e) => update('gender', e.target.value as BirthFormState['gender'])}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
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

        <Field
          label="Time of birth"
          hint="24-hour (HH:MM) — determines which sign was rising at birth"
        >
          <input
            type="time"
            className={inputClass}
            value={form.birthTime}
            onChange={(e) => update('birthTime', e.target.value)}
          />
        </Field>

        <PlaceSearch
          query={form.placeQuery}
          selected={form.place}
          onQuery={(q) => setForm((f) => ({ ...f, placeQuery: q, place: null }))}
          onSelect={(p) => setForm((f) => ({ ...f, place: p, placeQuery: p.name }))}
        />
      </div>

      {/* Submit */}
      <div className="home-form-footer">
        {error && <p className="home-error">{error}</p>}
        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="btn btn-primary btn-full"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
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
