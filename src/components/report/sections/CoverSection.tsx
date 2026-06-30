import type { ChartFacts } from '@/types/chart';
import type { PersonInfo } from '@/types/report';
import { RASHI, NAKSHATRA, SIGN_LORD } from '@/constants/astro';

function fmtBirthDate(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[Number(m) - 1]} ${y}`;
}

function KvItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-muted print:text-gray-400">{label}</div>
      <div className="mt-0.5 text-[13.5px] font-semibold print:text-gray-900">{value}</div>
    </div>
  );
}

interface Props {
  facts: ChartFacts;
  person: PersonInfo | null;
  kbVersion: string;
  generatedAt: string;
}

export function CoverSection({ facts, person, kbVersion, generatedAt }: Props) {
  const currentDasha = facts.dasha.periods[facts.dasha.currentMahaIndex];
  const currentAntar = facts.dasha.antardashas[facts.dasha.currentAntarIndex];
  const lagna = RASHI[facts.lagnaSign];
  const moonSign = RASHI[facts.moon.sign];
  const moonNak = NAKSHATRA[facts.moon.nakshatra];

  return (
    <section
      id="cover"
      className="mb-2 overflow-hidden rounded-xl2 border border-line bg-panel print:rounded-none print:border-none print:bg-white"
    >
      {/* Header band */}
      <div className="border-b border-line bg-gradient-to-r from-[#1b1733] to-panel px-6 py-4 print:border-gray-200 print:bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/60 print:text-gray-400">
              HoraHub · Jyotiṣa Engine
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted print:text-gray-500">
              Vedic Astrology Consultation Report
            </p>
          </div>
          <p className="text-right text-[11px] text-ink-muted print:text-gray-400">
            {generatedAt}
          </p>
        </div>
      </div>

      {/* Client name */}
      <div className="border-b border-line px-6 py-6 print:border-gray-200">
        <p className="text-[11px] uppercase tracking-widest text-ink-muted print:text-gray-400">
          Prepared for
        </p>
        <h1 className="mt-1 text-[32px] font-bold leading-tight tracking-tight text-gold print:text-gray-900">
          {person?.fullName ?? '—'}
        </h1>
        {person?.gender && (
          <p className="mt-0.5 text-[12px] text-ink-muted capitalize print:text-gray-500">
            {person.gender.toLowerCase()}
          </p>
        )}
      </div>

      {/* Key facts grid */}
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-3 print:border-gray-200 print:bg-gray-200">
        {[
          { label: 'Date of Birth', value: fmtBirthDate(person?.birthDate ?? '') },
          { label: 'Time of Birth', value: person?.birthTime ?? '—' },
          { label: 'Place of Birth', value: person?.placeName ?? '—' },
          { label: 'Lagna (Ascendant)', value: `${lagna} · lord ${SIGN_LORD[facts.lagnaSign]}` },
          { label: 'Moon Sign · Nakshatra', value: `${moonSign} · ${moonNak} p${facts.moon.pada}` },
          {
            label: 'Current Mahādaśā',
            value: currentDasha
              ? `${currentDasha.lord}${currentAntar ? ` / ${currentAntar.lord}` : ''}`
              : '—',
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-panel px-4 py-3.5 print:bg-white">
            <KvItem label={label} value={value} />
          </div>
        ))}
      </div>

      {/* Footer meta */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-6 py-3 text-[11px] text-ink-muted print:text-gray-400">
        <span>Chart ID: <code className="font-mono print:text-gray-600">{kbVersion}</code></span>
        <span>Knowledge Base: v{kbVersion}</span>
        <span>Calculation: Swiss Ephemeris (Lahiri ayanamsa, Whole-Sign houses)</span>
      </div>
    </section>
  );
}
