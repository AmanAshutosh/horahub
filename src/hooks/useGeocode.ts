'use client';
import { useEffect, useState } from 'react';
import type { GeocodeResult } from '@/types/api';
import { useDebounce } from './useDebounce';

interface State {
  results: GeocodeResult[];
  loading: boolean;
  error: string | null;
}

/** Debounced place search against the internal /api/geocode route. */
export function useGeocode(query: string): State {
  const debounced = useDebounce(query.trim(), 300);
  const [state, setState] = useState<State>({ results: [], loading: false, error: null });

  useEffect(() => {
    if (debounced.length < 2) {
      setState({ results: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(`/api/geocode?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((data: { results?: GeocodeResult[] }) => {
        if (!cancelled) setState({ results: data.results ?? [], loading: false, error: null });
      })
      .catch(() => {
        if (!cancelled) setState({ results: [], loading: false, error: 'Location search unavailable.' });
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return state;
}
