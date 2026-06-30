/**
 * Unit tests for confidence.ts — deterministic scoring.
 */
import { describe, it, expect } from 'vitest';
import { computeConfidence, bookPriorityOf, BOOK_PRIORITY } from '../confidence';

describe('computeConfidence', () => {
  it('returns a number in [0, 1]', () => {
    const score = computeConfidence({
      matchType: 'structured',
      bookCode: 'BPHS',
      priority: 2,
      extractionConfidence: 0.8,
      validationConfidence: null,
      conflictCount: 0,
      corroborationCount: 0,
      isComposite: false,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('structured match > dimension match for same rule', () => {
    const base = {
      bookCode: 'BPHS' as const,
      priority: 2,
      extractionConfidence: 0.8,
      validationConfidence: null,
      conflictCount: 0,
      corroborationCount: 0,
      isComposite: false,
    };
    const structured = computeConfidence({ ...base, matchType: 'structured' });
    const dimension = computeConfidence({ ...base, matchType: 'dimension' });
    expect(structured).toBeGreaterThan(dimension);
  });

  it('BPHS book yields higher score than LOL', () => {
    const base = {
      matchType: 'structured' as const,
      priority: 2,
      extractionConfidence: 0.8,
      validationConfidence: null,
      conflictCount: 0,
      corroborationCount: 0,
      isComposite: false,
    };
    const bphs = computeConfidence({ ...base, bookCode: 'BPHS' });
    const lol = computeConfidence({ ...base, bookCode: 'LOL' });
    expect(bphs).toBeGreaterThan(lol);
  });

  it('more conflicts lower confidence', () => {
    const base = {
      matchType: 'structured' as const,
      bookCode: 'BPHS' as const,
      priority: 2,
      extractionConfidence: 0.8,
      validationConfidence: null,
      corroborationCount: 0,
      isComposite: false,
    };
    const noConflict = computeConfidence({ ...base, conflictCount: 0 });
    const oneConflict = computeConfidence({ ...base, conflictCount: 1 });
    const manyConflicts = computeConfidence({ ...base, conflictCount: 3 });
    expect(noConflict).toBeGreaterThan(oneConflict);
    expect(oneConflict).toBeGreaterThan(manyConflicts);
  });

  it('composite bonus increases score', () => {
    const base = {
      matchType: 'structured' as const,
      bookCode: 'BPHS' as const,
      priority: 2,
      extractionConfidence: 0.7,
      validationConfidence: null,
      conflictCount: 0,
      corroborationCount: 0,
    };
    const simple = computeConfidence({ ...base, isComposite: false });
    const composite = computeConfidence({ ...base, isComposite: true });
    expect(composite).toBeGreaterThan(simple);
  });

  it('validation confidence improves score', () => {
    const base = {
      matchType: 'structured' as const,
      bookCode: 'BPHS' as const,
      priority: 2,
      extractionConfidence: 0.6,
      conflictCount: 0,
      corroborationCount: 0,
      isComposite: false,
    };
    const unvalidated = computeConfidence({ ...base, validationConfidence: null });
    const validated = computeConfidence({ ...base, validationConfidence: 0.9 });
    expect(validated).toBeGreaterThan(unvalidated);
  });

  it('score is deterministic — same input always same output', () => {
    const input = {
      matchType: 'dimension' as const,
      bookCode: 'HORA' as const,
      priority: 3,
      extractionConfidence: 0.65,
      validationConfidence: null,
      conflictCount: 1,
      corroborationCount: 2,
      isComposite: true,
    };
    expect(computeConfidence(input)).toBe(computeConfidence(input));
  });
});

describe('bookPriorityOf', () => {
  it('BPHS has priority 0 (highest)', () => {
    expect(bookPriorityOf('BPHS')).toBe(0);
  });

  it('LOL has lowest priority among known books', () => {
    const known = BOOK_PRIORITY.map(bookPriorityOf);
    expect(bookPriorityOf('LOL')).toBe(Math.max(...known));
  });

  it('unknown book gets a penalty priority beyond all known', () => {
    const known = BOOK_PRIORITY.length - 1;
    expect(bookPriorityOf('UNKNOWN')).toBeGreaterThan(known);
  });
});
