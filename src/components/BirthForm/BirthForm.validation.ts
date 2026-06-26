import type { BirthFormState } from './BirthForm.types';

export function validateBirthForm(state: BirthFormState): string | null {
  if (!state.fullName.trim()) return 'Enter a full name.';
  if (!state.birthDate) return 'Enter the date of birth.';
  if (!state.birthTime) return 'Enter the time of birth.';
  if (!state.place) return 'Pick a birth place from the suggestions.';
  return null;
}
