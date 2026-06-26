'use client';
import { useState } from 'react';
import type { GeocodeResult } from '@/types/api';
import { useGeocode } from '@/hooks/useGeocode';
import { Spinner } from '@/components/ui/Spinner';
import { Field, inputClass } from '@/components/ui/Field';

export function PlaceSearch({
  query,
  selected,
  onQuery,
  onSelect,
}: {
  query: string;
  selected: GeocodeResult | null;
  onQuery: (q: string) => void;
  onSelect: (p: GeocodeResult) => void;
}) {
  const [focused, setFocused] = useState(false);
  const { results, loading, error } = useGeocode(selected ? '' : query);
  const showList = focused && !selected && query.trim().length >= 2;

  return (
    <div className="relative">
      <Field label="Birth place — type a village, town, city or district">
        <input
          className={inputClass}
          placeholder="e.g. Chhapra, Patna, Noida…"
          value={query}
          autoComplete="off"
          onChange={(e) => onQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
      </Field>

      {showList && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-[280px] overflow-y-auto rounded-xl2 border border-line bg-panel-soft shadow-pop">
          {loading && (
            <div className="px-3 py-2.5 text-[12.5px] text-ink-muted">
              <Spinner /> searching…
            </div>
          )}
          {error && <div className="px-3 py-2.5 text-[12.5px] text-danger">{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="px-3 py-2.5 text-[12.5px] text-ink-muted">No match. Try a nearby town.</div>
          )}
          {results.map((p, i) => {
            const meta = [p.admin2, p.admin1, p.country].filter(Boolean).join(' · ');
            return (
              <button
                key={`${p.name}-${p.latitude}-${i}`}
                type="button"
                onMouseDown={() => onSelect(p)}
                className="block w-full border-b border-line px-3 py-2.5 text-left last:border-b-0 hover:bg-accent/15"
              >
                <span className="block text-[14px] font-semibold">{p.name}</span>
                <span className="block text-[11.5px] text-ink-muted">{meta}</span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <p className="mt-1.5 text-[11.5px] text-good">
          ✓ Using {selected.name}
          {selected.admin1 ? `, ${selected.admin1}` : ''} — {selected.latitude.toFixed(3)}°,{' '}
          {selected.longitude.toFixed(3)}°, {selected.timezone}
        </p>
      )}
    </div>
  );
}
