/**
 * Stage 5 of the KB pipeline: index.
 *
 * Scans every kb/rules/<book>/rules.jsonl and builds inverted indexes so a
 * future query ("rules touching Mercury in the 5th house") is a direct
 * lookup, not a scan of the whole rule set. Every index maps a dimension
 * value to an array of permanent rule IDs; kb/rules/index/by-id.json is the
 * single denormalized map from rule ID to the full rule record, so a
 * consumer goes index-hit → by-id lookup with no file scanning at any step.
 *
 * Indexes are rebuilt from scratch each run — they are derived data, never
 * hand-edited. Adding a book requires no changes here.
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadBookRegistry, RULES_DIR } from './kb-lib/registry';
import type { Rule } from './kb-lib/rule-schema';

const INDEX_DIR = join(RULES_DIR, 'index');

const ANTARDASHA_RE = /\b(antardasha|antardasa|bhukti)\b/i;

function pushTo(map: Map<string, Set<string>>, key: string | number, ruleId: string) {
  const k = String(key);
  if (!map.has(k)) map.set(k, new Set());
  map.get(k)!.add(ruleId);
}

function mapToObject(map: Map<string, Set<string>>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of map) out[k] = [...v].sort();
  return out;
}

function loadAllRules(): Rule[] {
  const books = loadBookRegistry();
  const rules: Rule[] = [];
  for (const book of books) {
    const path = join(RULES_DIR, book.slug, 'rules.jsonl');
    if (!existsSync(path)) {
      console.error(`WARN: no rules for ${book.slug} yet (run kb:encode first)`);
      continue;
    }
    const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) rules.push(JSON.parse(line) as Rule);
  }
  return rules;
}

function main() {
  mkdirSync(INDEX_DIR, { recursive: true });
  const rules = loadAllRules();

  const byPlanet = new Map<string, Set<string>>();
  const bySecondaryPoint = new Map<string, Set<string>>();
  const byHouse = new Map<string, Set<string>>();
  const bySign = new Map<string, Set<string>>();
  const byNakshatra = new Map<string, Set<string>>();
  const byYoga = new Map<string, Set<string>>();
  const byDasha = new Map<string, Set<string>>();
  const byAntardasha = new Map<string, Set<string>>();
  const byTransit = new Map<string, Set<string>>();
  const byDivisionalChart = new Map<string, Set<string>>();
  const byRemedy = new Map<string, Set<string>>();
  const byCategory = new Map<string, Set<string>>();
  const byBook = new Map<string, Set<string>>();
  const byChapter = new Map<string, Set<string>>();
  const byId: Record<string, Rule> = {};

  for (const r of rules) {
    byId[r.id] = r;
    for (const p of r.dimensions.planets) pushTo(byPlanet, p, r.id);
    for (const sp of r.dimensions.secondaryPoints) pushTo(bySecondaryPoint, sp, r.id);
    for (const h of r.dimensions.houses) pushTo(byHouse, h, r.id);
    for (const s of r.dimensions.signs) pushTo(bySign, s, r.id);
    for (const n of r.dimensions.nakshatras) pushTo(byNakshatra, n, r.id);
    for (const y of r.dimensions.yogas) pushTo(byYoga, y, r.id);
    for (const dp of r.dimensions.dashaPlanets) {
      pushTo(byDasha, dp, r.id);
      if (ANTARDASHA_RE.test(r.translation)) pushTo(byAntardasha, dp, r.id);
    }
    for (const dc of r.dimensions.divisionalCharts) pushTo(byDivisionalChart, dc, r.id);
    for (const rt of r.dimensions.remedyTypes) pushTo(byRemedy, rt, r.id);
    for (const c of r.categories) pushTo(byCategory, c, r.id);
    if (r.categories.includes('transit')) pushTo(byTransit, 'general', r.id); // no specific transit target is parsed yet — see kb-lib/rule-schema.ts
    pushTo(byBook, r.book, r.id);
    if (r.chapter != null) pushTo(byChapter, `${r.book}/${r.chapter}`, r.id);
  }

  const indexes: [string, Map<string, Set<string>>][] = [
    ['by-planet', byPlanet],
    ['by-secondary-point', bySecondaryPoint],
    ['by-house', byHouse],
    ['by-sign', bySign],
    ['by-nakshatra', byNakshatra],
    ['by-yoga', byYoga],
    ['by-dasha', byDasha],
    ['by-antardasha', byAntardasha],
    ['by-transit', byTransit],
    ['by-divisional-chart', byDivisionalChart],
    ['by-remedy', byRemedy],
    ['by-category', byCategory],
    ['by-book', byBook],
    ['by-chapter', byChapter],
  ];

  for (const [name, map] of indexes) {
    writeFileSync(join(INDEX_DIR, `${name}.json`), JSON.stringify(mapToObject(map), null, 2), 'utf8');
  }
  writeFileSync(join(INDEX_DIR, 'by-id.json'), JSON.stringify(byId, null, 2), 'utf8');

  const manifest = {
    totalRules: rules.length,
    indexes: indexes.map(([name, map]) => ({ name, keys: map.size })),
    generatedAt: new Date().toISOString(),
    note: 'Derived data, rebuilt from scratch each run by kb-index.ts. by-transit has no specific target value yet — see by-transit.json limitation note in kb-lib/rule-schema.ts comments.',
  };
  writeFileSync(join(INDEX_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`Indexed ${rules.length} rules across ${loadBookRegistry().length} books:`);
  for (const [name, map] of indexes) console.log(`  ${name.padEnd(20)} ${map.size} keys`);
}

main();
