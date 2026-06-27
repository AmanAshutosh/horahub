/**
 * Parser statistics — per the Pattern Registry, not free-floating regexes.
 * Reads kb/rules/pattern-match-log.json (written by kb-encode.ts: every
 * pattern fire, with up to 5 sample matches each) plus every book's
 * rules.jsonl, and produces kb/reports/parser-stats.json with, per pattern:
 *
 *   - matchCount: how many sentences this exact pattern fired on
 *   - samples: up to 5 (ruleId, raw fragment, full sentence) for a human to
 *     spot-check — this IS the false-positive signal. There is no ground
 *     truth labeling in this pipeline, so a numeric false-positive RATE
 *     would be fabricated; what's reported instead is a low-confidence
 *     match count (extractionConfidence < 0.4) as a proxy, plus the actual
 *     samples to read.
 *   - falseNegativeProxy (grouped by conditionType, not per-pattern, since
 *     several patterns can target the same type): count of rules tagged
 *     with that condition type's related category that still got NO
 *     condition of that type from ANY pattern — an upper bound on what the
 *     registry is missing, not a verified miss count.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadBookRegistry, RULES_DIR, REPORTS_DIR } from './kb-lib/registry';
import { PATTERN_REGISTRY } from './kb-lib/patterns/registry';
import type { Rule, ConditionType } from './kb-lib/rule-schema';

interface PatternStatEntry {
  matchCount: number;
  samples: Array<{ ruleId: string; raw: string; sentence: string }>;
}

/** Which category tag is the closest proxy for "this rule plausibly needed a condition of this type". */
const CONDITION_TYPE_TO_CATEGORY: Record<ConditionType, string | null> = {
  'planet-in-house': 'house',
  'planet-in-sign': 'sign',
  'planet-conjunction': 'planet',
  'planet-dignity': 'planet',
  'planet-aspect': 'planet',
  'house-lord-strength': 'house',
  'dasha-period': 'dasha',
  'nakshatra-placement': 'nakshatra',
  'yoga-presence': 'yoga',
  unstructured: null,
};

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
  const logPath = join(RULES_DIR, 'pattern-match-log.json');
  if (!existsSync(logPath)) {
    console.error('No kb/rules/pattern-match-log.json — run kb:encode first.');
    return;
  }
  const log = JSON.parse(readFileSync(logPath, 'utf8')) as Record<string, PatternStatEntry>;
  const rules = loadAllRules();

  const lowConfidenceByPattern: Record<string, number> = {};
  for (const r of rules) {
    for (const id of r.patternIds) {
      if (r.extractionConfidence < 0.4) lowConfidenceByPattern[id] = (lowConfidenceByPattern[id] ?? 0) + 1;
    }
  }

  const patternStats = PATTERN_REGISTRY.map((rule) => {
    const entry = log[rule.id] ?? { matchCount: 0, samples: [] };
    return {
      id: rule.id,
      conditionType: rule.conditionType,
      description: rule.description,
      variants: rule.variants,
      matchCount: entry.matchCount,
      lowConfidenceMatches: lowConfidenceByPattern[rule.id] ?? 0,
      samples: entry.samples,
    };
  });

  const conditionTypes = [...new Set(PATTERN_REGISTRY.map((r) => r.conditionType))];
  const falseNegativeProxy = conditionTypes.map((conditionType) => {
    const category = CONDITION_TYPE_TO_CATEGORY[conditionType];
    if (!category) return { conditionType, category: null, candidatePool: 0, stillMissing: 0 };
    const candidatePool = rules.filter((r) => r.categories.includes(category)).length;
    const stillMissing = rules.filter(
      (r) => r.categories.includes(category) && !(r.structuredRule?.conditions ?? []).some((c) => c.type === conditionType),
    ).length;
    return { conditionType, category, candidatePool, stillMissing };
  });

  mkdirSync(REPORTS_DIR, { recursive: true });
  const report = {
    totalPatterns: PATTERN_REGISTRY.length,
    totalRulesScanned: rules.length,
    patternStats,
    falseNegativeProxy,
    note:
      'lowConfidenceMatches and falseNegativeProxy are automated heuristic proxies, not verified false-positive/negative rates — ' +
      'there is no labeled ground truth in this pipeline. Read `samples` per pattern to actually spot-check matches. ' +
      'falseNegativeProxy.stillMissing is an upper bound: it counts category-tagged rules with no condition of that exact type, ' +
      'some of which may genuinely have no extractable condition at all (TOC lines, fragments, narrative prose).',
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(REPORTS_DIR, 'parser-stats.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('=== Pattern Registry stats ===');
  for (const p of patternStats) {
    console.log(`  ${p.id.padEnd(28)} matches=${p.matchCount}  lowConfidence=${p.lowConfidenceMatches}`);
  }
  console.log('\n=== False-negative proxy (by condition type) ===');
  for (const f of falseNegativeProxy) {
    console.log(`  ${f.conditionType.padEnd(22)} category=${f.category ?? 'n/a'}  pool=${f.candidatePool}  stillMissing=${f.stillMissing}`);
  }
  console.log('\nWritten to kb/reports/parser-stats.json');
}

main();
