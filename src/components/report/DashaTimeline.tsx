import type { ChartFacts } from '@/types/chart';
import { fmtDate } from '@/interpret';
import { TechnicalPanel } from './primitives/TechnicalPanel';
import { RASHI } from '@/constants/astro';

const COLORS: Record<string, string> = {
  Ketu:    '#5A5230',
  Venus:   '#8B3A6B',
  Sun:     '#7B5230',
  Moon:    '#3A5A88',
  Mars:    '#8B3030',
  Rahu:    '#4A2A7A',
  Jupiter: '#4A3A7A',
  Saturn:  '#3A3A6A',
  Mercury: '#2D6A6A',
};

const PLANET_THEMES: Record<string, string> = {
  Sun:     'leadership, confidence, and self-expression',
  Moon:    'emotional awareness, intuition, and personal connections',
  Mars:    'ambition, direct action, and physical energy',
  Mercury: 'communication, sharp thinking, and analytical work',
  Jupiter: 'wisdom, expansion, and fortunate opportunities',
  Venus:   'relationships, creativity, and enjoyment of life',
  Saturn:  'discipline, responsibility, and long-term achievement',
  Rahu:    'ambitious change, unconventional paths, and intense focus',
  Ketu:    'spiritual depth, inner wisdom, and a tendency toward detachment',
};

const HOUSE_THEMES: Record<number, string> = {
  1: 'self and vitality', 2: 'wealth and speech', 3: 'courage and initiative',
  4: 'home and inner peace', 5: 'creativity and intelligence', 6: 'health and service',
  7: 'relationships and partnership', 8: 'transformation', 9: 'fortune and higher wisdom',
  10: 'career and public life', 11: 'income and gains', 12: 'spirituality and release',
};

// What each planetary period means for a person's life — human first
const PERIOD_CHAPTER_MEANING: Record<string, string> = {
  Sun:
    'This phase of your life — the Sun chapter — is about coming into your own authority. ' +
    'It is a period for clarifying who you are, what you stand for, and stepping more fully ' +
    'into your own leadership. Career, recognition, and a deeper sense of personal identity ' +
    'tend to be at the forefront during Sun periods.',
  Moon:
    'This phase of your life — the Moon chapter — is about emotional deepening and ' +
    'connection. Home, family, and your inner life ask for more genuine attention. It is a ' +
    'period when the quality of your close relationships and your sense of inner security tend ' +
    'to matter more than outward achievement.',
  Mars:
    'This phase of your life — the Mars chapter — is one of energy, initiative, and decisive ' +
    'action. Goals you have been building toward become ready to pursue with real force. It is ' +
    'a period that rewards boldness and direct effort — and one where impulsiveness and conflict ' +
    'are worth managing carefully.',
  Mercury:
    'This phase of your life — the Mercury chapter — is about ideas, skill, and connection. ' +
    'Communication, learning, and sharp decision-making are favoured. New connections, new ' +
    'skills, and increased intellectual engagement tend to characterise this time. It is a good ' +
    'period for writing, business, and any work that requires clear, quick thinking.',
  Jupiter:
    'This phase of your life — the Jupiter chapter — is one of the more naturally fortunate in ' +
    'the cycle. It tends to bring genuine expansion: in wisdom, in opportunity, in the quality ' +
    'of what arrives in your life. Growth in education, financial wellbeing, and meaningful ' +
    'relationships is possible — this period tends to open doors that stay open.',
  Venus:
    'This phase of your life — the Venus chapter — is about relationships, creative expression, ' +
    'and an increased quality of life. Partnerships tend to be active and meaningful. Creative ' +
    'and aesthetic work flourishes. There is often a natural increase in comfort, enjoyment, ' +
    'and the pleasure of shared experience.',
  Saturn:
    'This phase of your life — the Saturn chapter — is about building foundations that last. ' +
    'Saturn\'s period calls for disciplined effort, patience, and the gradual consolidation of ' +
    'what you have been working toward. Shortcuts tend not to hold during Saturn periods — but ' +
    'what you build carefully tends to define decades.',
  Rahu:
    'This phase of your life — the Rahu chapter — is one of intense ambition and rapid change. ' +
    'Rahu periods can be exhilarating and disorienting in equal measure: old patterns give way ' +
    'and new, sometimes unexpected directions open up. Significant gains are possible — so is ' +
    'significant disruption. Clarity of values and personal grounding are the keys.',
  Ketu:
    'This phase of your life — the Ketu chapter — is one of release, reflection, and inward ' +
    'focus. External ambitions tend to lose their grip, and something more essential comes ' +
    'forward: spiritual clarity, deep technical mastery, or the clearing of old patterns. ' +
    'Loss that happens during Ketu periods often makes room for something more truly yours.',
};

