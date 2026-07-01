import type { ReadingSection } from '@/types/reading';
import { SectionShell } from '../primitives/SectionShell';
import { Accordion } from '@/components/ui/Accordion';
import { Cite } from '@/components/ui/Cite';
import { TechnicalPanel } from '../primitives/TechnicalPanel';

// Human-friendly names — no jarring classical labels
const HOUSE_NAMES: Record<number, string> = {
  1:  'Self & First Impressions',
  2:  'Money & How You Speak',
  3:  'Communication & Courage',
  4:  'Home & Inner Happiness',
  5:  'Creativity, Intelligence & Children',
  6:  'Health, Service & Daily Life',
  7:  'Relationships & Partnership',
  8:  'Transformation & Hidden Depth',
  9:  'Purpose, Wisdom & Good Fortune',
  10: 'Career & Public Life',
  11: 'Income, Friends & Long-term Goals',
  12: 'Rest, Retreat & Inner Life',
};

interface Props {
  housesSection?: ReadingSection;
  num: number;
}

export function HouseAnalysisSection({ housesSection, num }: Props) {
  return (
    <SectionShell
      id="houses"
      num={num}
      title="Your Life Areas — In Detail"
      subtitle="What your birth chart says about each domain of your life"
    >
      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        Your birth chart speaks to twelve distinct areas of life — from career and relationships
        to health, creativity, and inner life. Below are the classical findings for each area,
        drawn directly from Vedic source texts.
      </p>

      {housesSection ? (
        <div>
          {housesSection.items.map((item) => (
            <Accordion key={item.title} title={item.title}>
              <p className="text-[13px] leading-relaxed">{item.body}</p>
              <TechnicalPanel>
                {item.tags && item.tags.length > 0 && (
                  <p className="mb-1">
                    <span className="text-ink-subtle">Chart indicators: </span>
                    {item.tags.join(' · ')}
                  </p>
                )}
                {item.citation && <Cite citation={item.citation} />}
              </TechnicalPanel>
            </Accordion>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-line/60 bg-panel-soft px-5 py-4 print:border-gray-200">
          <p className="text-[13px] text-ink-muted print:text-gray-500">
            House-by-house interpretations will appear here once the inference engine has finished
            processing your chart.
          </p>
          <p className="mt-2 text-[12px] text-ink-subtle print:text-gray-400">
            The raw house data (sign, ruling planet, and occupants for all 12 houses) is available
            in the{' '}
            <a
              href="#tech-ref"
              className="text-gold/70 underline underline-offset-2 hover:text-gold"
            >
              Technical Reference
            </a>
            .
          </p>
        </div>
      )}

      {/* Life area index */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted print:text-gray-400">
          The 12 life areas
        </p>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {(Object.entries(HOUSE_NAMES) as [string, string][]).map(([n, name]) => (
            <div key={n} className="flex gap-1.5 text-[11.5px] print:text-gray-600">
              <span className="shrink-0 font-mono text-[10px] text-ink-subtle print:text-gray-400">
                {String(n).padStart(2, '0')}
              </span>
              <span className="text-ink-muted">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <TechnicalPanel>
        <p>House system: Whole-Sign (each house spans exactly one zodiac sign)</p>
        <p className="mt-1">
          Full house table (sign, ruling planet, lord&apos;s position, occupants) →{' '}
          <a
            href="#tech-ref"
            className="text-gold/70 underline underline-offset-2 hover:text-gold"
          >
            Technical Reference
          </a>
        </p>
      </TechnicalPanel>
    </SectionShell>
  );
}
