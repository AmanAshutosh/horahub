import { describe, expect, it } from 'vitest';
import { AnalyticEphemeris } from '@/ephemeris';
import { interpret } from '@/interpret';
import { loadKnowledgeBase } from '@/kb';

describe('interpret', () => {
  const facts = new AnalyticEphemeris().compute({
    utcMs: Date.UTC(1998, 7, 15, 9, 0), latitude: 28.5355, longitude: 77.391,
  });
  const sections = interpret(facts, loadKnowledgeBase());

  it('produces planets, houses and effects sections', () => {
    expect(sections.map((s) => s.id)).toEqual(['planets', 'houses', 'effects']);
  });

  it('attaches a citation to every planet item', () => {
    const planets = sections.find((s) => s.id === 'planets')!;
    expect(planets.items).toHaveLength(9);
    for (const item of planets.items) expect(item.citation?.ref).toBeTruthy();
  });

  it('never emits a confidence score', () => {
    const blob = JSON.stringify(sections).toLowerCase();
    expect(blob).not.toContain('confidence');
    expect(blob).not.toMatch(/\d+%/);
  });
});
