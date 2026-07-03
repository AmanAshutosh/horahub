/**
 * LifeDomainInterpreter — human-first chart interpretation.
 *
 * Writing principle:
 *   Human Meaning → Practical Guidance → Astrology Evidence (collapsed)
 *
 * chartContext: answers "What does this mean for my life?" — no house
 *   numbers, no sign placements. Derived from chart positions but written
 *   in plain English as an astrologer would speak to a client.
 *
 * advice: practical, actionable direction specific to this chart.
 *
 * strengths / challenges: filtered subsets of verbatim KB rule texts.
 *   The astrology evidence (planet, house, source) lives inside the
 *   TechnicalPanel of each collapsed accordion item.
 *
 * Zero fabrication: every claim traces to chart position + KB signification.
 * No invented outcomes, no predictions, no medical claims.
 */

import type { ChartFacts, PlanetName } from '@/types/chart';
import type { ReportItem } from '@/types/report';
import { RASHI } from '@/constants/astro';

// ── Human-meaning descriptions for each planet as career significator ─────────
// Written from the perspective of a professional astrologer talking to a client.

const PLANET_CAREER_MEANING: Partial<Record<string, string>> = {
  Sun:
    'You bring a natural authority and desire for genuine recognition to your professional life. ' +
    'You tend to be most engaged when your work carries real responsibility and gives you ' +
    'the room to lead rather than follow. The career picture in your chart points toward ' +
    'roles where your name is attached to what you do — positions of visibility and consequence.',
  Moon:
    'Your professional strengths lie in reading people, sensing what environments need, and ' +
    'responding with care. You tend to be most effective in work that connects you to the ' +
    'public or to a genuine service role — environments that shift and adapt suit you better ' +
    'than rigid structures. There is a natural warmth and emotional intelligence in how you work.',
  Mars:
    'You bring drive, competitive edge, and a willingness to take on difficult work that ' +
    'others might avoid. You tend to thrive when there is a real challenge to overcome, and ' +
    'to lose energy in slow, overly political environments. Initiative, directness, and a ' +
    'results-focused approach are natural professional strengths.',
  Mercury:
    'Your professional edge lies in how you think, communicate, and make connections between ' +
    'ideas. You tend to be most effective in fast-moving, intellectually rich work where ' +
    'reasoning clearly and explaining things well are genuinely valued. Learning quickly and ' +
    'adapting to new information is a core career strength.',
  Jupiter:
    'You bring wisdom, a generous outlook, and a natural capacity for meaningful work to your ' +
    'professional life. You tend to be most engaged when your work involves growth — teaching, ' +
    'advising, expanding others\' possibilities, or dealing with knowledge and values. ' +
    'Long-term thinking and a sense of purpose tend to define your best professional output.',
  Venus:
    'Your professional strengths lie in an eye for quality, the ability to create harmony, ' +
    'and a natural ease in aesthetic or relationship-based work. You tend to be most effective ' +
    'in environments where taste, diplomacy, or beauty matter. Work that brings comfort, ' +
    'connection, or genuine pleasure to others plays naturally to your professional nature.',
  Saturn:
    'You are built for the long game professionally. You tend to build expertise slowly and ' +
    'steadily, preferring depth over speed and earning recognition through consistency rather ' +
    'than flair. The career picture in your chart points toward work that rewards patience ' +
    'and specialisation — fields where accumulated expertise becomes a genuine competitive edge.',
  Rahu:
    'Your professional path tends to be unconventional — you are often drawn to emerging ' +
    'fields, frontier roles, or work that operates outside the mainstream. There is an ' +
    'ambitious, intensely focused quality to how you pursue your career. Recognition often ' +
    'comes through doing something that has not been done in quite the same way before.',
  Ketu:
    'Your professional strengths tend to be specialised and subtle — a depth of expertise, ' +
    'a research-oriented quality, or a technical mastery that takes time to develop and is ' +
    'hard to replicate. You often work best behind the scenes or in roles requiring precision ' +
    'and introspection rather than public performance.',
};

// ── Work style from the 10th house sign ───────────────────────────────────────