// Practical guidance for how to use the period
const PERIOD_HOW_TO_USE: Record<string, string> = {
  Sun:
    'Use this period to step into leadership, own your values clearly, and pursue roles or ' +
    'work that reflect who you genuinely are. Avoid staying hidden or indefinitely deferring ' +
    'your own direction to others.',
  Moon:
    'Use this period to invest in relationships, pay real attention to your emotional needs, ' +
    'and consider changes to your living situation if they have felt long overdue. Inner ' +
    'clarity tends to come through stillness rather than constant activity during Moon periods.',
  Mars:
    'Use this period to take decisive action on goals you have been hesitant about. Channel ' +
    'the energy into focused projects with tangible outcomes. Be mindful of conflict, rushing, ' +
    'and the impulse to force outcomes before their time.',
  Mercury:
    'Use this period for learning, networking, and sharpening how you communicate. Start ' +
    'projects you have been researching. Make decisions from good information rather than ' +
    'intuition alone — this is a period that rewards preparation and clear thinking.',
  Jupiter:
    'Use this period for meaningful moves — studying, investing in your development, expanding ' +
    'into genuinely promising new areas. Classical texts consider this one of the periods most ' +
    'supportive of growth; the main caution is overexpansion — doing everything because it all ' +
    'seems possible.',
  Venus:
    'Use this period for important relationship choices, creative projects, and investments ' +
    'in quality of life. It is a natural time for partnership decisions and for work that ' +
    'brings genuine beauty, connection, or enjoyment into the world.',
  Saturn:
    'Use this period to build — not to rush. Invest in expertise, long-term health habits, ' +
    'and structures that can support the years ahead. The work put in during Saturn periods ' +
    'tends to lay a foundation the next chapter can build on. Classical texts consistently ' +
    'note that shortcuts during this period tend not to hold.',
  Rahu:
    'Use this period\'s energy to pursue ambitious goals, but with clear values and conscious ' +
    'grounding. Unfocused Rahu energy can scatter widely without producing lasting results. ' +
    'Investigate what you truly want — then move boldly and ethically toward it.',
  Ketu:
    'Use this period to simplify, reflect, and let go of what no longer genuinely serves you. ' +
    'Spiritual practice, deep specialised work, and inner development tend to flourish. Resist ' +
    'the pressure to appear visibly productive — this period often prepares the ground for ' +
    'what arrives in the next chapter.',
};

function signName(i: number): string {
  return RASHI[i] ?? '?';
}

function dignityLabel(d: string): string {
  if (d === 'exalted') return ' (exalted — strong)';
  if (d === 'own') return ' (own sign — dignified)';
  if (d === 'debilitated') return ' (debilitated — weakened)';
  return '';
}

/** Derive which house numbers a planet rules in this chart */
function ruledHousesOf(planet: string, facts: ChartFacts): number[] {
  return facts.houses.filter(h => h.lord === planet).map(h => h.house);
}

