/**
 * Report builder — maps InferenceResult to ReportSectionData[].
 *
 * Each section is populated ONLY from matched rules. The only text in any
 * output field is rule.sourceText (verbatim) or a structural label derived
 * from metadata (e.g. "BPHS Ch.24, v.12"). No prose is ever synthesised.
 *
 * Sections produced:
 *   career, finance, marriage, love, health, education,
 *   family, mentalNature, spirituality, remedies   — LifeAreaSection
 *   yogas                                          — YogaSection
 *   past-validation                                — (future section)
 */
import type {
  ReportSectionData,
  ReportItem,
  ReportEvidence,
  ReportCitation,
  ReportTable,
  ReportTableRow,
  ReportRemedyCard,
} from '@/types/report';
import type { ChartFacts } from '@/types/chart';
import type { InferenceResult, MatchedRule, DomainResult, DetectedYoga, ExtractedRemedy, PastObservation, RemedyCard } from './types';
import type { TransitPlanetPosition } from './transit';
import { interpretDomain } from '@/lib/interpreter/LifeDomainInterpreter';
import { buildDomainRemedyCards } from './remedy-engine';
import { loadKnowledgeBase } from '@/kb';
import { RASHI } from '@/constants/astro';

// ── Book display names ────────────────────────────────────────────────────────

const BOOK_DISPLAY: Record<string, string> = {
  BPHS:  'Brihat Parashara Hora Shastra',
  HORA:  'Horasara',
  PHALA: 'Phaladeepika',
  LOL:   'Light on Life',
  HAST:  'Learn Hindu Astrology Easily',
  HJH1:  'How to Judge a Horoscope, Vol. 1',
  HJH2:  'How to Judge a Horoscope, Vol. 2',
};

function bookName(code: string): string {
  return BOOK_DISPLAY[code] ?? code;
}

// ── Shared converters ─────────────────────────────────────────────────────────

function toReportEvidence(m: MatchedRule): ReportEvidence {
  return {
    ruleId: m.ruleId,
    book: bookName(m.bookCode),
    chapter: m.chapter,
    verse: m.verse,
    text: m.sourceText,
    categories: m.categories,
    extractionConfidence: m.extractionConfidence,
    validationConfidence: m.validationConfidence,
  };
}

function toReportCitation(m: MatchedRule): ReportCitation {
  let ref = '';
  if (m.chapter) ref += `Ch.${m.chapter}`;
  if (m.verse) ref += `, v.${m.verse}`;
  if (!ref) ref = `p.${m.page}`;

  return {
    work: bookName(m.bookCode),
    ref,
    text: m.sourceText,
  };
}

function fieldRef(chapter: string | null, verse: string | null): string {
  let ref = chapter ? `Ch.${chapter}` : '';
  if (verse) ref += `${ref ? ', ' : ''}v.${verse}`;
  return ref;
}

function toReportRemedyCard(card: RemedyCard): ReportRemedyCard {
  return {
    id: card.id,
    domain: card.domain,
    responsiblePlanet: card.responsiblePlanet,
    cause: card.cause,
    classicalExplanation: card.classicalExplanation,
    confidenceTier: card.confidenceTier,
    fields: card.fields.map((f) => ({
      type: f.type,
      raw: f.raw,
      ruleId: f.ruleId,
      book: bookName(f.bookCode),
      bookCode: f.bookCode,
      chapter: f.chapter,
      verse: f.verse,
      extractionConfidence: f.extractionConfidence,
    })),
    citations: card.citations.map((c) => ({
      work: bookName(c.bookCode),
      ref: fieldRef(c.chapter, c.verse) || `Rule ${c.ruleId}`,
      text: card.fields.find((f) => f.ruleId === c.ruleId)?.raw ?? '',
    })),
  };
}

function effectToDirection(dir: string): ReportItem['direction'] {
  if (dir === 'increase') return 'positive';
  if (dir === 'decrease') return 'negative';
  return 'neutral';
}

/**
 * Generate a title for a matched rule from its metadata — never fabricated.
 * For structured matches: uses matched condition raws.
 * For dimension matches: uses categories.
 */