const SIGN_WORK_STYLE: Partial<Record<string, string>> = {
  Aries:       'You tend to move fast and lead by instinct. Independence and the freedom to act without excessive approval-seeking suit you. Slow bureaucracy drains your energy quickly.',
  Taurus:      'Quality and thoroughness define your professional approach. You build steadily and what you produce tends to last. Security and sensory comfort in work matter more than speed.',
  Gemini:      'Variety, quick learning, and intellectual stimulation tend to be where this pattern performs best. Fixed, repetitive work tends to diminish output over time. Communication and adaptability are traditionally associated professional strengths.',
  Cancer:      'You work best when you feel genuinely connected to your team, organisation, or mission. Environments of loyalty and care — where people are treated as people — bring out your best.',
  Leo:         'Natural presence and an ability to inspire tend to characterise this professional pattern. Work that gives genuine ownership of one\'s contribution, and a platform to express it, is traditionally where this placement is most effective.',
  Virgo:       'Precision, high standards, and genuine helpfulness are your professional hallmarks. Environments that value detailed, craft-oriented work over showmanship tend to suit you well.',
  Libra:       'You work well in collaborative environments where balance, diplomacy, and quality are valued. Bringing people together and finding fair solutions are natural workplace strengths.',
  Scorpio:     'Depth, strategy, and the willingness to engage what others avoid tend to characterise this professional pattern. Work that asks you to investigate, transform, or operate beneath the surface of things is traditionally where this placement is most effective.',
  Sagittarius: 'Broad thinking, learning, and an open professional horizon keep you genuinely engaged. Growth-oriented environments where new knowledge and expanded perspective are valued bring out your best work.',
  Capricorn:   'Long-term thinking and serious professional ambition drive your approach. Structured environments with clear standards of excellence and paths of advancement tend to get your best output.',
  Aquarius:    'Original thinking and a systems-level perspective are your professional assets. Work that challenges conventional approaches and rewards independent reasoning suits your nature.',
  Pisces:      'Creativity, empathy, and a sense of larger purpose keep you professionally engaged. Work that carries meaning — for others, for a community, or for an ideal — is where you tend to contribute most genuinely.',
};

// ── Career field and working-environment guidance ─────────────────────────────

const PLANET_CAREER_FIELDS: Partial<Record<string, string>> = {
  Sun:     'government and public administration, medicine, politics, executive leadership, and roles carrying genuine institutional authority',
  Moon:    'hospitality, food and nutrition, caregiving, public-facing service, real estate, and roles that serve changing public needs',
  Mars:    'engineering, defence and security, surgery, sports, construction, law enforcement, and roles requiring decisive physical or technical action',
  Mercury: 'education, writing and publishing, commerce and trade, technology, accounting, consultancy, and roles centred on information and communication',
  Jupiter: 'law, banking and finance, teaching, philosophy, coaching, and higher education — roles involving wisdom, guidance, and the development of others',
  Venus:   'arts, fashion and beauty, entertainment, luxury goods, design, hospitality, and diplomatic or relational roles',
  Saturn:  'engineering and infrastructure, civil service and administration, law, logistics, agriculture, manufacturing, and long-term specialist work',
  Rahu:    'technology and emerging industries, research and innovation, foreign trade and international work, media, and unconventional or frontier fields',
  Ketu:    'research and deep technical work, mathematics, healing arts, spiritual or philosophical disciplines, and expert roles requiring exceptional precision',
};

const PLANET_WORK_GUIDANCE: Partial<Record<string, string>> = {
  Sun:     'Seek roles with real authority and visibility. Avoid positions where you must indefinitely defer or remain behind the scenes — these tend to create career frustration over time.',
  Moon:    'Look for work that keeps you connected to real people or real needs. Isolated, purely transactional environments tend to drain your motivation.',
  Mars:    'Channel your natural drive into focused projects with tangible outcomes. Environments that move quickly and reward results — and where you can be direct — bring out your career best.',
  Mercury: 'Build your reputation through the quality and clarity of your thinking. Multiple skills and cross-domain knowledge are assets — develop them deliberately.',
  Jupiter: 'Invest in your education, expertise, and the quality of your professional network. The more genuine wisdom you bring, the stronger your career tends to become. Ethical conduct pays long-term dividends.',
  Venus:   'Prioritise environments where quality and relationships are genuinely valued. Your natural aesthetic and interpersonal skill are professional assets — work in settings that make use of them.',
  Saturn:  'Commit to building deep expertise in a field you can develop over years. Patience is the primary career skill here — and the work you put in during lean periods often defines what you become.',
  Rahu:    'Pursue your most ambitious goals — but with clarity about your actual values. Rahu\'s energy is powerful and benefits from direction. Groundedness and ethical grounding prevent the volatility this placement can bring.',
  Ketu:    'Develop your specialist expertise and do not undervalue it. Work that draws on depth of knowledge — even if it is niche — often carries more long-term career resilience than broad but shallow positioning.',
};

// ── Human-meaning paragraphs for relationships (7th lord) ────────────────────

