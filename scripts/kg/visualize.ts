/**
 * Visualization export helpers.
 *
 * Converts the KnowledgeGraph into formats suitable for graph rendering
 * libraries (D3-force, Sigma.js, Cytoscape.js, etc.).
 *
 * No UI code here — these are pure data transformers that a future admin
 * page can import to drive any visualization library it chooses.
 */

import type { KnowledgeGraph as KGData, GraphNode, GraphEdge } from './schema';

// ── D3 / Sigma compatible format ─────────────────────────────────────────────

export interface VizNode {
  id: string;
  label: string;
  type: string;
  /** Numeric size hint: larger = more edges */
  size: number;
  /** Color code by node type */
  color: string;
  /** x/y hints — layout engine can override */
  x?: number;
  y?: number;
  /** Original properties bag for tooltip rendering */
  data: Record<string, unknown>;
}

export interface VizEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  /** Edge weight → thickness hint for the renderer */
  weight: number;
  color: string;
  data: Record<string, unknown>;
}

export interface VizGraph {
  nodes: VizNode[];
  edges: VizEdge[];
  meta: {
    totalNodes: number;
    totalEdges: number;
    builtAt: string;
    kbVersion: string;
  };
}

// Color palette by node type
const NODE_COLORS: Record<string, string> = {
  Planet:          '#f59e0b', // amber
  House:           '#3b82f6', // blue
  Sign:            '#8b5cf6', // violet
  Nakshatra:       '#06b6d4', // cyan
  Yoga:            '#10b981', // emerald
  Dasha:           '#f97316', // orange
  Antardasha:      '#fb923c', // light orange
  DivisionalChart: '#64748b', // slate
  Rule:            '#94a3b8', // light slate (most numerous — keep subtle)
  Book:            '#e11d48', // rose
  Chapter:         '#be123c', // dark rose
  Verse:           '#9f1239', // darkest rose
  Remedy:          '#84cc16', // lime
  Category:        '#a855f7', // purple
};

// Color palette by edge type
const EDGE_COLORS: Record<string, string> = {
  occupies:      '#3b82f6',
  posited_in:    '#8b5cf6',
  aspects:       '#ef4444',
  conjunct_with: '#f59e0b',
  in_nakshatra:  '#06b6d4',
  supported_by:  '#e11d48',
  references:    '#be123c',
  in_chapter:    '#9f1239',
  belongs_to:    '#64748b',
  depends_on:    '#f97316',
  related_to:    '#94a3b8',
  contradicts:   '#dc2626',
  corroborates:  '#16a34a',
  affects:       '#a855f7',
  has_chapter:   '#be123c',
  has_verse:     '#9f1239',
  forms_yoga:    '#10b981',
  active_during: '#f97316',
  prescribes:    '#84cc16',
  applies_in:    '#64748b',
};

function nodeSize(adjacencyCount: number): number {
  if (adjacencyCount === 0) return 4;
  if (adjacencyCount < 5) return 6;
  if (adjacencyCount < 20) return 10;
  if (adjacencyCount < 100) return 16;
  return 24;
}

export function toVizGraph(graph: KGData, adjacencyIndex: Record<string, string[]>): VizGraph {
  const vizNodes: VizNode[] = graph.nodes.map((n: GraphNode) => ({
    id: n.id,
    label: n.label,
    type: n.type,
    size: nodeSize((adjacencyIndex[n.id] ?? []).length),
    color: NODE_COLORS[n.type] ?? '#94a3b8',
    data: n.properties,
  }));

  const vizEdges: VizEdge[] = graph.edges.map((e: GraphEdge) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.type,
    weight: e.weight,
    color: EDGE_COLORS[e.type] ?? '#64748b',
    data: e.properties,
  }));

  return {
    nodes: vizNodes,
    edges: vizEdges,
    meta: {
      totalNodes: graph.meta.totalNodes,
      totalEdges: graph.meta.totalEdges,
      builtAt: graph.meta.builtAt,
      kbVersion: graph.meta.kbVersion,
    },
  };
}

// ── Filtered subgraph export ──────────────────────────────────────────────────

/**
 * Export only nodes of specific types — useful to render a simplified view
 * without the 8000+ Rule nodes drowning the canvas.
 */
export function toFilteredVizGraph(
  graph: KGData,
  adjacencyIndex: Record<string, string[]>,
  opts: {
    includeNodeTypes?: string[];
    excludeNodeTypes?: string[];
    maxNodes?: number;
    minEdgeWeight?: number;
  } = {},
): VizGraph {
  const { includeNodeTypes, excludeNodeTypes, maxNodes = 5000, minEdgeWeight = 0 } = opts;

  const eligibleNodes = new Set(
    graph.nodes
      .filter((n: GraphNode) => {
        if (includeNodeTypes && !includeNodeTypes.includes(n.type)) return false;
        if (excludeNodeTypes && excludeNodeTypes.includes(n.type)) return false;
        return true;
      })
      .slice(0, maxNodes)
      .map((n: GraphNode) => n.id),
  );

  const filteredNodes = graph.nodes.filter((n: GraphNode) => eligibleNodes.has(n.id));
  const filteredEdges = graph.edges.filter(
    (e: GraphEdge) =>
      eligibleNodes.has(e.source) &&
      eligibleNodes.has(e.target) &&
      e.weight >= minEdgeWeight,
  );

  return toVizGraph({ ...graph, nodes: filteredNodes, edges: filteredEdges }, adjacencyIndex);
}

// ── Stats summary (for admin dashboard cards) ─────────────────────────────────

export interface GraphStatsSummary {
  totalNodes: number;
  totalEdges: number;
  ruleCount: number;
  bookCount: number;
  yogaCount: number;
  categoryCount: number;
  edgeDensity: number;
  topYogas: Array<{ name: string; mentions: number }>;
  builtAt: string;
  kbVersion: string;
}

export function summarizeGraph(graph: KGData): GraphStatsSummary {
  const nodeCounts = graph.meta.nodeCountByType as Record<string, number>;

  const yogaNodes = graph.nodes
    .filter((n: GraphNode) => n.type === 'Yoga')
    .map((n: GraphNode) => ({ name: n.label, mentions: (n.properties['mentions'] as number) ?? 0 }))
    .sort((a: { mentions: number }, b: { mentions: number }) => b.mentions - a.mentions)
    .slice(0, 10);

  return {
    totalNodes: graph.meta.totalNodes,
    totalEdges: graph.meta.totalEdges,
    ruleCount: nodeCounts['Rule'] ?? 0,
    bookCount: nodeCounts['Book'] ?? 0,
    yogaCount: nodeCounts['Yoga'] ?? 0,
    categoryCount: nodeCounts['Category'] ?? 0,
    edgeDensity:
      graph.meta.totalNodes > 0
        ? Number((graph.meta.totalEdges / graph.meta.totalNodes).toFixed(2))
        : 0,
    topYogas: yogaNodes,
    builtAt: graph.meta.builtAt,
    kbVersion: graph.meta.kbVersion,
  };
}
