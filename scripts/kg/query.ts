/**
 * Knowledge Graph query layer.
 *
 * Loads the pre-built graph from kb/graph/ and exposes named query functions.
 * Every function returns a QueryResult: the relevant subgraph (nodes + edges)
 * plus full Evidence records for every Rule node in the result.
 *
 * No reasoning, no inference, no ranking beyond edge weight.
 * The caller receives raw connected knowledge and decides what to do with it.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  KnowledgeGraph as KnowledgeGraphData,
  GraphNode,
  GraphEdge,
  AdjacencyIndex,
  Evidence,
  QueryResult,
} from './schema';

// ── Graph loader (singleton per process) ──────────────────────────────────────

let _graph: KnowledgeGraphData | null = null;
let _adjacency: AdjacencyIndex | null = null;

export function loadGraph(graphDir: string): { graph: KnowledgeGraphData; adjacency: AdjacencyIndex } {
  if (_graph && _adjacency) return { graph: _graph, adjacency: _adjacency };

  const graphPath = path.join(graphDir, 'graph.json');
  const adjPath = path.join(graphDir, 'adjacency.json');

  if (!fs.existsSync(graphPath)) {
    throw new Error(`Knowledge Graph not found at ${graphPath}. Run: npm run kg:build`);
  }

  _graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8')) as KnowledgeGraphData;
  _adjacency = JSON.parse(fs.readFileSync(adjPath, 'utf-8')) as AdjacencyIndex;

  return { graph: _graph, adjacency: _adjacency };
}

/** Flush the singleton (for testing). */
export function resetGraphCache(): void {
  _graph = null;
  _adjacency = null;
}

// ── KnowledgeGraph class ──────────────────────────────────────────────────────

export class KnowledgeGraph {
  private nodeById: Map<string, GraphNode>;
  private edgeById: Map<string, GraphEdge>;
  private adjacency: AdjacencyIndex;