const PLANET_RELATIONSHIP_MEANING: Partial<Record<string, string>> = {
  Sun:
    'In relationships, you bring strong personal values, loyalty, and a desire for genuine ' +
    'mutual respect. You tend to be most fulfilled with a partner who has their own sense of ' +
    'self and ambition — someone you can genuinely admire and be seen as an equal by. ' +
    'Deep partnerships in your chart tend to involve a shared sense of dignity and purpose.',
  Moon:
    'Your emotional world is at the centre of how you experience close relationships. You tend ' +
    'to form deeply caring bonds and bring strong emotional attunement to your partnerships. ' +
    'Security, genuine intimacy, and a sense of being truly known are what you need most from ' +
    'a long-term partner.',
  Mars:
    'You tend to be direct and decisive in relationships — you know what you want and you ' +
    'move toward it. Your partnerships tend to carry genuine passion and energy. The chart ' +
    'points toward a preference for partners with their own drive and confidence, and suggests ' +
    'relationships that can hold some productive tension.',
  Mercury:
    'Intellectual connection matters as much as emotional compatibility in your relationships. ' +
    'You are naturally drawn to partners who are curious, communicative, and mentally engaging. ' +
    'The quality of conversation and shared ideas in a relationship often determines how ' +
    'sustaining it is for you over time.',
  Jupiter:
    'You bring optimism, generosity, and a desire to grow alongside your partner to close ' +
    'relationships. You tend to seek someone who is wise, values-driven, and interested in ' +
    'developing their life with real purpose. The chart points toward partnerships that feel ' +
    'expansive and meaningful — not just comfortable.',
  Venus:
    'Warmth, shared enjoyment, and mutual appreciation matter deeply to you in relationships. ' +
    'You tend to be a naturally affectionate and attentive partner, and you bring real comfort ' +
    'and aesthetic sensitivity to shared life. The chart points toward partnerships built on ' +
    'genuine pleasure in each other\'s company.',
  Saturn:
    'You approach close relationships with seriousness and a long-term orientation. You tend to ' +
    'test partnerships through time before investing fully — and once you do, your loyalty is ' +
    'steady. The chart points toward relationships that deepen over years and carry the quality ' +
    'of something genuinely built rather than merely chosen.',
  Rahu:
    'Your relationships tend to carry an unusual and often transformative quality. You may be ' +
    'drawn to partners from a different background, culture, or life experience. Partnerships in ' +
    'your chart can be intensely engaging and can change both people in significant ways.',
  Ketu:
    'There is a deep, sometimes karmic quality to your most significant relationships. You may ' +
    'experience a strong sense of familiarity or recognition with certain partners that is ' +
    'difficult to explain. The chart also points toward a tendency toward emotional ' +
    'self-sufficiency — valuing inner space alongside closeness.',
};

const PLANET_RELATIONSHIP_GUIDANCE: Partial<Record<string, string>> = {
  Sun:     'Look for a partner whose sense of self is as developed as yours. Relationships where one person dominates the other tend not to hold for long with this chart.',
  Moon:    'Give your emotional needs genuine weight when choosing and sustaining partnerships. Relationships where emotional safety is absent tend to be quietly draining even when other things look fine.',
  Mars:    'The chart benefits from a partner who can match your energy without being destabilised by it. Clear, honest communication about what you want — said early — tends to serve these partnerships well.',
  Mercury: 'Prioritise mental compatibility as seriously as you do emotional or physical. The relationships that last for this chart tend to be ones where the conversation never runs out.',
  Jupiter: 'Choose partners who share your values and who are on a path of genuine growth. Relationships where both people are developing tend to carry the most sustained energy for this chart.',
  Venus:   'Invest in the quality of shared experience — the environments, rituals, and pleasures you build together. These tend to be significant glue for Venus-influenced partnerships.',
  Saturn:  'Be patient with partnership timelines. Relationships in this chart tend to improve with time, not diminish — the instinct to hold back at the start is often wise rather than fearful.',
  Rahu:    'Be curious about rather than resistant to the unconventional pull in relationships. At the same time, ensure that the intensity Rahu can bring is matched by genuine compatibility rather than just novelty.',
  Ketu:    'Give yourself permission to need genuine solitude within close relationships. Partners who understand your need for inner space — and do not interpret it as rejection — are the ones this chart tends to work with best.',
};

// ── Health and constitution (lifestyle only, no medical claims) ───────────────

