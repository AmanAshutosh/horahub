import type { GeocodeResult } from '@/types/api';

export interface BirthFormState {
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string;
  birthTime: string;
  place: GeocodeResult | null;
  placeQuery: string;
}

export const initialBirthForm: BirthFormState = {
  fullName: '',
  gender: 'MALE',
  birthDate: '',
  birthTime: '',
  place: null,
  placeQuery: '',
};
