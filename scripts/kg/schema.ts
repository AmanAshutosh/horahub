/**
 * Knowledge Graph schema — pure type definitions.
 *
 * Every node has a stable `id`, a `type`, a human-readable `label`,
 * and a `properties` bag whose shape depends on the node type.
 * Every edge is a typed, directed relationship between two node ids.
 *
 * The graph is intentionally a plain data structure — no graph DB, no
 * external runtime, just JSON-serialisable objects. The builder writes
 * it to kb/graph/; the query layer reads it back at runtime.
 */

// ── Node types ──────────────────────────────────────────────────────────────

export type NodeType =
  | 'Planet'
  | 'House'
  | 'Sign'
  | 'Nakshatra'
  | 'Yoga'
  | 'Dasha'
  | 'Antardasha'
  | 'DivisionalChart'
  | 'Rule'
  | 'Book'
  | 'Chapter'
  | 'Verse'
  | 'Remedy'
  | 'Category';

// ── Edge types ───────────────────────────────────────────────────────────────

export type EdgeType =
  // Astronomical relationships (from conditions in structured rules)
  | 'occupies'        // Planet → House
  | 'posited_in'      // Planet → Sign
  | 'aspects'         // Planet → Planet
  | 'conjunct_with'   // Planet → Planet
  | 'in_nakshatra'    // Planet → Nakshatra
  // Rule provenance
  | 'supported_by'    // Rule → Book
  | 'references'      // Rule → Verse (when chapter+verse known)
  | 'in_chapter'      // Rule → Chapter
  | 'belongs_to'      // Rule → Category
  // Inter-rule relationships
  | 'depends_on'      // Rule → Rule (requiresRuleIds)
  | 'related_to'      // Rule → Rule (relatedRuleIds)
  | 'contradicts'     // Rule → Rule (conflict detected by kb-conflicts)
  | 'corroborates'    // Rule → Rule (same condition, different book)
  // Life-area influence (derived from category membership)
  | 'affects'         // Rule → Category (career / marriage / health / finance / remedies)
  // Structural (book → chapter → verse hierarchy)
  | 'has_chapter'     // Book → Chapter
  | 'has_verse'       // Chapter → Verse
  // Yoga and dasha
  | 'forms_yoga'      // Rule → Yoga (when condition type is yoga-presence)
  | 'active_during'   // Rule → Dasha
  // Remedy
  | 'prescribes'      // Rule → Remedy
  // Divisional chart
  | 'applies_in';     // Rule → DivisionalChart

// ── Property shapes per node type ───────────────────────────────────────────

export interface PlanetProperties {
  isSecondaryPoint: boolean;
  tradition: 'navagraha' | 'upagraha';
}

export interface HouseProperties {
  number: number;
  /** e.g. 'Kendra', 'Trikona', 'Dusthana', 'Upachaya', 'Panapara' */
  classification: string[];
  /** Classical Sanskrit name (Tanu, Dhana, …) */
  sanskriName: string;
}

export interface SignProperties {
  number: number; // 1 = Aries … 12 = Pisces
  element: 'fire' | 'earth' | 'air' | 'water';
  modality: 'cardinal' | 'fixed' | 'mutable';
  ruler: string; // planet name
}

export interface NakshatraProperties {
  number: number; // 1 = Ashwini … 27 = Revati
  ruler: string;  // planet name
  deity: string;
}

export interface YogaProperties {
  mentions: number; // how many rules reference this yoga
}

export interface DashaProperties {
  planet: string;
  durationYears: number;
}

export interface AntardashaProperties {
  mahadashaLord: string;
  antardashaLord: string;
}

export interface DivisionalChartProperties {
  division: number; // D1 = 1, D9 = 9, …
  theme: string;
}

export interface RuleProperties {
  book: string;
  bookCode: string;
  chapter: string | null;
  verse: string | null;
  page: number;
  priority: number;
  categories: string[];
  status: string;
  isComposite: boolean;
  patternIds: string[];
  extractionConfidence: number;
  validationConfidence: number | null;
  /** Verbatim source sentence */
  sourceText: string;
  /** Character span within the book page — [start, end] */
  characterSpan: [number, number] | null;
  hasStructuredRule: boolean;
  hasTiming: boolean;
  hasRemedy: boolean;
}

export interface BookProperties {
  slug: string;
  code: string;
  fullTitle: string;
  translator: string;
  tradition: string;
  ruleCount: number;
}

export interface ChapterProperties {
  book: string;
  chapterKey: string; // "1", "2", … or the chapter title
  ruleCount: number;
}

export interface VerseProperties {
  book: string;
  chapter: string | null;
  verse: string;
  ruleCount: number;
}

export interface RemedyProperties {
  remedyType: 'gemstone' | 'mantra' | 'donation' | 'fasting';
  ruleCount: number;
}

export interface CategoryProperties {
  label: string;
  lifeArea: 'career' | 'marriage' | 'health' | 'finance' | 'remedies' | null;
  ruleCount: number;
}

// ── Core graph primitives ────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;           // "<sourceId>--<type>--<targetId>" (deduped)
  type: EdgeType;
  source: string;       // node id
  target: string;       // node id
  weight: number;       // 1.0 default; boosted by corroborating books or confidence
  properties: Record<string, unknown>;
}

// ── The graph itself ─────────────────────────────────────────────────────────

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: GraphMeta;
}

export interface GraphMeta {
  totalNodes: number;
  totalEdges: number;
  nodeCountByType: Record<NodeType, number>;
  edgeCountByType: Record<EdgeType, number>;
  builtAt: string;
  kbVersion: string;
  totalRulesIndexed: number;
}

// ── Adjacency index (written separately for O(1) neighbour lookup) ───────────

/**
 * Maps nodeId → list of edge ids touching that node (both as source and target).
 * Stored as kb/graph/adjacency.json.
 */
export type AdjacencyIndex = Record<string, string[]>;

// ── Evidence record (preserved on every query result) ────────────────────────

export interface Evidence {
  ruleId: string;
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
}

// ── Query result ─────────────────────────────────────────────────────────────

export interface QueryResult {
  /** Subgraph nodes relevant to this query */
  nodes: GraphNode[];
  /** Subgraph edges relevant to this query */
  edges: GraphEdge[];
  /** Full evidence records for every Rule node in the result */
  evidence: Evidence[];
  /** Descriptor of what was queried */
  query: {
    type: string;
    value: string | number;
  };
  totalMatches: number;
}