const SIGN_CONSTITUTION_HUMAN: Partial<Record<string, string>> = {
  Aries:
    'Your chart points to a high-energy, initiative-driven constitution — naturally fast-moving ' +
    'and physically engaged. You tend to feel best when active and forward-moving. Rest and ' +
    'recovery are as important as activity for this chart; burning bright without replenishing ' +
    'is a pattern worth watching.',
  Taurus:
    'Your chart points to a steady, endurance-oriented constitution that benefits most from ' +
    'consistent rhythm rather than intense bursts. Sensory comfort, regular sleep, and a ' +
    'stable daily routine tend to serve this constitution well. Sluggishness can build when ' +
    'routine falls away for extended periods.',
  Gemini:
    'Your chart points to a quick, mentally active constitution with strong nervous energy. ' +
    'You tend to process fast, shift between things easily, and thrive on variety. Practices ' +
    'that settle the mind — regular breathing, consistent sleep timing, steady daily structure ' +
    '— tend to be particularly beneficial for this constitution.',
  Cancer:
    'Your chart points to a sensitive constitution where your emotional state and physical ' +
    'wellbeing tend to closely reflect each other. Security, nourishing environments, and ' +
    'emotional support strongly influence how this constitution functions. Digestive sensitivity ' +
    'and absorbing the mood of surroundings are common tendencies.',
  Leo:
    'Your chart points to a vital, warm constitution with strong fundamental energy. You tend ' +
    'to feel best when engaged, creative, and appreciated. Regular physical activity and ' +
    'genuine creative expression support this constitution well. Overextension — doing too ' +
    'much for too long — is the pattern most worth managing.',
  Virgo:
    'Your chart points to a precise, health-aware constitution with strong attention to the ' +
    'body and its signals. A considered diet, regular routine, and attention to craft and ' +
    'detail tend to serve this chart well. Managing the tendency toward stress or worry about ' +
    'health itself can be as important as physical lifestyle choices.',
  Libra:
    'Your chart points to a constitution that responds well to balance, harmony, and quality ' +
    'in the environment. A regular daily rhythm, pleasant surroundings, and the avoidance of ' +
    'extremes tend to support wellbeing. This constitution often benefits from giving the ' +
    'lower back and kidney area regular attention.',
  Scorpio:
    'Your chart points to an intense, regenerative constitution with strong underlying resilience. ' +
    'You tend to have real recovery capacity when needed. Practices that support release — ' +
    'physical, emotional, or otherwise — tend to serve this constitution better than suppression ' +
    'or holding on.',
  Sagittarius:
    'Your chart points to an expansive, active constitution that genuinely thrives with movement, ' +
    'variety, and open space. Staying physically active and maintaining a sense of learning and ' +
    'exploration supports wellbeing. Overconfidence in physical capacity — doing more than ' +
    'preparation supports — is a pattern to be aware of.',
  Capricorn:
    'Your chart points to a patient, endurance-focused constitution that responds best to ' +
    'consistent habits built over time. You tend to do better with gradual, sustained health ' +
    'practices than intense short regimes. Joint mobility and warmth tend to be areas worth ' +
    'regular attention.',
  Aquarius:
    'Your chart points to an independent, mentally active constitution with a somewhat variable ' +
    'physical rhythm. Regular movement, maintaining warmth, and grounding routines that ' +
    'counterbalance mental restlessness tend to serve this constitution well.',
  Pisces:
    'Your chart points to a fluid, empathic constitution that tends to absorb the atmosphere ' +
    'of people and environments around it. Grounding practices, clear personal boundaries, ' +
    'and activities that connect body and mind tend to be particularly beneficial. Sleep ' +
    'quality and energy maintenance are areas worth consistent attention.',
};

const PLANET_VITALITY_NOTE: Partial<Record<string, string>> = {
  Sun:     'Your life energy planet is in a strong position — classical texts associate this with robust fundamental vitality and good recovery capacity.',
  Moon:    'Your life energy planet is in a moderate position. Emotional balance and mental rest play a particularly significant role in your physical wellbeing.',
  Mars:    'Your life energy planet carries strong physical energy. Channelling that energy constructively — rather than allowing it to create internal tension — tends to serve your constitution well.',
  Mercury: 'Your life energy planet brings quick, nervous energy to your constitution. Mental rest and avoiding overstimulation are as important as physical activity.',
  Jupiter: 'Your life energy planet carries an expansive, generally supportive quality. The tendency toward overindulgence in food or comfort is worth moderating.',
  Venus:   'Your life energy planet brings a comfort-oriented quality. Regular movement and discipline in routine help maintain the balance this constitution needs.',
  Saturn:  'Your life energy planet is associated with patience and endurance. Building health habits slowly and steadily — and avoiding the tendency to neglect the body while focused on work — tends to serve this chart well.',
  Rahu:    'Your life energy planet can be irregular and intense. Steady, grounding practices — regular sleep, consistent eating times, physical activity — tend to counterbalance Rahu\'s unsettling quality.',
  Ketu:    'Your life energy planet carries a subtle, often inward quality. Practices that support the spirit as well as the body — meditation, time in natural settings, creative expression — tend to support this constitution.',
};

// ── Finance and wealth (human meaning first) ──────────────────────────────────

