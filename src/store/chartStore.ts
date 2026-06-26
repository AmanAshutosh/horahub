'use client';
import { create } from 'zustand';
import type { GenerateChartResponse } from '@/types/api';

interface ChartStore {
  result: GenerateChartResponse | null;
  setResult: (r: GenerateChartResponse | null) => void;
}

export const useChartStore = create<ChartStore>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
}));