function ruleTitle(m: MatchedRule): string {
  if (m.matchType === 'structured' && m.matchedConditionRaws.length > 0) {
    // Trim the raw condition text and capitalise
    const raw = m.matchedConditionRaws[0]!.trim();
    const capped = raw.charAt(0).toUpperCase() + raw.slice(1);
    return capped.length > 80 ? capped.slice(0, 77) + '…' : capped;
  }
  // Dimension match: build from categories + book
  const cats = m.categories
    .filter((c) => !['planet', 'house', 'sign'].includes(c))
    .slice(0, 2)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join(' · ');
  return cats || `${bookName(m.bookCode)} rule`;
}

function matchToItem(m: MatchedRule): ReportItem {
  return {
    title: ruleTitle(m),
    body: m.sourceText,
    direction: effectToDirection(m.effectDirection),
    citations: [toReportCitation(m)],
    evidence: [toReportEvidence(m)],
    tags: [
      m.matchType === 'structured' ? 'Structured Match' : 'Text Match',
      m.bookCode,
      `Confidence ${(m.confidence * 100).toFixed(0)}%`,
    ],
  };
}

// ── Section status ────────────────────────────────────────────────────────────

function sectionStatus(domain: DomainResult): ReportSectionData['status'] {
  const structured = domain.matches.filter((m) => m.matchType === 'structured').length;
  if (structured >= 2) return 'populated';
  if (domain.matches.length >= 3) return 'partial';
  if (domain.matches.length > 0) return 'partial';
  return 'pending';
}

// ── Life-area section builder ─────────────────────────────────────────────────

function buildLifeAreaSection(
  id: string,
  title: string,
  subtitle: string,
  domain: DomainResult | undefined,
  facts?: ChartFacts,
): ReportSectionData {
  if (!domain || domain.matches.length === 0) {
    return { id, title, subtitle, status: 'pending' };
  }

  const remedyPool = domain.remedyCandidates.length > 0 ? domain.remedyCandidates : domain.matches;
  const remedyCards = buildDomainRemedyCards(id, remedyPool).map(toReportRemedyCard);

  const items: ReportItem[] = domain.matches
    .filter((m) => m.sourceText.trim().length > 20) // skip stub-length rules
    .map(matchToItem);

  const topCitations: ReportCitation[] = domain.matches
    .filter((m) => m.chapter)
    .slice(0, 5)
    .map(toReportCitation);

  const conflictCount = domain.matches.filter((m) => m.conflictingRuleIds.length > 0).length;
  let note: string | undefined;
  if (conflictCount > 0) {
    note = `${conflictCount} rule${conflictCount > 1 ? 's' : ''} in this section have conflicting statements in other classical texts — both are shown.`;
  }

  const base: ReportSectionData = {
    id,
    title,
    subtitle,
    status: sectionStatus(domain),
    items,
    citations: topCitations.length > 0 ? topCitations : undefined,
    evidence: domain.matches.slice(0, 8).map(toReportEvidence),
    note,
    remedyCards: remedyCards.length > 0 ? remedyCards : undefined,
  };

  // Enrich with chart-specific interpretation when ChartFacts are available
  if (facts && items.length > 0) {
    const interp = interpretDomain(id, items, facts);
    return {
      ...base,
      summary: interp.summary,
      chartContext: interp.chartContext || undefined,
      strengths: interp.strengths.length > 0 ? interp.strengths : undefined,
      challenges: interp.challenges.length > 0 ? interp.challenges : undefined,
      advice: interp.advice.length > 0 ? interp.advice : undefined,
    };
  }

  return base;
}

// ── Yoga section builder ──────────────────────────────────────────────────────