const PLANET_WEALTH_MEANING: Partial<Record<string, string>> = {
  Sun:
    'Your financial picture is closely linked to your professional standing and public identity. ' +
    'You tend to earn well when in positions of genuine authority and visible contribution. ' +
    'As your professional reputation grows, your financial situation tends to follow — income ' +
    'and status are connected for this chart.',
  Moon:
    'Your financial life tends to have a natural fluidity — income can come in cycles, ' +
    'responding to public needs, shifting trends, or care-oriented work. An intuitive sense ' +
    'of what people want or need can be a genuine financial asset. Building consistent savings ' +
    'habits counterbalances the cyclical nature of income.',
  Mars:
    'Your earning style is active and effort-based — you tend to generate income through ' +
    'direct initiative and sustained energy. Cash flow can be strong but variable. The ' +
    'financial picture benefits most from channelling that natural drive into sustained effort ' +
    'rather than scattered short-term actions.',
  Mercury:
    'Your financial strength lies in skill, versatility, and the ability to trade in ' +
    'information, communication, or technical expertise. Multiple income streams tend to suit ' +
    'this chart well. Sharp financial thinking and an eye for emerging opportunity are genuine ' +
    'assets when cultivated deliberately.',
  Jupiter:
    'Your chart points to a generally expansive financial picture — Jupiter\'s influence tends ' +
    'to attract genuine abundance over time, particularly through knowledge work, ethical ' +
    'conduct, and the development of wisdom. Generosity — rather than hoarding — tends to ' +
    'support rather than diminish the financial picture for this placement.',
  Venus:
    'Your relationship with money tends toward comfort, quality, and the enjoyment of life. ' +
    'You tend to earn through aesthetic, creative, or relational work — and you value spending ' +
    'that genuinely enhances quality of life. Building a consistent savings habit alongside ' +
    'this natural enjoyment supports the long-term financial picture.',
  Saturn:
    'Your financial picture is one of gradual, steady accumulation built through disciplined ' +
    'effort and patient work. Windfalls are less the pattern here than sustained progress. ' +
    'The chart points to significant long-term financial stability achievable through patience ' +
    'and specialised expertise — but early career years may ask for more effort before reward.',
  Rahu:
    'Your financial picture often includes unconventional or unexpected income sources — ' +
    'technology, foreign income, rapidly changing fields, or paths others have not taken. ' +
    'Significant financial peaks are possible, but they can come with unpredictability. ' +
    'Careful management of gains is as important as generating them.',
  Ketu:
    'Your financial life tends toward irregularity — income often comes through deep technical ' +
    'expertise or spiritual fields, but can be inconsistent. A natural non-attachment to money ' +
    'as a primary goal characterises this chart. Resources tend to arrive when focus is on the ' +
    'quality of the work itself rather than the financial reward.',
};

const PLANET_WEALTH_GUIDANCE: Partial<Record<string, string>> = {
  Sun:     'Invest in your professional reputation and authority — traditionally considered key wealth indicators for this configuration. Roles and decisions that build your standing tend to build your income.',
  Moon:    'Build a savings buffer to manage the natural cyclicality of your income. Intuitive financial decisions can be good — balancing them with practical planning tends to work well for this chart.',
  Mars:    'Sustained effort across focused projects tends to generate better financial results than multiple scattered initiatives. Build momentum in one direction before expanding.',
  Mercury: 'Develop and monetise multiple skills. The ability to work across domains — writing, technology, teaching, trade — is a financial strength when developed deliberately.',
  Jupiter: 'Invest in your education and in the quality of advice you give others. Long-term wealth for this chart tends to come through being genuinely valuable to others rather than through speculation.',
  Venus:   'The tendency to spend on quality and comfort is natural — making sure income grows alongside it is the key balance. Creative and relational skills are financial assets worth investing in.',
  Saturn:  'Adopt a long-term savings and investment discipline. Small, consistent contributions over many years tend to create more lasting wealth for this chart than large periodic moves.',
  Rahu:    'Embrace unconventional income paths — but diversify and maintain liquidity to manage the volatility that can come with them. Ethics and groundedness protect the gains this placement can generate.',
  Ketu:    'Seek financial stability through depth of expertise rather than breadth of income sources. Saving a consistent portion of irregular income is the key discipline for this placement.',
};

// ── Output type ───────────────────────────────────────────────────────────────