/** Build the personalized current-chapter paragraph from chart facts */
function buildCurrentChapterNarrative(facts: ChartFacts): string | null {
  const { periods, currentMahaIndex, antardashas, currentAntarIndex } = facts.dasha;
  const maha = periods[currentMahaIndex];
  if (!maha) return null;

  const lord = maha.lord;
  const lordPl = facts.planets[lord as keyof typeof facts.planets];
  if (!lordPl) return null;

  // 1. What this phase of life is about (human meaning first)
  const chapterMeaning = PERIOD_CHAPTER_MEANING[lord] ??
    `This phase of your life — the ${lord} chapter — brings ${lord}'s qualities to the foreground.`;
  let narrative = chapterMeaning;

  // 2. Which life areas are active (from ruled houses — in human terms)
  const ruled = ruledHousesOf(lord, facts);
  if (ruled.length > 0) {
    const areaNames = ruled.map(h => HOUSE_THEMES[h] ?? `house ${h}`).join(' and ');
    narrative += ` In your specific chart, ${lord} governs ${areaNames} — so these areas of life tend to be particularly active and significant during this period.`;
  }

  // 3. How to use the period
  const howToUse = PERIOD_HOW_TO_USE[lord];
  if (howToUse) narrative += ` ${howToUse}`;

  // 4. Technical context at the end (not leading)
  const start = fmtDate(maha.startMs);
  const end = fmtDate(maha.endMs);
  narrative += ` (This period runs from ${start} to ${end}`;
  narrative += `; ${lord} sits in ${signName(lordPl.sign)}${dignityLabel(lordPl.dignity)} in your chart.)`;

  // 5. Antardasha note
  const antar = antardashas[currentAntarIndex];
  if (antar) {
    const antarLord = antar.lord;
    const antarThemes = PLANET_THEMES[antarLord] ?? antarLord;
    const antarEnd = fmtDate(antar.endMs);
    narrative += ` Within this chapter, your current sub-period is ${antarLord} Antardasha (until ${antarEnd}), adding its own emphasis on ${antarThemes}.`;
  }

  return narrative;
}

