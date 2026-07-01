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
      <Field label="Birth place">
        <input
          className={inputClass}
          placeholder="Village, town, city or district…"
          value={query}
          autoComplete="off"
          onChange={(e) => onQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
      </Field>

      {showList && (
        <div className="home-dropdown">
          {loading && (
            <div className="home-dropdown-status">
              <Spinner /> Searching…
            </div>
          )}
          {error && (
            <div className="home-dropdown-status" style={{ color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="home-dropdown-status">No match — try a nearby town.</div>
          )}
          {results.map((p, i) => {
            const meta = [p.admin2, p.admin1, p.country].filter(Boolean).join(' · ');
            return (
              <button
                key={`${p.name}-${p.latitude}-${i}`}
                type="button"
                onMouseDown={() => onSelect(p)}
                className="home-dropdown-item"
              >
                <span className="home-dropdown-item-name">{p.name}</span>
                {meta && <span className="home-dropdown-item-meta">{meta}</span>}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <p className="home-place-confirm">
          <span>✓</span>
          <span>
            {selected.name}{selected.admin1 ? `, ${selected.admin1}` : ''}
            {' — '}{selected.latitude.toFixed(3)}°, {selected.longitude.toFixed(3)}°
            {' — '}{selected.timezone}
          </span>
        </p>
      )}
    </div>
  );
}
