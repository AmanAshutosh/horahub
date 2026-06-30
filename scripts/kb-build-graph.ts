#!/usr/bin/env tsx
/**
 * KB → Knowledge Graph build script.
 *
 * Usage:
 *   npm run kg:build
 *
 * Reads: kb/rules/<book>/rules.jsonl  (all four books)
 *        kb/reports/conflicts.json     (inter-rule conflicts)
 * Writes:
 *   kb/graph/graph.json       — full graph (nodes + edges + meta)
 *   kb/graph/adjacency.json   — nodeId → edgeId[] adjacency index
 *   kb/graph/viz.json         — visualization-ready format (no Rule nodes)
 *   kb/graph/stats.json       — graph statistics summary
 */

import * as fs from 'fs';
import * as path from 'path';
import { buildKnowledgeGraph } from './kg/builder';
import { toFilteredVizGraph, summarizeGraph } from './kg/visualize';

const ROOT = path.join(__dirname, '..');
const RULES_DIR = path.join(ROOT, 'kb', 'rules');
const CONFLICTS_PATH = path.join(ROOT, 'kb', 'reports', 'conflicts.json');
const OUT_DIR = path.join(ROOT, 'kb', 'graph');

// KB version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as { version?: string };
const KB_VERSION = pkg.version ?? '0.0.0';

function write(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  const bytes = fs.statSync(filePath).size;
  console.log(`  wrote  ${path.relative(ROOT, filePath)}  (${(bytes / 1024).toFixed(1)} KB)`);
}

async function main(): Promise<void> {
  console.log('\n⬡  HoraHub Knowledge Graph Builder');
  console.log('────────────────────────────────────');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── 1. Build graph ──────────────────────────────────────────────────────────
  console.log('\n[1/4] Building graph from KB rules…');
  const t0 = Date.now();
  const { graph, adjacency } = buildKnowledgeGraph({
    rulesDir: RULES_DIR,
    conflictsPath: CONFLICTS_PATH,
    kbVersion: KB_VERSION,
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

  console.log(`      ${graph.meta.totalNodes.toLocaleString()} nodes`);
  console.log(`      ${graph.meta.totalEdges.toLocaleString()} edges`);
  console.log(`      ${graph.meta.totalRulesIndexed.toLocaleString()} rules ingested`);
  console.log(`      completed in ${elapsed}s`);

  // ── 2. Write main graph ─────────────────────────────────────────────────────
  console.log('\n[2/4] Writing graph files…');
  write(path.join(OUT_DIR, 'graph.json'), graph);
  write(path.join(OUT_DIR, 'adjacency.json'), adjacency);

  // ── 3. Write visualization export (excludes Rule nodes — too many) ──────────
  console.log('\n[3/4] Writing visualization export…');
  const viz = toFilteredVizGraph(graph, adjacency, {
    excludeNodeTypes: ['Rule'],
    minEdgeWeight: 0,
  });
  write(path.join(OUT_DIR, 'viz.json'), viz);
  console.log(`      ${viz.nodes.length} viz nodes, ${viz.edges.length} viz edges`);

  // ── 4. Write stats ──────────────────────────────────────────────────────────
  console.log('\n[4/4] Writing stats…');
  const stats = summarizeGraph(graph);
  write(path.join(OUT_DIR, 'stats.json'), stats);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n── Node counts by type ─────────────────────');
  const nc = graph.meta.nodeCountByType as Record<string, number>;
  for (const [type, count] of Object.entries(nc).sort(([, a], [, b]) => b - a)) {
    console.log(`   ${type.padEnd(18)} ${count.toLocaleString()}`);
  }
  console.log('\n── Edge counts by type ─────────────────────');
  const ec = graph.meta.edgeCountByType as Record<string, number>;
  for (const [type, count] of Object.entries(ec).sort(([, a], [, b]) => b - a)) {
    console.log(`   ${type.padEnd(18)} ${count.toLocaleString()}`);
  }
  console.log('\n── Top yogas by rule mentions ──────────────');
  for (const { name, mentions } of stats.topYogas) {
    console.log(`   ${String(mentions).padStart(4)}x  ${name}`);
  }

  console.log('\n✓  Knowledge Graph built successfully.\n');
}

main().catch((err) => {
  console.error('\n✗  Build failed:', err);
  process.exit(1);
});