function buildYogaSection(
  detectedYogas: DetectedYoga[],
  yogaDomain: DomainResult | undefined,
): ReportSectionData {
  if (detectedYogas.length === 0 && (!yogaDomain || yogaDomain.matches.length === 0)) {
    return {
      id: 'yogas',
      title: 'Yoga Analysis',
      subtitle: 'Classical planetary combinations detected in this chart',
      status: 'pending',
    };
  }

  // Table 1: Detected yogas
  const yogaRows: ReportTableRow[] = detectedYogas.map((y) => ({
    cells: [
      y.name,
      y.strength,
      y.planets.join(' + '),
      y.formationNote,
      y.kgRuleIds.length > 0 ? `${y.kgRuleIds.length} rules` : '—',
    ],
    highlight: y.strength === 'exact',
    variant: y.name.includes('Kemadruma') ? 'negative' : 'positive',
  }));

  const tables: ReportTable[] = [];

  if (yogaRows.length > 0) {
    tables.push({
      caption: 'Detected Classical Yogas',
      columns: ['Yoga', 'Strength', 'Planets', 'Formation Condition', 'KB Rules'],
      rows: yogaRows,
    });
  }

  // Evidence from yoga rule matches
  const evidence: ReportEvidence[] = (yogaDomain?.matches ?? [])
    .slice(0, 8)
    .map(toReportEvidence);

  const citations: ReportCitation[] = (yogaDomain?.matches ?? [])
    .filter((m) => m.chapter)
    .slice(0, 5)
    .map(toReportCitation);

  return {
    id: 'yogas',
    title: 'Yoga Analysis',
    subtitle: 'Classical planetary combinations detected in this chart',
    status: detectedYogas.length > 0 ? 'populated' : 'partial',
    tables: tables.length > 0 ? tables : undefined,
    evidence: evidence.length > 0 ? evidence : undefined,
    citations: citations.length > 0 ? citations : undefined,
    note: 'Strength qualifiers: exact = planet in exaltation or own sign in kendra; approximate = non-debilitated in kendra; partial = formation condition partially met.',
  };
}

// ── Remedy section builder ────────────────────────────────────────────────────

function buildRemedySection(
  remedies: ExtractedRemedy[],
  domain: DomainResult | undefined,
): ReportSectionData {
  const allRemedies = [...remedies];

  if (allRemedies.length === 0 && (!domain || domain.matches.length === 0)) {
    return {
      id: 'remedies',
      title: 'Classical Remedies',
      subtitle: 'Upayas prescribed in cited texts — not personal medical advice',
      status: 'pending',
    };
  }

  const byType = new Map<string, ExtractedRemedy[]>();
  for (const r of allRemedies) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type)!.push(r);
  }

  const tables: ReportTable[] = [];
  for (const [type, list] of byType) {
    const rows: ReportTableRow[] = list.map((r) => {
      let ref = r.chapter ? `Ch.${r.chapter}` : '';
      if (r.verse) ref += `, v.${r.verse}`;
      return {
        cells: [bookName(r.bookCode), ref || `p.?`, r.raw],
      };
    });
    tables.push({
      caption: `${type.charAt(0).toUpperCase() + type.slice(1)} Remedies`,
      columns: ['Source', 'Reference', 'Prescription (verbatim)'],
      rows,
    });
  }

  // Also include dimension-matched remedy rules
  const items: ReportItem[] = (domain?.matches ?? [])
    .filter((m) => m.hasRemedy || m.categories.includes('remedies'))
    .slice(0, 8)
    .map(matchToItem);

  return {
    id: 'remedies',
    title: 'Classical Remedies',
    subtitle: 'Upayas prescribed in cited texts — not personal medical advice',
    status: allRemedies.length > 0 || items.length > 0 ? 'populated' : 'partial',
    tables: tables.length > 0 ? tables : undefined,
    items: items.length > 0 ? items : undefined,
    note: 'All remedies are verbatim extracts from classical texts. Duration, start/end conditions, and planet associations are as stated in the source — never inferred or extended.',
  };
}

// ── Transit section builder ───────────────────────────────────────────────────

/** Houses only ever run 1..12 in this codebase, so a direct lookup is sufficient. */
const ORDINAL_SUFFIX: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
function ordinal(n: number): string {
  return `${n}${ORDINAL_SUFFIX[n] ?? 'th'}`;
}

const TRANSIT_ACTIVATION_HOUSES: Record<'career' | 'relationship' | 'finance', number[]> = {
  career: [10],
  relationship: [5, 7],
  finance: [2, 11],
};

