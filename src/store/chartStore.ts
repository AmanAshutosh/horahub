'use client';
import { create } from 'zustand';
import type { GenerateChartResponse } from '@/types/api';
import type { PersonInfo } from '@/types/report';

interface ChartStore {
  result: GenerateChartResponse | null;
  person: PersonInfo | null;
  setResult: (r: GenerateChartResponse | null) => void;
  setPerson: (p: PersonInfo | null) => void;
}

export const useChartStore = create<ChartStore>((set) => ({
  result: null,
  person: null,
  setResult: (result) => set({ result }),
  setPerson: (person) => set({ person }),
}));
