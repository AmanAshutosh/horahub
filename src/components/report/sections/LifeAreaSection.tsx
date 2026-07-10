import type { ReportSectionData, ReportItem, ReportRemedyCard, ReportRemedyField } from '@/types/report';
import { SectionShell } from '../primitives/SectionShell';
import { PendingState } from '../primitives/PendingState';
import { Accordion } from '@/components/ui/Accordion';
import { CitationList } from '../primitives/CitationList';
import { EvidenceList } from '../primitives/EvidenceList';
import { TechnicalPanel } from '../primitives/TechnicalPanel';

export interface LifeAreaConfig {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  question: string;
  intro: string;
  willContain: string[];
}

interface Props {
  config: LifeAreaConfig;
  data?: ReportSectionData | null;
}

// ── Strengths / challenges group ──────────────────────────────────────────────

function InterpretedGroup({
  items,
  variant,
}: {
  items: ReportItem[];
  variant: 'strengths' | 'challenges';
}) {
  if (items.length === 0) return null;

  const label = variant === 'strengths'
    ? 'Possible patterns your chart suggests'
    : 'Challenges to be aware of';

  return (
    <div className={`life-area-group life-area-group--${variant}`}>
      <p className="life-area-group-label">{label}</p>
      {items.map((item, i) => (
        <div key={i} className="life-area-group-item">
          <p className="life-area-group-item-body">{item.body}</p>
          <TechnicalPanel>
            {item.tags && item.tags.length > 0 && (
              <p className="mb-1">
                <span style={{ color: 'var(--color-ink-subtle)' }}>Match type: </span>
                {item.tags.join(' · ')}
              </p>
            )}
            {item.citations && <CitationList citations={item.citations} />}
            {item.evidence && <EvidenceList evidence={item.evidence} />}
          </TechnicalPanel>
        </div>
      ))}
    </div>
  );
}

// ── Advice block ──────────────────────────────────────────────────────────────