function buildTransitSection(
  positions: TransitPlanetPosition[],
  matches: MatchedRule[],
): ReportSectionData {
  if (positions.length === 0) {
    return { id: 'transit', title: 'The Sky Right Now', status: 'pending' };
  }

  const kb = loadKnowledgeBase();
  const signName = (i: number) => RASHI[i] ?? '?';

  // Position table — real, dated chart facts, always shown once positions exist.
  const rows: ReportTableRow[] = positions.map((p) => ({
    cells: [
      p.planet,
      signName(p.sign),
      p.houseFromLagna,
      p.houseFromMoon,
      kb.houses[p.houseFromLagna]?.themes ?? '—',
    ],
  }));
  const tables: ReportTable[] = [{
    caption: 'Current transit positions',
    columns: ['Planet', 'Sign', 'House from Lagna', 'House from Moon', 'Life Areas Touched'],
    rows,
  }];

  // Current phase — position + classical house signification, the same
  // "chart fact + KB theme" combination already used throughout the report
  // (src/interpret/index.ts, LifeDomainInterpreter.ts) — never fabricated.
  const phaseParts = positions.map((p) => {
    const themes = kb.houses[p.houseFromLagna]?.themes ?? '';
    const moonNote = p.houseFromMoon !== p.houseFromLagna ? ` (${ordinal(p.houseFromMoon)} house from your Moon)` : '';
    return `transiting ${p.planet} is moving through your ${ordinal(p.houseFromLagna)} house from your Lagna${moonNote} — traditionally associated with ${themes}`;
  });
  const chartContext = `Right now, ${phaseParts.join('; ')}.`;

  // Activation call-outs per life area, source-backed: cite a matched rule
  // when one exists for that planet+house; otherwise state the plain
  // position + house-theme fact only (never an invented interpretation).
  const advice: string[] = [];
  for (const [area, houses] of Object.entries(TRANSIT_ACTIVATION_HOUSES) as Array<[keyof typeof TRANSIT_ACTIVATION_HOUSES, number[]]>) {
    const touching = positions.filter((p) => houses.includes(p.houseFromLagna) || houses.includes(p.houseFromMoon));
    if (touching.length === 0) continue;
    const label = area === 'career' ? 'Career activation' : area === 'relationship' ? 'Relationship activation' : 'Finance activation';
    const planetList = touching.map((p) => p.planet).join(' and ');
    const verb = touching.length > 1 ? 'are' : 'is';
    const supportingMatch = matches.find((m) => touching.some((p) => m.categories.includes(p.planet.toLowerCase())) || m.categories.includes(area === 'relationship' ? 'marriage' : area));
    if (supportingMatch) {
      advice.push(`${label}: transiting ${planetList} ${verb} active over this area right now. Classical texts note — "${supportingMatch.sourceText.trim()}"`);
    } else {
      advice.push(`${label}: transiting ${planetList} ${verb} currently moving through your ${area === 'career' ? 'career' : area === 'relationship' ? 'relationship' : 'finance'} house(s), traditionally a period where this area of life tends to feel more active.`);
    }
  }

  const challenges: ReportItem[] = matches
    .filter((m) => m.effectDirection === 'decrease')
    .slice(0, 4)
    .map(matchToItem);
  const strengths: ReportItem[] = matches
    .filter((m) => m.effectDirection === 'increase')
    .slice(0, 4)
    .map(matchToItem);

  const items: ReportItem[] = matches.filter((m) => m.sourceText.trim().length > 20).slice(0, 10).map(matchToItem);
  const citations: ReportCitation[] = matches.filter((m) => m.chapter).slice(0, 5).map(toReportCitation);

  return {
    id: 'transit',
    title: 'The Sky Right Now',
    status: matches.length > 0 ? 'populated' : 'partial',
    chartContext,
    tables,
    advice: advice.length > 0 ? advice : undefined,
    strengths: strengths.length > 0 ? strengths : undefined,
    challenges: challenges.length > 0 ? challenges : undefined,
    items: items.length > 0 ? items : undefined,
    citations: citations.length > 0 ? citations : undefined,
    note: matches.length === 0
      ? 'No specific classical transit rules matched these exact positions in the current Knowledge Base — the position table above still reflects real, calculated chart data.'
      : undefined,
  };
}

