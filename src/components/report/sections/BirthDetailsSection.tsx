import type { ChartFacts } from '@/types/chart';
import type { PersonInfo } from '@/types/report';
import { RASHI, NAKSHATRA, SIGN_LORD } from '@/constants/astro';
import { SectionShell } from '../primitives/SectionShell';
import { DataTable } from '../primitives/DataTable';
import type { ReportTable } from '@/types/report';

interface Props {
  facts: ChartFacts;
  person: PersonInfo | null;
  utcOffset: string;
  coordinates: { lat: number; lon: number };
  num: number;
}

export function BirthDetailsSection({ facts, person, utcOffset, coordinates, num }: Props) {
  const birthTable: ReportTable = {
    caption: 'Provided and resolved birth data',
    columns: ['Field', 'Value'],
    rows: [
      { cells: ['Date of Birth', person?.birthDate ?? '—'] },
      { cells: ['Time of Birth', person?.birthTime ?? '—'] },
      { cells: ['Place of Birth', person?.placeName ?? '—'] },
      { cells: ['Latitude', coordinates.lat.toFixed(4) + '°'] },
      { cells: ['Longitude', coordinates.lon.toFixed(4) + '°'] },
      { cells: ['UTC Offset', utcOffset] },
    ],
  };

  const panchaTable: ReportTable = {
    caption: 'Computed panchanga elements',
    columns: ['Element', 'Value'],
    rows: [
      { cells: ['Ayanāṁśa (Lahiri)', facts.ayanamsa.toFixed(4) + '°'] },
      {
        cells: ['Lagna (Ascendant)', `${RASHI[facts.lagnaSign] ?? '—'} ~${facts.ascendant.degree.toFixed(2)}°`],
        highlight: true,
      },
      { cells: ['Lagna Lord', SIGN_LORD[facts.lagnaSign] ?? '—'] },
      { cells: ['Moon Sign (Rashi)', RASHI[facts.moon.sign] ?? '—'] },
      { cells: ['Birth Star (Nakshatra)', NAKSHATRA[facts.moon.nakshatra] ?? '—'] },
      { cells: ['Nakshatra Pada', String(facts.moon.pada)] },
      { cells: ['Daśā Lord at Birth', facts.dasha.periods[0]?.lord ?? '—'] },
    ],
  };

  return (
    <SectionShell id="birth" num={num} title="Birth Details" subtitle="Input data and computed panchanga elements">
      <div className="grid gap-4 sm:grid-cols-2">
        <DataTable table={birthTable} compact />
        <DataTable table={panchaTable} compact />
      </div>
      <p className="mt-3 text-[11.5px] text-ink-muted print:text-gray-500">
        Coordinates and timezone were resolved from the entered place name; the UTC offset accounts for
        daylight saving in effect on the birth date. Ayanamsa applied: Lahiri (Chitrapaksha). House
        system: Whole-Sign.
      </p>
    </SectionShell>
  );
}