export function DashaTimeline({ facts }: { facts: ChartFacts }) {
  const { periods, antardashas, currentMahaIndex, currentAntarIndex } = facts.dasha;
  const first = periods[0];
  const last  = periods[periods.length - 1];
  const total = first && last ? last.endMs - first.startMs : 1;
  const currentMaha = periods[currentMahaIndex];

  // Build personalized current-chapter narrative from chart facts
  const chapterNarrative = buildCurrentChapterNarrative(facts);

  return (
    <div id="dasha-table" className="scroll-mt-4">

      {/* Personalized current-chapter callout */}
      {chapterNarrative && currentMaha && (
        <div className="dasha-callout">
          <p className="dasha-callout-label">Your current chapter</p>
          <p className="dasha-callout-heading">{currentMaha.lord} Mahadasha</p>
          <p className="dasha-callout-body">{chapterNarrative}</p>
        </div>
      )}

      <p className="mb-3 text-[13px] leading-relaxed text-ink-muted print:text-gray-500">
        Below is the complete sequence of planetary periods across your life. Each colored block
        is one major period — lasting anywhere from 6 to 20 years. The highlighted block is where
        you are right now. Sub-periods within your current chapter are listed below the overview.
      </p>

      {/* Coloured timeline bar */}
      <div className="my-2 flex h-8 overflow-hidden rounded-[9px] border border-line">
        {periods.map((p, i) => {
          const w = ((p.endMs - p.startMs) / total) * 100;
          return (
            <div
              key={i}
              title={`${p.lord}: ${fmtDate(p.startMs)} – ${fmtDate(p.endMs)}`}
              style={{ flex: `0 0 ${w.toFixed(2)}%`, background: COLORS[p.lord] ?? '#6b7280' }}
              className={`flex items-center justify-center overflow-hidden whitespace-nowrap text-[9.5px] font-extrabold text-white/90 ${
                i === currentMahaIndex ? 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9)]' : ''
              }`}
            >
              {w > 5 ? p.lord.slice(0, 2) : ''}
            </div>
          );
        })}
      </div>
      <p className="mb-4 text-[11px] text-ink-muted print:text-gray-400">
        Each block is one major period · the outlined block is your current period · full sequence
        spans 120 years
      </p>

      {/* Major periods table */}
      <table className="w-full border-collapse text-[13px] print:text-[11px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-wide text-ink-muted print:text-gray-400">
            <th className="border-b border-line py-1.5 text-left">Major Period</th>
            <th className="border-b border-line py-1.5 text-left">Starts</th>
            <th className="border-b border-line py-1.5 text-left">Ends</th>
            <th className="border-b border-line py-1.5 text-left">Length</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p, i) => (
            <tr key={i} className={i === currentMahaIndex ? 'bg-accent/12 print:bg-gray-100' : ''}>
              <td className="border-b border-line py-1.5 font-medium print:border-gray-200">
                <span>{p.lord}</span>
                {i === currentMahaIndex && (
                  <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary print:bg-gray-200 print:text-gray-600">
                    you are here
                  </span>
                )}
                {p.partial && (
                  <span className="ml-1 text-[11px] text-ink-muted print:text-gray-400">
                    {' '}(started before birth)
                  </span>
                )}
              </td>
              <td className="border-b border-line py-1.5 print:border-gray-200">
                {fmtDate(p.startMs)}
              </td>
              <td className="border-b border-line py-1.5 print:border-gray-200">
                {fmtDate(p.endMs)}
              </td>
              <td className="border-b border-line py-1.5 text-ink-muted print:border-gray-200 print:text-gray-400">
                {p.years} yr
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sub-periods within the current major period */}
      {currentMahaIndex >= 0 && antardashas.length > 0 && currentMaha && (
        <div className="mt-6">
          <p className="mb-1 text-[13px] font-semibold print:text-gray-700">
            Sub-periods within your {currentMaha.lord} chapter
          </p>
          <p className="mb-3 text-[12px] leading-relaxed text-ink-muted print:text-gray-500">
            Within each major period, shorter sub-periods cycle through all nine planets —
            each adding its own flavour of energy. The highlighted row is your current sub-period.
          </p>
          <table className="w-full border-collapse text-[13px] print:text-[11px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-ink-muted print:text-gray-400">
                <th className="border-b border-line py-1.5 text-left">Sub-period</th>
                <th className="border-b border-line py-1.5 text-left">Themes</th>
                <th className="border-b border-line py-1.5 text-left">Starts</th>
                <th className="border-b border-line py-1.5 text-left">Ends</th>
              </tr>
            </thead>
            <tbody>
              {antardashas.map((a, i) => (
                <tr
                  key={i}
                  className={i === currentAntarIndex ? 'bg-accent/12 print:bg-gray-100' : ''}
                >
                  <td className="border-b border-line py-1.5 font-medium print:border-gray-200">
                    {a.lord}
                    {i === currentAntarIndex && (
                      <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary print:bg-gray-200 print:text-gray-600">
                        active
                      </span>
                    )}
                  </td>
                  <td className="border-b border-line py-1.5 text-[12px] text-ink-muted print:border-gray-200 print:text-gray-500">
                    {PLANET_THEMES[a.lord] ?? ''}
                  </td>
                  <td className="border-b border-line py-1.5 print:border-gray-200">
                    {fmtDate(a.startMs)}
                  </td>
                  <td className="border-b border-line py-1.5 print:border-gray-200">
                    {fmtDate(a.endMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TechnicalPanel>
        <div className="space-y-1">
          <p>
            <span className="text-ink-subtle">System: </span>
            Vimshottari Dasha — a 120-year cycle of planetary major periods (Mahādaśā) and
            sub-periods (Antardaśā)
          </p>
          <p>
            <span className="text-ink-subtle">Calculated from: </span>
            The Moon&apos;s position in its Nakshatra (lunar mansion) at the time of birth
          </p>
        </div>
      </TechnicalPanel>
    </div>
  );
}
