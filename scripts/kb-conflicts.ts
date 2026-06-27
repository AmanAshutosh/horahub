/**
 * Conflict detection — detect only, never resolve. Per explicit instruction:
 * if BPHS says X and Horasara says Y about the same condition, both are
 * flagged for manual review; this script does not decide who is right.
 *
 * Only rules with a structuredRule (a machine-comparable condition set) can
 * be compared at all — the ~90% of rules without one are out of scope for
 * this pass and are not silently treated as agreeing or disagreeing with
 * anything.
 *
 * Two tiers, both purely descriptive:
 *   - "overlap": rules from different books share the exact same condition
 *     signature. They may well agree — a human has to read both.
 *   - "conflict": same signature, AND their detected effect direction
 *     differs (increase vs decrease) — the strongest text-level signal that
 *     two books are making opposite claims about the same condition.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadBookRegistry, RULES_DIR, REPORTS_DIR } from './kb-lib/registry';
import type { Rule, RuleCondition } from './kb-lib/rule-schema';

/** Returns null for conditions too generic to be conflict-comparable (e.g. "aspected" with no named aspecting planet). */
function conditionSignature(c: RuleCondition): string | null {
  if (c.type === 'planet-aspect' && !c.aspectingPlanet) return null; // "Moon aspected by someone" matches everything — not a real signal
  if (c.type === 'planet-conjunction') return null; // raw capture doesn't pin down which two planets specifically enough yet
  return [
    c.type, c.planet ?? '', c.house ?? '', c.sign ?? '', c.dignity ?? '',
    c.aspectingPlanet ?? '', c.nakshatra ?? '', c.yoga ?? '', c.antardashaPlanet ?? '',
  ].join(':');
}

function ruleSignature(r: Rule): string | null {
  if (!r.structuredRule || r.structuredRule.conditions.length === 0) return null;
  const sigs = r.structuredRule.conditions.map(conditionSignature).filter((s): s is string => s != null);
  if (sigs.length === 0) return null;
  return sigs.sort().join('|');
}

function loadAllRules(): Rule[] {
  const rules: Rule[] = [];
  for (const book of loadBookRegistry()) {
    const path = join(RULES_DIR, book.slug, 'rules.jsonl');
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) rules.push(JSON.parse(line) as Rule);
  }
  return rules;
}

function main() {
  const rules = loadAllRules();
  const bySignature = new Map<string, Rule[]>();
  for (const r of rules) {
    const sig = ruleSignature(r);
    if (!sig) continue;
    if (!bySignature.has(sig)) bySignature.set(sig, []);
    bySignature.get(sig)!.push(r);
  }

  const overlaps: Array<{ signature: string; rules: Pick<Rule, 'id' | 'book' | 'bookCode' | 'chapter' | 'verse' | 'translation'>[] }> = [];
  const conflicts: Array<{
    signature: string;
    rules: Array<Pick<Rule, 'id' | 'book' | 'bookCode' | 'chapter' | 'verse' | 'translation'> & { direction: string }>;
  }> = [];

  for (const [signature, group] of bySignature) {
    const distinctBooks = new Set(group.map((r) => r.book));
    if (distinctBooks.size < 2) continue; // only cross-book overlaps are in scope

    const summary = group.map((r) => ({
      id: r.id,
      book: r.book,
      bookCode: r.bookCode,
      chapter: r.chapter,
      verse: r.verse,
      translation: r.translation,
    }));
    overlaps.push({ signature, rules: summary });

    const directions = new Set(group.map((r) => r.structuredRule!.effect.direction));
    if (directions.has('increase') && directions.has('decrease')) {
      conflicts.push({
        signature,
        rules: group.map((r) => ({
          id: r.id,
          book: r.book,
          bookCode: r.bookCode,
          chapter: r.chapter,
          verse: r.verse,
          translation: r.translation,
          direction: r.structuredRule!.effect.direction,
        })),
      });
    }
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const report = {
    totalRulesScanned: rules.length,
    rulesWithStructuredConditions: rules.filter((r) => ruleSignature(r) != null).length,
    crossBookOverlaps: overlaps.length,
    directConflicts: conflicts.length,
    overlaps,
    conflicts,
    note:
      'overlaps = same structured condition signature across 2+ books (may or may not actually agree — read both). ' +
      'conflicts = same signature with opposite detected effect direction (increase vs decrease) — the strongest available signal of disagreement. ' +
      'Nothing here is resolved; this script only flags for manual review.',
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(REPORTS_DIR, 'conflicts.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log(
    `Scanned ${rules.length} rules: ${report.rulesWithStructuredConditions} have structured conditions, ` +
      `${overlaps.length} cross-book overlaps, ${conflicts.length} direction conflicts → kb/reports/conflicts.json`,
  );
}

main();
