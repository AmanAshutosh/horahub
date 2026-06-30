import type { ReportSectionData } from '@/types/report';
import { SectionShell } from '../primitives/SectionShell';
import { PendingState } from '../primitives/PendingState';
import { Accordion } from '@/components/ui/Accordion';
import { CitationList } from '../primitives/CitationList';
import { EvidenceList } from '../primitives/EvidenceList';

const DIRECTION_CLASS: Record<string, string> = {
  positive: 'border-l-good',
  negative: 'border-l-danger',
  neutral: 'border-l-line',
};

export interface LifeAreaConfig {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  willContain: string[];
}

interface Props {
  config: LifeAreaConfig;
  data?: ReportSectionData | null;
}

export function LifeAreaSection({ config, data }: Props) {
  const isPending = !data || data.status === 'pending';

  return (
    <SectionShell
      id={config.id}
      num={config.num}
      title={config.title}
      subtitle={config.subtitle}
      breakBefore={config.num > 10}
    >
      {isPending ? (
        <PendingState willContain={config.willContain} />
      ) : (
        <>
          {data.summary && (
            <p className="mb-4 text-[13.5px] leading-relaxed text-[#cfd0dd] print:text-gray-700">
              {data.summary}
            </p>
          )}
          {data.items?.map((item) => (
            <Accordion
              key={item.title}
              title={item.title}
              subtitle={item.tags?.join(' · ')}
            >
              <div className={`border-l-2 pl-3 ${item.direction ? DIRECTION_CLASS[item.direction] : 'border-l-line'}`}>
                <p className="text-[13px] leading-relaxed">{item.body}</p>
              </div>
              {item.citations && <CitationList citations={item.citations} />}
              {item.evidence && <EvidenceList evidence={item.evidence} />}
            </Accordion>
          ))}
          {data.citations && <CitationList citations={data.citations} />}
          {data.note && (
            <p className="mt-3 text-[11.5px] text-ink-muted print:text-gray-500">{data.note}</p>
          )}
        </>
      )}
    </SectionShell>
  );
}

/* Pre-configured life-area definitions — wired in ReportView */
export const LIFE_AREAS: LifeAreaConfig[] = [
  {
    id: 'career',
    num: 11,
    title: 'Career & Profession',
    subtitle: '10th house, lord, and daśā indicators',
    willContain: [
      'Dominant career significations from 10th house and its lord',
      'Planets aspecting or occupying the 10th',
      'Navamsha 10th house analysis',
      'Career-timing from Dasamsha (D10)',
      'Current daśā influence on profession',
      'Source citations from BPHS, Phaladeepika',
    ],
  },
  {
    id: 'marriage',
    num: 12,
    title: 'Marriage & Partnership',
    subtitle: '7th house, Venus, and Navamsha indicators',
    willContain: [
      '7th house sign, lord placement and aspects',
      'Venus and Jupiter role in partnership',
      'Upapada Lagna (UL) analysis',
      'Navamsha Lagna and 7th house',
      'Timing of marriage from daśā and Jaimini methods',
      'Source citations from BPHS, Horasara',
    ],
  },
  {
    id: 'health',
    num: 13,
    title: 'Health & Longevity',
    subtitle: '1st, 6th and 8th house indicators',
    willContain: [
      'Lagna lord strength and vitality',
      '6th house and afflictions to Moon',
      'Functional malefics affecting 1st/6th/8th',
      'Ayurbala (longevity tripod) planets',
      'Constitution type based on Lagna sign',
      'Source citations from BPHS longevity chapters',
    ],
  },
  {
    id: 'finance',
    num: 14,
    title: 'Finance & Wealth',
    subtitle: '2nd, 11th house and Dhana yoga indicators',
    willContain: [
      '2nd house lord placement and strength',
      '11th house (gains) and its lord',
      'Dhana yogas in the chart',
      'Jupiter and Venus as natural wealth significators',
      'Wealth potential from Navamsha and D2 (Hora)',
      'Source citations from BPHS, Phaladeepika',
    ],
  },
  {
    id: 'remedies',
    num: 15,
    title: 'Classical Remedies',
    subtitle: 'Upayas prescribed in cited texts — not personal medical advice',
    willContain: [
      'Gemstone recommendations based on Lagna lord',
      'Mantra prescriptions for afflicted planets',
      'Dana (charitable donations) based on planet significations',
      'Yantra and deity worship per classical rules',
      'Source citations from BPHS, Horasara, Phaladeepika',
    ],
  },
];
