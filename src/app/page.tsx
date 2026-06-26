import type { Metadata } from 'next';
import { BirthForm } from '@/components/BirthForm';

export const metadata: Metadata = {
  title: 'New chart',
  description: 'Enter birth details to compute a nine-graha chart with sourced interpretation.',
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 pb-24 pt-5">
      <header className="mb-4">
        <h1 className="text-[22px] font-semibold tracking-tight">
          Hora<span className="text-gold">Hub</span>
        </h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Birth details → computed nine-graha chart → sourced reading. No coordinates to look up.
        </p>
      </header>
      <div className="mb-4 rounded-xl2 border border-[#3a2f1f] border-l-[3px] border-l-gold bg-gradient-to-r from-[#1a1525] to-[#141420] px-3.5 py-3 text-[12px] text-[#cdbf9a]">
        Interpretations quote classical significations and cite their source; they are not forecasts and
        carry no confidence score. Positions use a compact analytic ephemeris — production swaps in Swiss
        Ephemeris for boundary-precise charts.
      </div>
      <BirthForm />
    </main>
  );
}