  constructor(graph: KnowledgeGraphData, adjacency: AdjacencyIndex) {
    this.nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    this.edgeById = new Map(graph.edges.map((e) => [e.id, e]));
    this.adjacency = adjacency;
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private node(id: string): GraphNode | undefined {
    return this.nodeById.get(id);
  }

  private edgesOf(nodeId: string): GraphEdge[] {
    const ids = this.adjacency[nodeId] ?? [];
    return ids.map((id) => this.edgeById.get(id)).filter(Boolean) as GraphEdge[];
  }

  /** All edges where source=nodeId and type=edgeType */
  private outEdges(nodeId: string, type?: string): GraphEdge[] {
    return this.edgesOf(nodeId).filter(
      (e) => e.source === nodeId && (type === undefined || e.type === type),
    );
  }

  /** All edges where target=nodeId and type=edgeType */
  private inEdges(nodeId: string, type?: string): GraphEdge[] {
    return this.edgesOf(nodeId).filter(
      (e) => e.target === nodeId && (type === undefined || e.type === type),
    );
  }

  /** Collect rule nodes reachable via a specific in-edge type pointing to anchorId */
  private ruleNodesVia(anchorId: string, edgeType: string): GraphNode[] {
    return this.inEdges(anchorId, edgeType)
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
  }

  /** Build Evidence from a Rule node */
  private evidence(ruleNode: GraphNode): Evidence {
    const p = ruleNode.properties as {
      book: string;
      bookCode: string;
      chapter: string | null;
      verse: string | null;
      extractionConfidence: number;
      validationConfidence: number | null;
      patternIds: string[];
      sourceText: string;
      characterSpan: [number, number] | null;
      categories: string[];
    };
    return {
      ruleId: ruleNode.id.replace('rule:', ''),
      book: p.book,
      bookCode: p.bookCode,
      chapter: p.chapter,
      verse: p.verse,
      extractionConfidence: p.extractionConfidence,
      validationConfidence: p.validationConfidence,
      patternIds: p.patternIds,
      sourceText: p.sourceText,
      characterSpan: p.characterSpan,
      categories: p.categories,
    };
  }

  /** Assemble a QueryResult from a set of rule nodes + a seed set of anchor edges */
  private buildResult(
    queryType: string,
    queryValue: string | number,
    ruleNodes: GraphNode[],
    anchorEdges: GraphEdge[],
  ): QueryResult {
    // Collect supporting nodes (book, chapter, verse, category) for each rule
    const nodeSet = new Map<string, GraphNode>();
    const edgeSet = new Map<string, GraphEdge>();

    for (const rn of ruleNodes) {
      nodeSet.set(rn.id, rn);
      for (const e of this.outEdges(rn.id)) {
        const target = this.node(e.target);
        if (target) {
          edgeSet.set(e.id, e);
          nodeSet.set(target.id, target);
        }
      }
    }
    for (const e of anchorEdges) {
      edgeSet.set(e.id, e);
      const src = this.node(e.source);
      const tgt = this.node(e.target);
      if (src) nodeSet.set(src.id, src);
      if (tgt) nodeSet.set(tgt.id, tgt);
    }

    const evidence = ruleNodes.map((n) => this.evidence(n));
    // Sort by extractionConfidence descending
    evidence.sort((a, b) => b.extractionConfidence - a.extractionConfidence);

    return {
      nodes: Array.from(nodeSet.values()),
      edges: Array.from(edgeSet.values()),
      evidence,
      query: { type: queryType, value: queryValue },
      totalMatches: ruleNodes.length,
    };
  }

  // ── Public query API ────────────────────────────────────────────────────────

  /**
   * All rules mentioning a specific planet.
   * Includes structured-condition rules (planet-in-house, planet-aspect, etc.)
   * and dimension-tagged rules that merely mention the planet.
   */
  findRulesByPlanet(planet: string): QueryResult {
    const planetId = `planet:${planet}`;
    const anchorEdges = this.inEdges(planetId, 'belongs_to')
      .concat(this.inEdges(planetId, 'occupies'))
      .concat(this.inEdges(planetId, 'aspects'))
      .concat(this.inEdges(planetId, 'conjunct_with'))
      .concat(this.inEdges(planetId, 'posited_in'));
    const ruleNodes = anchorEdges
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(ruleNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('planet', planet, unique, anchorEdges);
  }

  /** All rules mentioning a specific house number. */
  findRulesByHouse(house: number): QueryResult {
    const houseId = `house:${house}`;
    const anchorEdges = this.inEdges(houseId, 'belongs_to')
      .concat(this.inEdges(houseId, 'occupies'));
    const ruleNodes = anchorEdges
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(ruleNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('house', house, unique, anchorEdges);
  }

  /** All rules tagged with a specific category (e.g. 'career', 'marriage'). */
  findRulesByCategory(category: string): QueryResult {
    const catId = `category:${category}`;
    const anchorEdges = this.inEdges(catId, 'belongs_to').concat(this.inEdges(catId, 'affects'));
    const ruleNodes = anchorEdges
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(ruleNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('category', category, unique, anchorEdges);
  }

  /** All rules that reference a named yoga (e.g. 'Gajakesari Yoga'). */
  findRulesByYoga(yoga: string): QueryResult {
    const yogaId = `yoga:${yoga}`;
    const anchorEdges = this.inEdges(yogaId, 'forms_yoga');
    const ruleNodes = anchorEdges
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(ruleNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('yoga', yoga, unique, anchorEdges);
  }

  /** All rules active during a specific dasha lord (Mahadasha). */
  findRulesByDasha(dashaLord: string): QueryResult {
    const dashaId = `dasha:${dashaLord}`;
    const anchorEdges = this.inEdges(dashaId, 'active_during');
    const ruleNodes = anchorEdges
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(ruleNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('dasha', dashaLord, unique, anchorEdges);
  }

  /** All rules that reference a specific nakshatra. */
  findRulesByNakshatra(nakshatra: string): QueryResult {
    const nid = `nakshatra:${nakshatra}`;
    const anchorEdges = this.inEdges(nid, 'in_nakshatra');
    const ruleNodes = anchorEdges
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(ruleNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('nakshatra', nakshatra, unique, anchorEdges);
  }

  /**
   * Supporting evidence for a rule: other rules from different books
   * that share the same planet+house or planet+sign condition (corroboration
   * edges), plus all verses the rule directly references.
   */
  findSupportingEvidence(ruleId: string): Evidence[] {
    const ruleNodeId = `rule:${ruleId}`;
    const ruleNode = this.node(ruleNodeId);
    if (!ruleNode) return [];

    const evidenceList: Evidence[] = [this.evidence(ruleNode)];

    // Corroboration edges (same condition, different book)
    const corrEdges = this.outEdges(ruleNodeId, 'corroborates')
      .concat(this.inEdges(ruleNodeId, 'corroborates'));
    for (const e of corrEdges) {
      const peer = this.node(e.source === ruleNodeId ? e.target : e.source);
      if (peer?.type === 'Rule') {
        evidenceList.push(this.evidence(peer));
      }
    }

    return evidenceList;
  }

  /**
   * Rules related to a given rule via explicit relatedRuleIds links,
   * requiresRuleIds dependency links, or shared category + planet.
   */
  findRelatedRules(ruleId: string): QueryResult {
    const ruleNodeId = `rule:${ruleId}`;
    const ruleNode = this.node(ruleNodeId);
    if (!ruleNode) {
      return { nodes: [], edges: [], evidence: [], query: { type: 'related', value: ruleId }, totalMatches: 0 };
    }

    const relEdges = this.outEdges(ruleNodeId, 'related_to')
      .concat(this.inEdges(ruleNodeId, 'related_to'))
      .concat(this.outEdges(ruleNodeId, 'depends_on'))
      .concat(this.inEdges(ruleNodeId, 'depends_on'))
      .concat(this.outEdges(ruleNodeId, 'corroborates'))
      .concat(this.inEdges(ruleNodeId, 'corroborates'));

    const relatedNodes = relEdges
      .map((e) => {
        const peerId = e.source === ruleNodeId ? e.target : e.source;
        return this.node(peerId);
      })
      .filter((n): n is GraphNode => n?.type === 'Rule');

    const unique = [...new Map(relatedNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('related', ruleId, unique, relEdges);
  }

  /**
   * Rules that contradict a given rule (conflict edges from kb-conflicts.ts).
   */
  findConflicts(ruleId: string): QueryResult {
    const ruleNodeId = `rule:${ruleId}`;
    const conflictEdges = this.outEdges(ruleNodeId, 'contradicts')
      .concat(this.inEdges(ruleNodeId, 'contradicts'));
    const conflictNodes = conflictEdges
      .map((e) => {
        const peerId = e.source === ruleNodeId ? e.target : e.source;
        return this.node(peerId);
      })
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(conflictNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('conflicts', ruleId, unique, conflictEdges);
  }

  /**
   * Rules in a specific book (by book slug or book code).
   */
  findRulesByBook(bookSlugOrCode: string): QueryResult {
    const bookId = bookSlugOrCode.startsWith('book:')
      ? bookSlugOrCode
      : bookSlugOrCode.length <= 6
        ? `book:${bookSlugOrCode.toUpperCase()}`
        : `book:${bookSlugOrCode.toUpperCase()}`;

    // Try to find the book node
    let bookNode = this.node(bookId);
    if (!bookNode) {
      // Search by slug in properties
      bookNode = Array.from(this.nodeById.values()).find(
        (n) => n.type === 'Book' && (n.properties['slug'] === bookSlugOrCode || n.properties['code'] === bookSlugOrCode.toUpperCase()),
      );
    }
    if (!bookNode) {
      return { nodes: [], edges: [], evidence: [], query: { type: 'book', value: bookSlugOrCode }, totalMatches: 0 };
    }

    const anchorEdges = this.inEdges(bookNode.id, 'supported_by');
    const ruleNodes = anchorEdges
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(ruleNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('book', bookSlugOrCode, unique, anchorEdges);
  }

  /**
   * Rules referencing a specific sign.
   */
  findRulesBySign(sign: string): QueryResult {
    const signId = `sign:${sign}`;
    const anchorEdges = this.inEdges(signId, 'belongs_to').concat(this.inEdges(signId, 'posited_in'));
    const ruleNodes = anchorEdges
      .map((e) => this.node(e.source))
      .filter((n): n is GraphNode => n?.type === 'Rule');
    const unique = [...new Map(ruleNodes.map((n) => [n.id, n])).values()];
    return this.buildResult('sign', sign, unique, anchorEdges);
  }

  /**
   * Graph statistics — useful for the admin visualization page.
   */
  getStats(): KnowledgeGraphData['meta'] {
    return (_graph as KnowledgeGraphData).meta;
  }

  /**
   * All node ids of a given type — useful for enumerating the graph in the UI.
   */
  nodesByType(type: string): GraphNode[] {
    return Array.from(this.nodeById.values()).filter((n) => n.type === type);
  }

  /**
   * Direct neighbourhood of a node — 1-hop subgraph centred on nodeId.
   * Intended for the visualization layer.
   */
  neighbourhood(nodeId: string, maxDepth = 1): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const visitedNodes = new Set<string>([nodeId]);
    const visitedEdges = new Set<string>();
    const frontier = [nodeId];

    for (let depth = 0; depth < maxDepth; depth++) {
      const nextFrontier: string[] = [];
      for (const nid of frontier) {
        for (const edge of this.edgesOf(nid)) {
          visitedEdges.add(edge.id);
          const peer = edge.source === nid ? edge.target : edge.source;
          if (!visitedNodes.has(peer)) {
            visitedNodes.add(peer);
            nextFrontier.push(peer);
          }
        }
      }
      frontier.length = 0;
      frontier.push(...nextFrontier);
    }

    return {
      nodes: Array.from(visitedNodes).map((id) => this.nodeById.get(id)!).filter(Boolean),
      edges: Array.from(visitedEdges).map((id) => this.edgeById.get(id)!).filter(Boolean),
    };
  }
}

// ── Factory for use in scripts ─────────────────────────────────────────────

export function createKnowledgeGraph(graphDir: string): KnowledgeGraph {
  const { graph, adjacency } = loadGraph(graphDir);
  return new KnowledgeGraph(graph, adjacency);
}
