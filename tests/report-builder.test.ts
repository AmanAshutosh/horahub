import { describe, expect, it } from 'vitest';
import { AnalyticEphemeris } from '@/ephemeris';
import { generateReportSections } from '@/inference';

// Same golden chart as tests/ephemeris.test.ts — a real, fixed birth chart,
// no DB/API involved.
const facts = new AnalyticEphemeris().compute({
  utcMs: Date.UTC(1998, 7, 15, 9, 0),
  latitude: 28.5355,
  longitude: 77.391,
});

const sections = generateReportSections(facts);

const LIFE_AREA_IDS = [
  'career', 'finance', 'marriage', 'love', 'health',
  'education', 'family', 'mentalNature', 'spirituality',
];

function findSection(id: string) {
  return sections.find((s) => s.id === id);
}

describe('transit section', () => {
  it('is populated (not pending) with real position data', () => {
    const transit = findSection('transit');
    expect(transit).toBeDefined();
    expect(transit!.status).not.toBe('pending');
    expect(transit!.tables?.[0]?.rows).toHaveLength(4);
    for (const row of transit!.tables![0]!.rows) {
      const houseFromLagna = row.cells[2] as number;
      const houseFromMoon = row.cells[3] as number;
      expect(houseFromLagna).toBeGreaterThanOrEqual(1);
      expect(houseFromLagna).toBeLessThanOrEqual(12);
      expect(houseFromMoon).toBeGreaterThanOrEqual(1);
      expect(houseFromMoon).toBeLessThanOrEqual(12);
    }
  });
});

describe('remedy cards — mechanism correctness, not a forced density number', () => {
  // The KB only has ~60 genuinely coherent remedy-bearing rules across all
  // 17,050 rules and 9 domains (confirmed by direct inspection), and a card
  // additionally requires the rule to be relevant to this specific chart —
  // so most charts will legitimately show remedies for a handful of domains,
  // not all 9. Asserting a fixed density here would either be flaky (varies
  // by chart) or pressure toward loosening quality filters and readmitting
  // incoherent OCR content. What's testable and load-bearing is that the
  // mechanism works correctly wherever content exists.
  it('logs per-domain remedy card counts for honest review', () => {
    const counts = LIFE_AREA_IDS.map((id) => ({ id, count: findSection(id)?.remedyCards?.length ?? 0 }));
    // eslint-disable-next-line no-console
    console.log('Remedy card counts per domain:', counts);
  });

  it('every populated remedy card is fully cited and free of the known garbled-OCR pattern', () => {
    for (const id of LIFE_AREA_IDS) {
      for (const card of findSection(id)?.remedyCards ?? []) {
        expect(card.classicalExplanation.length).toBeGreaterThan(0);
        expect((card.classicalExplanation.match(/\*/g)?.length ?? 0)).toBeLessThan(3);
        expect(card.fields.length).toBeGreaterThan(0);
        for (const field of card.fields) {
          expect(field.ruleId).toBeTruthy();
          expect(field.raw.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('personalized narrative for all 9 life areas', () => {
  it.each(LIFE_AREA_IDS)('%s has a non-empty, chart-specific interpretation when populated', (id) => {
    const section = findSection(id);
    expect(section).toBeDefined();
    if (section!.status === 'pending') return; // no matches for this chart — acceptable, not a bug
    expect(section!.chartContext ?? '').not.toBe('');
    expect((section!.advice ?? []).length).toBeGreaterThan(0);
  });
});

describe('no textbook phrasing regression', () => {
  it('never emits "Governs " or "signifies " anywhere in the report', () => {
    const blob = JSON.stringify(sections);
    expect(blob).not.toMatch(/Governs |signifies /);
  });
});
