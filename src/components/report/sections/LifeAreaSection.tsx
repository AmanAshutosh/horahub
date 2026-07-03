import type { ReportSectionData, ReportItem } from '@/types/report';
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
    ? 'What your chart suggests going for you'
    : 'Points the classical texts flag';

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
    id:       'marriage',
    num:      2,
    title:    'Relationships & Partnership',
    subtitle: 'What your chart suggests about how you connect with others',
    question: 'What patterns tend to show up in your close relationships — and what does your chart say about long-term partnership?',
    intro:
      'Your birth chart reflects your natural approach to relationships — how you connect, what you look for in a partner, and the kinds of dynamics that tend to emerge in your closest bonds. The findings below come from classical Vedic texts and are specific to your chart.',
    willContain: [
      'Your natural approach to relationships and what you tend to seek in a partner',
      'The role of Venus — the planet most associated with love — in your chart',
      'What your chart reveals about the qualities of long-term partnership for you',
      'Source references from classical Vedic texts',
    ],
  },
  {
    id:       'health',
    num:      3,
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
    id:       'finance',
    num:      4,
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
    id:       'remedies',
    num:      11,
    title:    'Classical Remedies',
    subtitle: 'Traditional practices drawn from Vedic texts — not personal medical advice',
    question: 'Are there traditional practices that classical astrology recommends for your chart?',
    intro:
      'Classical Vedic texts describe traditional practices — mantras, charitable acts, and gemstones — associated with specific planets. The recommendations below are drawn verbatim from classical sources. They reflect traditional cultural and spiritual practices only — not medical, legal, or financial guidance.',
    willContain: [
      'Gemstone recommendations based on the planets in your chart',
      'Mantra suggestions for planets that need strengthening',
      'Charitable acts (Dana) based on planetary significations',
      'Source references from classical Vedic texts',
    ],
  },
];
