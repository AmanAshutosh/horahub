/**
 * Report builder — maps InferenceResult to ReportSectionData[].
 *
 * Each section is populated ONLY from matched rules. The only text in any
 * output field is rule.sourceText (verbatim) or a structural label derived
 * from metadata (e.g. "BPHS Ch.24, v.12"). No prose is ever synthesised.
 *
 * Sections produced:
 *   career, marriage, health, finance, remedies   — LifeAreaSection
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
} from '@/types/report';
import type { InferenceResult, MatchedRule, DomainResult, DetectedYoga, ExtractedRemedy, PastObservation } from './types';

// ── Book display names ────────────────────────────────────────────────────────

const BOOK_DISPLAY: Record<string, string> = {
  BPHS:  'Brihat Parashara Hora Shastra',
  HORA:  'Horasara',
  PHALA: 'Phaladeepika',
  LOL:   'Light on Life',
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
): ReportSectionData {
  if (!domain || domain.matches.length === 0) {
    return { id, title, subtitle, status: 'pending' };
  }

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

  return {
    id,
    title,
    subtitle,
    status: sectionStatus(domain),
    items,
    citations: topCitations.length > 0 ? topCitations : undefined,
    evidence: domain.matches.slice(0, 8).map(toReportEvidence),
    note,
  };
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

// ── Past validation section builder ──────────────────────────────────────────

function buildPastValidationSection(
  observations: PastObservation[],
  allMatches: MatchedRule[],
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
  { id: 'career',   title: 'Career & Profession',  subtitle: '10th house, lord, and daśā indicators' },
  { id: 'marriage', title: 'Marriage & Partnership', subtitle: '7th house, Venus, and Navamsha indicators' },
  { id: 'health',   title: 'Health & Longevity',    subtitle: '1st, 6th and 8th house indicators' },
  { id: 'finance',  title: 'Finance & Wealth',      subtitle: '2nd, 11th house and Dhana yoga indicators' },
];

/**
 * Build the full list of ReportSectionData from an InferenceResult.
 * Sections are returned in report order:
 *   career, marriage, health, finance, yogas, remedies, past-validation
 */
export function buildReportSections(result: InferenceResult): ReportSectionData[] {
  const domainByKey = new Map<string, DomainResult>(
    result.domains.map((d) => [d.domain, d]),
  );

  const sections: ReportSectionData[] = [];

  // Life areas
  for (const cfg of LIFE_AREA_CONFIG) {
    sections.push(
      buildLifeAreaSection(cfg.id, cfg.title, cfg.subtitle, domainByKey.get(cfg.id)),
    );
  }

  // Yoga section
  sections.push(buildYogaSection(result.yogas, domainByKey.get('yogas')));

  // Remedy section
  sections.push(
    buildRemedySection(result.remedies, domainByKey.get('remedies')),
  );

  // Past validation
  sections.push(buildPastValidationSection(result.pastObservations, []));

  return sections;
}