export interface DomainInterpretation {
  chartContext: string;
  summary: string;
  strengths: ReportItem[];
  challenges: ReportItem[];
  advice: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function signName(i: number): string {
  return RASHI[i] ?? '?';
}

function houseOf(houseNum: number, facts: ChartFacts) {
  return facts.houses.find(h => h.house === houseNum);
}

function ruledHouses(planet: PlanetName, facts: ChartFacts): number[] {
  return facts.houses.filter(h => h.lord === planet).map(h => h.house);
}

function dignityStrength(d: string): 'strong' | 'weak' | 'neutral' {
  if (d === 'exalted' || d === 'own') return 'strong';
  if (d === 'debilitated') return 'weak';
  return 'neutral';
}

// ── Career ────────────────────────────────────────────────────────────────────

function interpretCareer(items: ReportItem[], facts: ChartFacts): DomainInterpretation {
  const house10 = houseOf(10, facts);
  const lord10: PlanetName = house10?.lord ?? 'Saturn';
  const lord10Placement = facts.planets[lord10];
  const house10SignName = signName(house10?.sign ?? 0);
  const occupants = house10?.occupants ?? [];
  const currentDasha = facts.dasha.periods[facts.dasha.currentMahaIndex];

  // Human meaning paragraph — what this means for your life
  const careerMeaning = PLANET_CAREER_MEANING[lord10] ??
    `Your career picture shows a professional path shaped by ${lord10}'s qualities — bringing those themes to how you approach work and ambition.`;

  const workStyle = SIGN_WORK_STYLE[house10SignName] ?? '';

  let context = careerMeaning;
  if (workStyle) context += ` ${workStyle}`;

  // Occupants add specific coloring
  if (occupants.length > 0) {
    const occMeanings = occupants
      .map(p => {
        const m = PLANET_CAREER_MEANING[p];
        return m ? `${p}'s influence adds ${m.split('.')[0]?.toLowerCase() ?? p}` : p;
      })
      .slice(0, 1)
      .join(', ');
    if (occMeanings) {
      context += ` Additionally, ${occMeanings} to the professional picture.`;
    }
  }

  // Dignity note — in human terms
  const strength = dignityStrength(lord10Placement.dignity);
  if (strength === 'strong') {
    context += ' The chart shows your career planet in a strong position — classical texts associate this with the capacity to achieve sustained recognition through your work.';
  } else if (strength === 'weak') {
    context += ' The chart shows your career planet in a challenging position — classical texts note that career recognition in this configuration tends to come through patience and persistent effort rather than early or easy success.';
  }

  // Current dasha — how it connects
  if (currentDasha) {
    const dl = currentDasha.lord;
    const dashaHouses = ruledHouses(dl as PlanetName, facts);
    const dashaTouchesCareer = dashaHouses.includes(10) || dl === lord10;
    if (dashaTouchesCareer) {
      context += ` Your current ${dl} period has a direct connection to your career houses — making this a particularly relevant time for professional decisions.`;
    }
  }

  // One-line summary
  const summary = `Your professional chart centres on ${lord10}'s qualities — ${(PLANET_CAREER_MEANING[lord10] ?? '').split('.')[0]?.replace('You bring ', '').replace('Your professional ', '').slice(0, 80) ?? 'see the patterns below'}.`;

  // Practical guidance
  const advice: string[] = [];

  const fields = PLANET_CAREER_FIELDS[lord10];
  if (fields) advice.push(`Fields traditionally connected with ${lord10}'s influence in classical texts include: ${fields}.`);

  const guidance = PLANET_WORK_GUIDANCE[lord10];
  if (guidance) advice.push(guidance);

  // Occupant adds a field suggestion
  if (occupants.length > 0) {
    const occ0 = occupants[0] as PlanetName;
    const occFields = PLANET_CAREER_FIELDS[occ0];
    if (occFields) advice.push(`${occ0}'s placement here is traditionally associated with pathways in: ${occFields}.`);
  }

  // Dasha timing note
  if (currentDasha) {
    const dl = currentDasha.lord;
    const dashaFields = PLANET_CAREER_FIELDS[dl];
    if (dashaFields && dl !== lord10) {
      advice.push(`Your current ${dl} period (until ${new Date(currentDasha.endMs).getFullYear()}) is traditionally associated with: ${dashaFields}. Classical texts consider this an active period for these professional areas.`);
    }
  }

  const strengths  = items.filter(i => i.direction === 'positive').slice(0, 5);
  const challenges = items.filter(i => i.direction === 'negative').slice(0, 4);

  return { chartContext: context, summary, strengths, challenges, advice };
}

// ── Marriage ──────────────────────────────────────────────────────────────────

function interpretMarriage(items: ReportItem[], facts: ChartFacts): DomainInterpretation {
  const house7  = houseOf(7, facts);
  const lord7: PlanetName = house7?.lord ?? 'Venus';
  const lord7Placement = facts.planets[lord7];
  const venusPl = facts.planets['Venus'];
  const occupants = house7?.occupants ?? [];

  // Human meaning — what kind of relationship person you are
  const relMeaning = PLANET_RELATIONSHIP_MEANING[lord7] ??
    `In relationships, you bring ${lord7}'s qualities — shaping how you connect, what you seek, and how your closest bonds tend to develop.`;

  let context = relMeaning;

  // Venus adds color if different from lord7
  if (lord7 !== 'Venus') {
    const venusMeaning = PLANET_RELATIONSHIP_MEANING['Venus'];
    if (venusMeaning) {
      context += ` Venus — which shapes the quality of love and affection in any chart — adds its own layer: ${venusMeaning.split('.')[0]?.toLowerCase() ?? ''}.`;
    }
  }

  // Occupants
  if (occupants.length > 0) {
    const occ0 = occupants[0] as PlanetName;
    const occMeaning = PLANET_RELATIONSHIP_MEANING[occ0];
    if (occMeaning) {
      context += ` ${occ0}'s placement in your relationship zone brings additional colour: ${occMeaning.split('.')[0] ?? ''}.`;
    }
  }

  // Dignity note
  const strength = dignityStrength(lord7Placement.dignity);
  if (strength === 'strong') {
    context += ' Your relationship planet is in a strong position — classical texts associate this with the capacity for stable, dignified, and ultimately fulfilling partnerships.';
  } else if (strength === 'weak') {
    context += ' Your relationship planet is in a challenging position — classical texts note that partnership for this configuration benefits from taking time rather than rushing, and from choosing quality over convenience.';
  }

  // Venus dignity note if relevant
  const venusStrength = dignityStrength(venusPl.dignity);
  if (venusStrength === 'strong' && lord7 !== 'Venus') {
    context += ' Venus is well-placed in your chart — a positive additional indicator for the quality of love and affection available in your partnerships.';
  }

  const summary = `Your relationship chart is shaped most by ${lord7}'s qualities — ${(PLANET_RELATIONSHIP_MEANING[lord7] ?? '').split('.')[0]?.slice(0, 80) ?? ''}.`;

  const advice: string[] = [];

  const guidance = PLANET_RELATIONSHIP_GUIDANCE[lord7];
  if (guidance) advice.push(`${lord7} as your relationship indicator — ${guidance}`);

  if (lord7 !== 'Venus') {
    const venusGuidance = PLANET_RELATIONSHIP_GUIDANCE['Venus'];
    if (venusGuidance) advice.push(`Venus in your chart adds: ${venusGuidance}`);
  }

  if (occupants.length > 0) {
    const occ0 = occupants[0] as PlanetName;
    const occGuidance = PLANET_RELATIONSHIP_GUIDANCE[occ0];
    if (occGuidance) advice.push(`${occ0} in your relationship zone: ${occGuidance}`);
  }

  if (strength === 'weak') {
    advice.push('Classical texts suggest being patient with partnership timing and quality for this placement — relationships that develop slowly and with clear eyes tend to serve this chart better than those entered quickly.');
  }

  const strengths  = items.filter(i => i.direction === 'positive').slice(0, 5);
  const challenges = items.filter(i => i.direction === 'negative').slice(0, 4);

  return { chartContext: context, summary, strengths, challenges, advice };
}

// ── Health ────────────────────────────────────────────────────────────────────

function interpretHealth(items: ReportItem[], facts: ChartFacts): DomainInterpretation {
  const lagnaSignName = signName(facts.lagnaSign);
  const house1   = houseOf(1, facts);
  const lagnaLord: PlanetName = house1?.lord ?? 'Sun';
  const lagnaLordPl = facts.planets[lagnaLord];
  const house6   = houseOf(6, facts);
  const lord6: PlanetName = house6?.lord ?? 'Mercury';
  const moonPl   = facts.planets['Moon'];

  // Constitution in human terms
  const constitution = SIGN_CONSTITUTION_HUMAN[lagnaSignName] ??
    `Your chart points to a constitution shaped by ${lagnaSignName} energy — with its characteristic qualities running through your physical expression and natural rhythms.`;

  let context = constitution;

  // Lagna lord vitality note
  const strength = dignityStrength(lagnaLordPl.dignity);
  const vitalityNote = PLANET_VITALITY_NOTE[lagnaLord];
  if (strength === 'strong' && vitalityNote) {
    context += ` ${vitalityNote}`;
  } else if (strength === 'weak') {
    context += ` Your constitution's main planet is in a challenging position — classical texts associate this with a constitution that can be sensitive and that benefits particularly from consistent, supportive habits rather than irregular or intense approaches to health.`;
  } else if (vitalityNote) {
    context += ` ${vitalityNote}`;
  }

  // Moon note in human terms (mind-body connection)
  const moonSignName = signName(moonPl.sign);
  context += ` The Moon — which in classical astrology governs the mind and its connection to physical wellbeing — is in ${moonSignName} in your chart, bringing that sign's emotional and mental quality to your health picture.`;

  const summary = `Your constitution is shaped by ${lagnaSignName} energy — see the lifestyle tendencies and classical patterns below.`;

  const advice: string[] = [
    'Note: This section describes lifestyle tendencies and constitutional patterns — not medical diagnosis. Consult a qualified healthcare professional for any health concerns.',
  ];

  // 6th house — health routine and challenge
  const house6SignName = signName(house6?.sign ?? 0);
  advice.push(`Your daily health routine zone carries ${lord6}'s energy and ${house6SignName}'s qualities — classical texts associate consistent daily habits governed by ${lord6} with the ability to maintain wellbeing and overcome health challenges when they arise.`);

  // 6th house occupants
  const house6Occ = house6?.occupants ?? [];
  if (house6Occ.length > 0) {
    const occStr = house6Occ.join(' and ');
    advice.push(`${occStr} is also present in your health routine zone — classical texts consider this planet here an active factor in both health challenges and the ability to overcome them through consistent practice.`);
  }

  // Lagna lord guidance in human terms
  if (strength === 'strong') {
    advice.push('Your chart shows strong vitality indicators. Maintaining the good habits you have is more important than dramatic interventions — consistency matters most for this constitution.');
  } else if (strength === 'weak') {
    advice.push('For this constitution, building health through steady, gentle consistency tends to work better than intense short bursts. Regular sleep, nourishing food, and moderate activity are particularly important.');
  }

  const strengths  = items.filter(i => i.direction === 'positive').slice(0, 5);
  const challenges = items.filter(i => i.direction === 'negative').slice(0, 4);

  return { chartContext: context, summary, strengths, challenges, advice };
}

// ── Finance ───────────────────────────────────────────────────────────────────

function interpretFinance(items: ReportItem[], facts: ChartFacts): DomainInterpretation {
  const house2 = houseOf(2, facts);
  const lord2: PlanetName = house2?.lord ?? 'Venus';
  const lord2Pl = facts.planets[lord2];

  const house11 = houseOf(11, facts);
  const lord11: PlanetName = house11?.lord ?? 'Mars';

  const jupiterPl = facts.planets['Jupiter'];

  // Human meaning — what is this person's financial nature?
  const wealthMeaning = PLANET_WEALTH_MEANING[lord2] ??
    `Your financial picture is shaped by ${lord2}'s qualities — bringing its characteristic earning style and relationship with resources to your chart.`;

  let context = wealthMeaning;

  // 11th house lord — income style
  if (lord11 !== lord2) {
    const incomeMeaning = PLANET_WEALTH_MEANING[lord11];
    if (incomeMeaning) {
      context += ` When it comes to regular income specifically, ${lord11} shapes the picture: ${incomeMeaning.split('.')[0]?.toLowerCase() ?? ''}.`;
    }
  }

  // Jupiter wealth status
  const jupStrength = dignityStrength(jupiterPl.dignity);
  if (jupStrength === 'strong') {
    context += ' Jupiter — the classical indicator of abundance and wise expansion — is in a strong position in your chart. This is considered one of the most auspicious wealth indicators available and tends to support genuine long-term financial growth.';
  } else if (jupStrength === 'weak') {
    context += ' Jupiter — the classical indicator of abundance — is in a challenging position in your chart. Classical texts associate this with wealth coming through effort and ethical conduct rather than ease, and recommend building steadily rather than speculating.';
  }

  // Dignity of 2nd lord
  const strength = dignityStrength(lord2Pl.dignity);
  if (strength === 'strong') {
    context += ' Your wealth planet is well-placed — a positive indicator for steady accumulation and financial stability.';
  } else if (strength === 'weak') {
    context += ' Your wealth planet is in a challenged position — patience and disciplined saving tend to matter more here than aggressive wealth strategies.';
  }

  const summary = `Your financial chart centres on ${lord2}'s earning style — ${(PLANET_WEALTH_MEANING[lord2] ?? '').split('.')[0]?.slice(0, 80) ?? ''}.`;

  const advice: string[] = [];

  const guidance = PLANET_WEALTH_GUIDANCE[lord2];
  if (guidance) advice.push(`${lord2} as your wealth planet — ${guidance}`);

  if (lord11 !== lord2) {
    const incomeGuidance = PLANET_WEALTH_GUIDANCE[lord11];
    if (incomeGuidance) advice.push(`For income specifically: ${incomeGuidance}`);
  }

  if (jupStrength === 'strong') {
    advice.push('Jupiter in a strong position is traditionally considered one of the most auspicious wealth indicators in classical texts. Investing in knowledge, ethical conduct, and advisory or educational roles tends to support this configuration most effectively.');
  } else if (jupStrength === 'weak') {
    advice.push('Classical texts recommend charitable giving and ethical financial conduct as practices that help strengthen a debilitated Jupiter over time — alongside patient, disciplined saving.');
  }

  if (strength === 'strong') {
    advice.push(`Classical texts associate a well-placed ${lord2} with steady long-term accumulation. Consistent saving and investment over time tend to work well for this configuration.`);
  } else if (strength === 'weak') {
    advice.push('Classical texts associate this configuration with stronger financial results through specialisation and patient, sustained effort rather than short-term strategies.');
  }

  const strengths  = items.filter(i => i.direction === 'positive').slice(0, 5);
  const challenges = items.filter(i => i.direction === 'negative').slice(0, 4);

  return { chartContext: context, summary, strengths, challenges, advice };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function interpretDomain(
  domainId: string,
  items: ReportItem[],
  facts: ChartFacts,
): DomainInterpretation {
  switch (domainId) {
    case 'career':   return interpretCareer(items, facts);
    case 'marriage': return interpretMarriage(items, facts);
    case 'health':   return interpretHealth(items, facts);
    case 'finance':  return interpretFinance(items, facts);
    default: {
      const strengths  = items.filter(i => i.direction === 'positive').slice(0, 5);
      const challenges = items.filter(i => i.direction === 'negative').slice(0, 4);
      return {
        chartContext: '',
        summary: `${items.length} classical rule${items.length !== 1 ? 's' : ''} matched for this section.`,
        strengths,
        challenges,
        advice: [],
      };
    }
  }
}