// ── Past validation section builder ──────────────────────────────────────────

function buildPastValidationSection(
  observations: PastObservation[],
): ReportSectionData {
  if (observations.length === 0) {
    return {
      id: 'past-validation',
      title: 'Past Period Validation',
      subtitle: 'Historical dasha periods with classical rule associations',
      status: 'pending',
    };
  }

  const rows: ReportTableRow[] = observations.map((obs) => ({
    cells: [
      obs.periodLabel,
      obs.isPast ? 'Elapsed' : 'Current',
      obs.domains.length > 0 ? obs.domains.join(', ') : '—',
      obs.ruleIds.length > 0 ? `${obs.ruleIds.length} rules` : '—',
    ],
    highlight: !obs.isPast,
    variant: obs.isPast ? 'neutral' : 'positive',
  }));

  return {
    id: 'past-validation',
    title: 'Past Period Validation',
    subtitle: 'Historical dasha periods — cross-check with lived experience',
    status: 'partial',
    tables: [{
      caption: 'Mahadasha Period Overview',
      columns: ['Period', 'Status', 'Life Areas', 'Classical Rules'],
      rows,
    }],
    note: 'Each row shows a Vimshottari Mahadasha period with associated rule counts. Use this to verify whether the horoscope aligns with your experience. Rule associations are text-based — not predictions.',
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

const LIFE_AREA_CONFIG: Array<{ id: string; title: string; subtitle: string }> = [
  { id: 'career',       title: 'Career & Profession',   subtitle: '10th house, lord, and daśā indicators' },
  { id: 'finance',      title: 'Finance & Wealth',       subtitle: '2nd, 11th house and Dhana yoga indicators' },
  { id: 'marriage',     title: 'Marriage & Partnership', subtitle: '7th house, Venus, and Navamsha indicators' },
  { id: 'love',         title: 'Love & Relationships',   subtitle: 'Venus, 5th and 7th house romantic indicators' },
  { id: 'health',       title: 'Health & Longevity',     subtitle: '1st, 6th and 8th house indicators' },
  { id: 'education',    title: 'Education',              subtitle: '4th and 5th house, Mercury and Jupiter indicators' },
  { id: 'family',       title: 'Family',                 subtitle: '2nd and 4th house, parents and domestic-life indicators' },
  { id: 'mentalNature', title: 'Mental Nature',          subtitle: 'Lagna, Moon and Mercury temperament indicators' },
  { id: 'spirituality', title: 'Spiritual Growth',       subtitle: '9th and 12th house, Jupiter and Ketu indicators' },
];

/**
 * Build the full list of ReportSectionData from an InferenceResult.
 * When ChartFacts are provided, life-area sections are enriched with
 * chart-specific context via LifeDomainInterpreter.
 *
 * Sections are returned in report order:
 *   career, finance, marriage, love, health, education, family,
 *   mentalNature, spirituality, yogas, remedies, past-validation
 */
export function buildReportSections(result: InferenceResult, facts?: ChartFacts): ReportSectionData[] {
  const domainByKey = new Map<string, DomainResult>(
    result.domains.map((d) => [d.domain, d]),
  );

  const sections: ReportSectionData[] = [];

  // Life areas — pass facts so interpreter can add chart-specific context
  for (const cfg of LIFE_AREA_CONFIG) {
    sections.push(
      buildLifeAreaSection(cfg.id, cfg.title, cfg.subtitle, domainByKey.get(cfg.id), facts),
    );
  }

  // Yoga section
  sections.push(buildYogaSection(result.yogas, domainByKey.get('yogas')));

  // Remedy section
  sections.push(
    buildRemedySection(result.remedies, domainByKey.get('remedies')),
  );

  // Past validation
  sections.push(buildPastValidationSection(result.pastObservations));

  // Transit ("The Sky Right Now")
  sections.push(buildTransitSection(result.transit?.positions ?? [], result.transit?.matches ?? []));

  return sections;
}