function AdviceBlock({ advice }: { advice: string[] }) {
  if (advice.length === 0) return null;
  return (
    <div className="life-area-advice">
      <p className="life-area-advice-label">Practical direction</p>
      <ul className="life-area-advice-list">
        {advice.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Remedy cards ──────────────────────────────────────────────────────────────

const REMEDY_FIELD_LABELS: Record<ReportRemedyField['type'], string> = {
  worship: 'Recommended Pooja / Worship',
  mantra: 'Mantra',
  gemstone: 'Gemstone',
  donation: 'Donation / Charity',
  fasting: 'Fasting',
  lifestyle: 'Behaviour & Lifestyle Guidance',
};

function fieldRef(field: ReportRemedyField): string {
  let ref = field.chapter ? `Ch.${field.chapter}` : '';
  if (field.verse) ref += `${ref ? ', ' : ''}v.${field.verse}`;
  return ref || `Rule ${field.ruleId}`;
}

function RemedyCardList({ cards }: { cards: ReportRemedyCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="life-area-remedies">
      <p className="life-area-group-label">Remedies for this chart</p>
      {cards.map((card) => (
        <div key={card.id} className="life-area-remedy-card" data-tier={card.confidenceTier}>
          <p className="life-area-remedy-card-planet">{card.responsiblePlanet ?? 'General'}</p>

          {card.cause?.conditionRaw && (
            <p className="life-area-remedy-card-cause">
              <span className="life-area-remedy-card-cause-label">Reason from your chart: </span>
              {card.cause.conditionRaw}
            </p>
          )}

          <p className="life-area-remedy-card-explanation">{card.classicalExplanation}</p>

          <div className="life-area-remedy-fields">
            {card.fields.map((field) => (
              <div key={field.ruleId + field.type} className="life-area-remedy-field">
                <p className="life-area-remedy-field-label">{REMEDY_FIELD_LABELS[field.type] ?? field.type}</p>
                <p className="life-area-remedy-field-body">{field.raw}</p>
                <CitationList citations={[{ work: field.book, ref: fieldRef(field), text: field.raw }]} />
              </div>
            ))}
          </div>

          {card.confidenceTier === 'lifestyle' && (
            <p className="life-area-remedy-card-note">Best-effort match from classical text — lower confidence.</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export function LifeAreaSection({ config, data }: Props) {
  const isPending = !data || data.status === 'pending';

  const hasInterpretedContent = !isPending && (
    (data.strengths && data.strengths.length > 0) ||
    (data.challenges && data.challenges.length > 0) ||
    (data.advice && data.advice.length > 0)
  );

  return (
    <SectionShell
      id={config.id}
      num={config.num}
      title={config.title}
      subtitle={config.subtitle}
    >
      {/* The question this section answers */}
      <p className="life-area-question">{config.question}</p>

      {isPending ? (
        <PendingState willContain={config.willContain} />
      ) : (
        <>
          {/* Chart context — factual paragraph about relevant house/planet positions */}
          {data.chartContext ? (
            <p className="life-area-context">{data.chartContext}</p>
          ) : (
            <p className="life-area-intro">{config.intro}</p>
          )}

          {/* Brief summary count */}
          {data.summary && (
            <div className="life-area-summary">{data.summary}</div>
          )}

          {/* Interpreted: strengths, challenges, advice */}
          {hasInterpretedContent ? (
            <>
              <InterpretedGroup items={data.strengths ?? []} variant="strengths" />
              <InterpretedGroup items={data.challenges ?? []} variant="challenges" />
              <AdviceBlock advice={data.advice ?? []} />

              {/* All matched rules as collapsed technical evidence */}
              {data.items && data.items.length > 0 && (
                <div>
                  <p className="life-area-evidence-label">Classical text evidence</p>
                  {data.items.map((item) => (
                    <Accordion key={item.title} title={item.title}>
                      <div
                        className="life-area-item-body"
                        data-direction={item.direction ?? 'neutral'}
                      >
                        {item.body}
                      </div>
                      <TechnicalPanel>
                        {item.tags && item.tags.length > 0 && (
                          <p className="mb-1">
                            <span style={{ color: 'var(--color-ink-subtle)' }}>Chart indicators: </span>
                            {item.tags.join(' · ')}
                          </p>
                        )}
                        {item.citations && <CitationList citations={item.citations} />}
                        {item.evidence && <EvidenceList evidence={item.evidence} />}
                      </TechnicalPanel>
                    </Accordion>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Fallback: flat accordion list (no interpreter data available) */
            <>
              {data.items?.map((item) => (
                <Accordion key={item.title} title={item.title}>
                  <div
                    className="life-area-item-body"
                    data-direction={item.direction ?? 'neutral'}
                  >
                    {item.body}
                  </div>
                  <TechnicalPanel>
                    {item.tags && item.tags.length > 0 && (
                      <p className="mb-1">
                        <span style={{ color: 'var(--color-ink-subtle)' }}>Chart indicators: </span>
                        {item.tags.join(' · ')}
                      </p>
                    )}
                    {item.citations && <CitationList citations={item.citations} />}
                    {item.evidence && <EvidenceList evidence={item.evidence} />}
                  </TechnicalPanel>
                </Accordion>
              ))}

              {data.citations && !data.items?.length && (
                <div className="mt-4">
                  <CitationList citations={data.citations} />
                </div>
              )}
            </>
          )}

          {data.remedyCards && <RemedyCardList cards={data.remedyCards} />}

          {data.note && (
            <p className="life-area-note">{data.note}</p>
          )}
        </>
      )}
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Pre-configured life areas
// ---------------------------------------------------------------------------

export const LIFE_AREAS: LifeAreaConfig[] = [
  {
    id:       'career',
    num:      1,
    title:    'Career & Purpose',
    subtitle: 'What your chart suggests about the work you\'re naturally suited for',
    question: 'What kind of work brings out the best in you — and when does your career tend to thrive?',
    intro:
      'Your birth chart carries signals about your natural professional strengths, the environments where you perform best, and the timing of career opportunities. The findings below come directly from classical Vedic texts. Each one is specific to your chart.',
    willContain: [
      'The kind of work that suits your chart — industries, roles, working styles',
      'When your career is most likely to be active and rewarding',
      'Planets and chart areas that shape your professional life',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'finance',
    num:      2,
    title:    'Finance & Wealth',
    subtitle: 'What your chart suggests about your relationship with money',
    question: 'What does your chart say about your earning potential, financial patterns, and relationship with wealth?',
    intro:
      'Your birth chart carries signals about how money tends to flow in your life — how you earn, how you accumulate, and what planetary patterns indicate about financial opportunity. The findings below come from classical Vedic texts and are specific to your chart.',
    willContain: [
      'What your chart suggests about your natural approach to earning and saving',
      'Specific planetary combinations in your chart that classical texts link to wealth',
      'The planets most associated with finances and how they sit in your chart',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'marriage',
    num:      3,
    title:    'Marriage & Partnership',
    subtitle: 'What your chart suggests about long-term commitment',
    question: 'What does your chart say about long-term partnership and marriage?',
    intro:
      'Your birth chart reflects your natural approach to marriage — the 7th house, Venus, and the Navamsha divisional chart are the classical indicators of committed partnership. The findings below come from classical Vedic texts and are specific to your chart.',
    willContain: [
      'What your chart suggests about the timing and nature of marriage',
      'The role of Venus and the 7th house lord in your chart',
      'What your Navamsha reveals about the qualities of long-term partnership for you',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'love',
    num:      4,
    title:    'Love & Relationships',
    subtitle: 'What your chart suggests about how you connect with others',
    question: 'What patterns tend to show up in your close relationships — before and outside of marriage?',
    intro:
      'Your birth chart reflects your natural approach to romance and connection — how you attract and are attracted, and the kinds of dynamics that tend to emerge in your closest bonds. The findings below come from classical Vedic texts and are specific to your chart.',
    willContain: [
      'Your natural approach to relationships and what you tend to seek in a partner',
      'The role of Venus and the 5th house — the classical indicators of romance — in your chart',
      'Planets and chart areas that shape your relationship patterns',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'health',
    num:      5,
    title:    'Health & Wellbeing',
    subtitle: 'What your chart suggests about your constitution and vitality',
    question: 'What does your chart indicate about your physical constitution, natural strengths, and areas to pay attention to?',
    intro:
      'Classical astrology reads health through several indicators in your chart — including your Rising Sign, which reflects your overall constitution and energy. The findings below come from classical Vedic texts. This is not medical advice.',
    willContain: [
      'What your Rising Sign suggests about your overall constitution and physical energy',
      'Areas of the body or health themes that your chart highlights',
      'General vitality indicators from your birth chart',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'education',
    num:      6,
    title:    'Education',
    subtitle: 'What your chart suggests about learning and academic life',
    question: 'What does your chart say about your natural aptitude for learning and academic success?',
    intro:
      'Classical texts read education through the 4th house (formal schooling), the 5th house (intellect), and the placements of Mercury and Jupiter. The findings below come from classical Vedic texts and are specific to your chart.',
    willContain: [
      'What your chart suggests about your natural learning style and academic strengths',
      'The role of Mercury and Jupiter — the classical indicators of intellect — in your chart',
      'Periods your chart associates with academic focus or achievement',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'family',
    num:      7,
    title:    'Family',
    subtitle: 'What your chart suggests about home and family life',
    question: 'What does your chart say about your relationship with parents, siblings, and domestic life?',
    intro:
      'Classical texts read family through the 2nd house (family lineage), the 4th house (mother, home, and domestic life), and the placements of the Sun and Moon. The findings below come from classical Vedic texts and are specific to your chart.',
    willContain: [
      'What your chart suggests about your relationship with parents and siblings',
      'The role of the 4th house and its lord — the classical indicators of home life — in your chart',
      'Planets and chart areas that shape your family dynamics',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'mentalNature',
    num:      8,
    title:    'Mental Nature',
    subtitle: 'What your chart suggests about your temperament and inner disposition',
    question: 'What does your chart say about your natural temperament, character, and psychological makeup?',
    intro:
      'Classical texts read temperament through the Lagna (rising sign), the Moon (mind), and Mercury (intellect). The findings below come from classical Vedic texts and are specific to your chart.',
    willContain: [
      'What your Lagna and Moon suggest about your natural temperament',
      'The role of Mercury — the classical indicator of mental disposition — in your chart',
      'Planets and chart areas that shape your psychological nature',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'spirituality',
    num:      9,
    title:    'Spiritual Growth',
    subtitle: 'What your chart suggests about your inner and spiritual path',
    question: 'What does your chart say about your spiritual inclinations and path toward inner growth?',
    intro:
      'Classical texts read spirituality through the 9th house (dharma), the 12th house (liberation), and the placements of Jupiter and Ketu. The findings below come from classical Vedic texts and are specific to your chart.',
    willContain: [
      'What your chart suggests about your natural spiritual inclinations',
      'The role of Jupiter and Ketu — the classical indicators of spiritual growth — in your chart',
      'Periods your chart associates with inner reflection or spiritual practice',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'remedies',
    num:      17,
    title:    'Classical Remedies',
    subtitle: 'Traditional practices drawn from Vedic texts — not personal medical advice',
    question: 'Are there traditional practices that classical astrology recommends for your chart?',
    intro:
      'Classical Vedic texts describe traditional practices — pooja and worship, mantras, charitable acts, gemstones, and lifestyle guidance — associated with specific planets. The recommendations below are drawn verbatim from classical sources. Each life-area section above also shows the remedies specific to that area, linked to the chart pattern that prompted them. They reflect traditional cultural and spiritual practices only — not medical, legal, or financial guidance.',
    willContain: [
      'Gemstone recommendations based on the planets in your chart',
      'Mantra and pooja/worship suggestions for planets that need strengthening',
      'Charitable acts (Dana) based on planetary significations',
      'Source references from classical Vedic texts',
    ],
  },
];
