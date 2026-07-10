/**
 * Knowledge Graph builder.
 *
 * Reads every Rule from the KB JSONL files and constructs a KnowledgeGraph
 * by deriving nodes and typed edges from rule metadata.
 *
 * No reasoning happens here. Every edge is a direct transcription of data
 * already present in the encoded rules — it either came from the text or from
 * a previous pipeline stage (encoding, indexing, conflict detection).
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Rule } from '../kb-lib/rule-schema';
import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  GraphMeta,
  AdjacencyIndex,
} from './schema';

// ── Static entity catalogues ─────────────────────────────────────────────────

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SECONDARY_POINTS = ['Gulika', 'Mandi', 'Dhuma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu'];

const SIGNS: [string, number, string, string, string][] = [
  ['Aries', 1, 'fire', 'cardinal', 'Mars'],
  ['Taurus', 2, 'earth', 'fixed', 'Venus'],
  ['Gemini', 3, 'air', 'mutable', 'Mercury'],
  ['Cancer', 4, 'water', 'cardinal', 'Moon'],
  ['Leo', 5, 'fire', 'fixed', 'Sun'],
  ['Virgo', 6, 'earth', 'mutable', 'Mercury'],
  ['Libra', 7, 'air', 'cardinal', 'Venus'],
  ['Scorpio', 8, 'water', 'fixed', 'Mars'],
  ['Sagittarius', 9, 'fire', 'mutable', 'Jupiter'],
  ['Capricorn', 10, 'earth', 'cardinal', 'Saturn'],
  ['Aquarius', 11, 'air', 'fixed', 'Saturn'],
  ['Pisces', 12, 'water', 'mutable', 'Jupiter'],
];

const HOUSE_NAMES = [
  '', 'Tanu', 'Dhana', 'Sahaja', 'Sukha', 'Putra', 'Shatru',
  'Kalatra', 'Randhra', 'Dharma', 'Karma', 'Labha', 'Vyaya',
];

const HOUSE_CLASSIFICATIONS: Record<number, string[]> = {
  1: ['Kendra', 'Trikona'], 2: ['Panapara'], 3: ['Upachaya'],
  4: ['Kendra'],            5: ['Trikona'],  6: ['Dusthana', 'Upachaya'],
  7: ['Kendra'],            8: ['Dusthana'], 9: ['Trikona'],
  10: ['Kendra', 'Upachaya'], 11: ['Upachaya'], 12: ['Dusthana'],
};

const NAKSHATRAS = [
  ['Ashwini', 'Ketu', 'Ashwini Kumaras'],
  ['Bharani', 'Venus', 'Yama'],
  ['Krittika', 'Sun', 'Agni'],
  ['Rohini', 'Moon', 'Brahma'],
  ['Mrigashira', 'Mars', 'Soma'],
  ['Ardra', 'Rahu', 'Rudra'],
  ['Punarvasu', 'Jupiter', 'Aditi'],
  ['Pushya', 'Saturn', 'Brihaspati'],
  ['Ashlesha', 'Mercury', 'Nagas'],
  ['Magha', 'Ketu', 'Pitris'],
  ['Purva Phalguni', 'Venus', 'Bhaga'],
  ['Uttara Phalguni', 'Sun', 'Aryaman'],
  ['Hasta', 'Moon', 'Savitar'],
  ['Chitra', 'Mars', 'Vishwakarma'],
  ['Swati', 'Rahu', 'Vayu'],
  ['Vishakha', 'Jupiter', 'Indragni'],
  ['Anuradha', 'Saturn', 'Mitra'],
  ['Jyeshtha', 'Mercury', 'Indra'],
  ['Mula', 'Ketu', 'Nirriti'],
  ['Purva Ashadha', 'Venus', 'Apas'],
  ['Uttara Ashadha', 'Sun', 'Vishwedevas'],
  ['Shravana', 'Moon', 'Vishnu'],
  ['Dhanishtha', 'Mars', 'Ashta Vasus'],
  ['Shatabhisha', 'Rahu', 'Varuna'],
  ['Purva Bhadrapada', 'Jupiter', 'Aja Ekapad'],
  ['Uttara Bhadrapada', 'Saturn', 'Ahir Budhnya'],
  ['Revati', 'Mercury', 'Pushan'],
];

const DASHA_YEARS: Record<string, number> = {
  Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16,
  Saturn: 19, Mercury: 17, Ketu: 7, Venus: 20,
};

const DIVISIONAL_CHARTS: [string, number, string][] = [
  ['rasi', 1, 'Birth chart'],
  ['hora', 2, 'Wealth'],
  ['drekkana', 3, 'Siblings'],
  ['chaturthamsa', 4, 'Property'],
  ['saptamsha', 7, 'Children'],
  ['navamsa', 9, 'Spouse / dharma'],
  ['dasamsha', 10, 'Career'],
  ['dvadashamsha', 12, 'Parents'],
  ['shodashamsha', 16, 'Vehicles'],
  ['vimsamsha', 20, 'Spirituality'],
  ['chaturvimsamsha', 24, 'Education'],
  ['nakshatramsha', 27, 'Vitality'],
  ['trimsamsha', 30, 'Misfortune'],
  ['shashtyamsha', 60, 'Karma'],
];

const BOOK_META: Record<string, { code: string; title: string; translator: string; tradition: string }> = {
  'bphs-santhanam': { code: 'BPHS', title: 'Brihat Parashara Hora Shastra', translator: 'R. Santhanam', tradition: 'Parashara' },
  'phaladeepika-abhushana': { code: 'PHALA', title: 'Phaladeepika (Mantreswara)', translator: 'V. Subrahmanya Sastri', tradition: 'Classical' },
  'horasara': { code: 'HORA', title: 'Horasara (Prithuyasas)', translator: 'V. Subrahmanya Sastri', tradition: 'Classical' },
  'light-on-life-svoboda': { code: 'LOL', title: 'Light on Life', translator: 'Robert Svoboda', tradition: 'Modern classical' },
  'how-to-judge-horoscope-v1': { code: 'HJH1', title: 'How to Judge a Horoscope, Volume 1', translator: 'Bangalore Venkata Raman', tradition: 'Modern classical' },
  'how-to-judge-horoscope-v2': { code: 'HJH2', title: 'How to Judge a Horoscope, Volume 2', translator: 'Bangalore Venkata Raman, Gayatri Devi Vasudev', tradition: 'Modern classical' },
  'hindu-astrology': { code: 'HAST', title: 'Learn Hindu Astrology Easily', translator: 'K. N. Rao, K. Ashu Rao', tradition: 'Modern classical' },
};

// Life-area category mapping
const LIFE_AREA_CATEGORIES = new Set([
  'career', 'marriage', 'love', 'health', 'finance', 'education', 'spirituality', 'family', 'mentalNature', 'remedies',
]);

// ── Builder state ─────────────────────────────────────────────────────────────

class GraphBuilder {
  private nodeMap = new Map<string, GraphNode>();
  private edgeMap = new Map<string, GraphEdge>();
  private adjacency = new Map<string, Set<string>>();

  // ── Node helpers ────────────────────────────────────────────────────────────

  private addNode(node: GraphNode): void {
    if (!this.nodeMap.has(node.id)) {
      this.nodeMap.set(node.id, node);
    }
  }

  private ensureAdjacency(nodeId: string): void {
    if (!this.adjacency.has(nodeId)) this.adjacency.set(nodeId, new Set());
  }

  // ── Edge helpers ────────────────────────────────────────────────────────────

  private addEdge(
    type: EdgeType,
    source: string,
    target: string,
    weight = 1.0,
    properties: Record<string, unknown> = {},
  ): void {
    const id = `${source}--${type}--${target}`;
    if (!this.edgeMap.has(id)) {
      this.edgeMap.set(id, { id, type, source, target, weight, properties });
      this.ensureAdjacency(source);
      this.ensureAdjacency(target);
      this.adjacency.get(source)!.add(id);
      this.adjacency.get(target)!.add(id);
    } else {
      // Merge weight (corroboration bump)
      const existing = this.edgeMap.get(id)!;
      this.edgeMap.set(id, { ...existing, weight: existing.weight + weight });
    }
  }

  // ── Static catalogue seeding ─────────────────────────────────────────────

  seedStaticNodes(): void {
    // Planets
    for (const p of PLANETS) {
      this.addNode({
        id: `planet:${p}`,
        type: 'Planet',
        label: p,
        properties: { isSecondaryPoint: false, tradition: 'navagraha' },
      });
    }
    for (const sp of SECONDARY_POINTS) {
      this.addNode({
        id: `planet:${sp}`,
        type: 'Planet',
        label: sp,
        properties: { isSecondaryPoint: true, tradition: 'upagraha' },
      });
    }

    // Houses
    for (let h = 1; h <= 12; h++) {
      this.addNode({
        id: `house:${h}`,
        type: 'House',
        label: `House ${h} (${HOUSE_NAMES[h] ?? ''})`,
        properties: {
          number: h,
          classification: HOUSE_CLASSIFICATIONS[h] ?? [],
          sanskriName: HOUSE_NAMES[h] ?? '',
        },
      });
    }

    // Signs
    for (const [name, num, element, modality, ruler] of SIGNS) {
      this.addNode({
        id: `sign:${name}`,
        type: 'Sign',
        label: name,
        properties: { number: num, element, modality, ruler },
      });
    }

    // Nakshatras
    for (let i = 0; i < NAKSHATRAS.length; i++) {
      const [name = '', ruler = '', deity = ''] = NAKSHATRAS[i]!;
      this.addNode({
        id: `nakshatra:${name}`,
        type: 'Nakshatra',
        label: name,
        properties: { number: i + 1, ruler, deity },
      });
    }

    // Divisional charts
    for (const [slug, division, theme] of DIVISIONAL_CHARTS) {
      this.addNode({
        id: `dchart:${slug}`,
        type: 'DivisionalChart',
        label: `D${division} — ${slug}`,
        properties: { division, theme },
      });
    }

    // Categories
    const ALL_CATEGORIES = [
      'planet', 'house', 'sign', 'nakshatra', 'yoga', 'dasha',
      'divisionalCharts', 'career', 'marriage', 'love', 'health', 'finance',
      'remedies', 'spirituality', 'education', 'children', 'family', 'mentalNature', 'property',
      'foreign', 'longevity', 'business', 'timing', 'transit',
    ];
    for (const cat of ALL_CATEGORIES) {
      this.addNode({
        id: `category:${cat}`,
        type: 'Category',
        label: cat,
        properties: {
          label: cat,
          lifeArea: LIFE_AREA_CATEGORIES.has(cat) ? cat : null,
          ruleCount: 0,
        },
      });
    }

    // Remedy types
    for (const r of ['gemstone', 'mantra', 'donation', 'fasting', 'worship', 'lifestyle']) {
      this.addNode({
        id: `remedy:${r}`,
        type: 'Remedy',
        label: r,
        properties: { remedyType: r, ruleCount: 0 },
      });
    }

    // Dasha planets
    for (const [planet, years] of Object.entries(DASHA_YEARS)) {
      this.addNode({
        id: `dasha:${planet}`,
        type: 'Dasha',
        label: `${planet} Mahadasha`,
        properties: { planet, durationYears: years },
      });
    }
  }

  // ── Rule ingestion ───────────────────────────────────────────────────────

  ingestRule(rule: Rule): void {
    const ruleNodeId = `rule:${rule.id}`;

    // --- Rule node ---
    this.addNode({
      id: ruleNodeId,
      type: 'Rule',
      label: rule.id,
      properties: {
        book: rule.book,
        bookCode: rule.bookCode,
        chapter: rule.chapter,
        verse: rule.verse,
        page: rule.page,
        priority: rule.priority,
        categories: rule.categories,
        status: rule.status,
        isComposite: rule.isComposite,
        patternIds: rule.patternIds,
        extractionConfidence: rule.extractionConfidence,
        validationConfidence: rule.validationConfidence,
        sourceText: rule.translation,
        characterSpan: null, // populated by a future character-span pass
        hasStructuredRule: rule.structuredRule !== null,
        hasTiming: rule.timing !== null,
        hasRemedy: rule.remedy !== null,
      },
    });

    // --- Book node ---
    const bookMeta = BOOK_META[rule.book];
    if (bookMeta) {
      const bookId = `book:${rule.bookCode}`;
      this.addNode({
        id: bookId,
        type: 'Book',
        label: bookMeta.title,
        properties: {
          slug: rule.book,
          code: rule.bookCode,
          fullTitle: bookMeta.title,
          translator: bookMeta.translator,
          tradition: bookMeta.tradition,
          ruleCount: 0,
        },
      });
      this.addEdge('supported_by', ruleNodeId, bookId, rule.extractionConfidence);

      // --- Chapter node ---
      if (rule.chapter) {
        const chapterId = `chapter:${rule.bookCode}:${rule.chapter}`;
        this.addNode({
          id: chapterId,
          type: 'Chapter',
          label: `${rule.bookCode} Ch. ${rule.chapter}`,
          properties: { book: rule.bookCode, chapterKey: rule.chapter, ruleCount: 0 },
        });
        this.addEdge('has_chapter', bookId, chapterId);
        this.addEdge('in_chapter', ruleNodeId, chapterId, rule.extractionConfidence);

        // --- Verse node ---
        if (rule.verse) {
          const verseId = `verse:${rule.bookCode}:${rule.chapter}:${rule.verse}`;
          this.addNode({
            id: verseId,
            type: 'Verse',
            label: `${rule.bookCode} ${rule.chapter}.${rule.verse}`,
            properties: {
              book: rule.bookCode,
              chapter: rule.chapter,
              verse: rule.verse,
              ruleCount: 0,
            },
          });
          this.addEdge('has_verse', chapterId, verseId);
          this.addEdge('references', ruleNodeId, verseId, rule.extractionConfidence);
        }
      }
    }

    // --- Category edges ---
    for (const cat of rule.categories) {
      const catId = `category:${cat}`;
      this.addEdge('belongs_to', ruleNodeId, catId, 1.0);
      if (LIFE_AREA_CATEGORIES.has(cat)) {
        this.addEdge('affects', ruleNodeId, catId, rule.extractionConfidence);
      }
      // Increment ruleCount on category node
      const catNode = this.nodeMap.get(catId);
      if (catNode) {
        (catNode.properties as Record<string, unknown>).ruleCount =
          ((catNode.properties.ruleCount as number) ?? 0) + 1;
      }
    }

    // --- Dimensioned entity edges ---

    // Planet → House (from conditions)
    if (rule.structuredRule) {
      for (const cond of rule.structuredRule.conditions) {
        if (cond.type === 'planet-in-house' && cond.planet && cond.house) {
          this.addEdge(
            'occupies',
            `planet:${cond.planet}`,
            `house:${cond.house}`,
            rule.extractionConfidence,
            { ruleId: rule.id, raw: cond.raw },
          );
          // Also link rule → planet and rule → house implicitly via dimensions below
        }
        if (cond.type === 'planet-in-sign' && cond.planet && cond.sign) {
          this.addEdge(
            'posited_in',
            `planet:${cond.planet}`,
            `sign:${cond.sign}`,
            rule.extractionConfidence,
            { ruleId: rule.id, raw: cond.raw },
          );
        }
        if (cond.type === 'planet-aspect' && cond.planet) {
          if (cond.aspectingPlanet) {
            this.addEdge(
              'aspects',
              `planet:${cond.aspectingPlanet}`,
              `planet:${cond.planet}`,
              rule.extractionConfidence,
              { ruleId: rule.id, raw: cond.raw },
            );
          }
        }
        if (cond.type === 'planet-conjunction' && cond.planet) {
          // Conjunctions are symmetric; source = first planet alphabetically for dedup
          const partners: string[] = rule.dimensions.planets.filter((p) => p !== cond.planet);
          for (const partner of partners) {
            const [src, tgt] = [cond.planet, partner].sort();
            this.addEdge(
              'conjunct_with',
              `planet:${src!}`,
              `planet:${tgt!}`,
              rule.extractionConfidence,
              { ruleId: rule.id, raw: cond.raw },
            );
          }
        }
        if (cond.type === 'nakshatra-placement' && cond.planet && cond.nakshatra) {
          this.addEdge(
            'in_nakshatra',
            `planet:${cond.planet}`,
            `nakshatra:${cond.nakshatra}`,
            rule.extractionConfidence,
            { ruleId: rule.id },
          );
        }
        if (cond.type === 'yoga-presence' && cond.yoga) {
          const yogaId = `yoga:${cond.yoga}`;
          this.addNode({
            id: yogaId,
            type: 'Yoga',
            label: cond.yoga,
            properties: { mentions: 0 },
          });
          const yogaNode = this.nodeMap.get(yogaId)!;
          (yogaNode.properties as Record<string, unknown>).mentions =
            ((yogaNode.properties.mentions as number) ?? 0) + 1;
          this.addEdge('forms_yoga', ruleNodeId, yogaId, rule.extractionConfidence, { raw: cond.raw });
        }
        if (cond.type === 'dasha-period' && cond.planet) {
          this.addEdge('active_during', ruleNodeId, `dasha:${cond.planet}`, rule.extractionConfidence);
          if (cond.antardashaPlanet) {
            const antarId = `antardasha:${cond.planet}:${cond.antardashaPlanet}`;
            this.addNode({
              id: antarId,
              type: 'Antardasha',
              label: `${cond.planet}-${cond.antardashaPlanet} Antardasha`,
              properties: { mahadashaLord: cond.planet, antardashaLord: cond.antardashaPlanet },
            });
            this.addEdge('active_during', ruleNodeId, antarId, rule.extractionConfidence);
          }
        }
      }
    }

    // Dimensions (all entity types mentioned in the rule text)
    for (const p of rule.dimensions.planets) {
      this.addEdge('belongs_to', ruleNodeId, `planet:${p}`, rule.extractionConfidence);
    }
    for (const sp of rule.dimensions.secondaryPoints) {
      this.addEdge('belongs_to', ruleNodeId, `planet:${sp}`, rule.extractionConfidence);
    }
    for (const h of rule.dimensions.houses) {
      this.addEdge('belongs_to', ruleNodeId, `house:${h}`, rule.extractionConfidence);
    }
    for (const s of rule.dimensions.signs) {
      this.addEdge('belongs_to', ruleNodeId, `sign:${s}`, rule.extractionConfidence);
    }
    for (const n of rule.dimensions.nakshatras) {
      if (n) {
        this.addEdge('in_nakshatra', ruleNodeId, `nakshatra:${n}`, rule.extractionConfidence);
      }
    }
    for (const dc of rule.dimensions.divisionalCharts) {
      const dcId = `dchart:${dc}`;
      if (this.nodeMap.has(dcId)) {
        this.addEdge('applies_in', ruleNodeId, dcId, rule.extractionConfidence);
      }
    }
    for (const r of rule.dimensions.remedyTypes) {
      const remedyId = `remedy:${r}`;
      if (this.nodeMap.has(remedyId)) {
        this.addEdge('prescribes', ruleNodeId, remedyId, rule.extractionConfidence);
        const node = this.nodeMap.get(remedyId)!;
        (node.properties as Record<string, unknown>).ruleCount =
          ((node.properties.ruleCount as number) ?? 0) + 1;
      }
    }
    for (const dp of rule.dimensions.dashaPlanets) {
      const dashaId = `dasha:${dp}`;
      if (this.nodeMap.has(dashaId)) {
        this.addEdge('active_during', ruleNodeId, dashaId, rule.extractionConfidence);
      }
    }

    // Remedy node edge (from remedy field)
    if (rule.remedy) {
      const remedyId = `remedy:${rule.remedy.type}`;
      this.addEdge('prescribes', ruleNodeId, remedyId, rule.extractionConfidence, { raw: rule.remedy.raw });
    }

    // Inter-rule edges
    for (const relId of rule.relatedRuleIds) {
      this.addEdge('related_to', ruleNodeId, `rule:${relId}`, 1.0);
    }
    for (const reqId of rule.requiresRuleIds) {
      this.addEdge('depends_on', ruleNodeId, `rule:${reqId}`, 1.0);
    }
  }

  // --- Conflict/corroboration edges (injected after all rules are loaded) ---

  ingestConflicts(
    conflicts: Array<{ ruleIds: string[]; type: 'conflict' | 'overlap' }>,
  ): void {
    for (const c of conflicts) {
      const [a, b] = c.ruleIds;
      if (!a || !b) continue;
      const edgeType: EdgeType = c.type === 'conflict' ? 'contradicts' : 'corroborates';
      this.addEdge(edgeType, `rule:${a}`, `rule:${b}`, 1.0, { conflictType: c.type });
    }
  }

  // ── Build and return the final graph ─────────────────────────────────────

  build(kbVersion: string, totalRulesIndexed: number): { graph: KnowledgeGraph; adjacency: AdjacencyIndex } {
    const nodes = Array.from(this.nodeMap.values());
    const edges = Array.from(this.edgeMap.values());

    // Compute counts
    const nodeCountByType = {} as Record<string, number>;
    for (const n of nodes) {
      nodeCountByType[n.type] = (nodeCountByType[n.type] ?? 0) + 1;
    }
    const edgeCountByType = {} as Record<string, number>;
    for (const e of edges) {
      edgeCountByType[e.type] = (edgeCountByType[e.type] ?? 0) + 1;
    }

    const meta: GraphMeta = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeCountByType: nodeCountByType as GraphMeta['nodeCountByType'],
      edgeCountByType: edgeCountByType as GraphMeta['edgeCountByType'],
      builtAt: new Date().toISOString(),
      kbVersion,
      totalRulesIndexed,
    };

    // Adjacency index: nodeId → edgeId[]
    const adjacency: AdjacencyIndex = {};
    for (const [nodeId, edgeSet] of this.adjacency) {
      adjacency[nodeId] = Array.from(edgeSet);
    }

    return {
      graph: { nodes, edges, meta },
      adjacency,
    };
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

export interface BuildResult {
  graph: KnowledgeGraph;
  adjacency: AdjacencyIndex;
}

export function buildKnowledgeGraph(opts: {
  rulesDir: string;
  conflictsPath: string;
  kbVersion: string;
}): BuildResult {
  const builder = new GraphBuilder();
  builder.seedStaticNodes();

  // Collect all rules from all book subdirectories
  const books = fs.readdirSync(opts.rulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let totalRules = 0;
  for (const book of books) {
    const jsonlPath = path.join(opts.rulesDir, book, 'rules.jsonl');
    if (!fs.existsSync(jsonlPath)) continue;
    const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const rule = JSON.parse(line) as Rule;
        builder.ingestRule(rule);
        totalRules++;
      } catch {
        // malformed line — skip
      }
    }
  }

  // Conflicts
  if (fs.existsSync(opts.conflictsPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(opts.conflictsPath, 'utf-8')) as {
        conflicts?: Array<{ ruleIds: string[] }>;
        overlaps?: Array<{ ruleIds: string[] }>;
      };
      const conflicts = (raw.conflicts ?? []).map((c) => ({ ...c, type: 'conflict' as const }));
      const overlaps = (raw.overlaps ?? []).map((c) => ({ ...c, type: 'overlap' as const }));
      builder.ingestConflicts([...conflicts, ...overlaps]);
    } catch {
      // skip if malformed
    }
  }

  return builder.build(opts.kbVersion, totalRules);
}
