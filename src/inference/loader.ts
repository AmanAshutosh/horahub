/**
 * Singleton loaders for the inference engine.
 *
 * Loads the pre-built Knowledge Graph (kb/graph/) and the full rule index
 * (kb/rules/*\/rules.jsonl) once per process and caches them in memory.
 *
 * The graph gives us O(1) entity → rule-set lookups via the adjacency index.
 * The rule index gives us the full Rule record (including structuredRule
 * conditions) for condition checking — the graph stores only a properties
 * summary, not the parsed conditions.
 *
 * Server-only: uses fs — must never be imported in client-side code.
 */
import 'server-only';
import * as fs from 'fs';
import * as path from 'path';
import type { Rule } from '../../scripts/kb-lib/rule-schema';
import { KnowledgeGraph, loadGraph } from '../../scripts/kg/query';

// ── Paths ─────────────────────────────────────────────────────────────────────

function graphDir(): string {
  return path.join(process.cwd(), 'kb', 'graph');
}

function rulesDir(): string {
  return path.join(process.cwd(), 'kb', 'rules');
}

// ── Rule index singleton ──────────────────────────────────────────────────────

let _ruleIndex: Map<string, Rule> | null = null;

/** Loads all rules from all book JSONL files into a Map<ruleId, Rule>. */
export function getRuleIndex(): Map<string, Rule> {
  if (_ruleIndex) return _ruleIndex;

  const index = new Map<string, Rule>();
  const dir = rulesDir();

  if (!fs.existsSync(dir)) {
    return index;
  }

  const books = fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const book of books) {
    const jsonlPath = path.join(dir, book, 'rules.jsonl');
    if (!fs.existsSync(jsonlPath)) continue;
    const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const rule = JSON.parse(line) as Rule;
        index.set(rule.id, rule);
      } catch {
        // malformed line — skip
      }
    }
  }

  _ruleIndex = index;
  return index;
}

// ── KG query singleton ────────────────────────────────────────────────────────

let _kg: KnowledgeGraph | null = null;

/** Returns the KnowledgeGraph query instance (loaded once, cached). */
export function getKnowledgeGraph(): KnowledgeGraph | null {
  if (_kg) return _kg;

  const dir = graphDir();
  if (!fs.existsSync(path.join(dir, 'graph.json'))) {
    return null;
  }

  try {
    const { graph, adjacency } = loadGraph(dir);
    _kg = new KnowledgeGraph(graph, adjacency);
    return _kg;
  } catch {
    return null;
  }
}

/** Returns the rule record for a given rule ID, or undefined if not found. */
export function getRule(ruleId: string): Rule | undefined {
  return getRuleIndex().get(ruleId);
}

/** Flush singletons. For testing only. */
export function _resetLoaderCache(): void {
  _ruleIndex = null;
  _kg = null;
}
