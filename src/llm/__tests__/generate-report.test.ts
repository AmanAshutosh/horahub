import { describe, it, expect, vi } from 'vitest';
import { generateNarrativeReport } from '../generate-report';
import type { LlmClient } from '../client';
import type { ReportBrief, LifeDomainBrief, MahadashaBrief, AntardashaBrief, MergedObservation } from '@/narrative';

function fakeClient(): LlmClient & { calls: Array<{ prompt: string; system?: string }> } {
  const calls: Array<{ prompt: string; system?: string }> = [];
  return {
    id: 'fake',
    calls,
    generate: vi.fn(async (prompt: string, opts) => {
      calls.push({ prompt, system: opts?.system });
      return `[generated for: ${prompt.slice(0, 30)}]`;
    }),
  };
}

function mergedObs(overrides: Partial<MergedObservation> = {}): MergedObservation {
  return {
    domain: 'Career', topicKey: 'Career::x', primaryClaim: 'Career is growing', polarity: 'positive',
    strengthTier: 'natal', confidence: 0.8, nuance: [], corroboration: [],
    supportingObservationIds: ['obs:1'], contributingRuleIds: ['r1'], ...overrides,
  };
}

function domainWithData(domain: LifeDomainBrief['domain']): LifeDomainBrief {
  return { domain, hasData: true, observations: [mergedObs({ domain })], remedies: [], riskLevel: 'low' };
}
function domainWithoutData(domain: LifeDomainBrief['domain']): LifeDomainBrief {
  return { domain, hasData: false, observations: [], remedies: [], riskLevel: 'low' };
}

describe('generateNarrativeReport', () => {
  it('generates an overview, every data-bearing domain, and skips empty domains', async () => {
    const client = fakeClient();
    const brief: ReportBrief = {
      computedAt: new Date().toISOString(),
      lifeDomains: [domainWithData('Career'), domainWithoutData('Business')],
      mahadashas: [],
      overallDirection: [mergedObs({ domain: 'Overall Life Direction' })],
    };

    const result = await generateNarrativeReport(brief, { client, concurrency: 2 });

    expect(result.overview).toContain('[generated for:');
    expect(result.lifeDomains.Career).toContain('[generated for:');
    expect(result.lifeDomains.Business).toBeUndefined();
  });

  it('skips the overview call when there is no cross-domain data', async () => {
    const client = fakeClient();
    const brief: ReportBrief = {
      computedAt: new Date().toISOString(), lifeDomains: [], mahadashas: [], overallDirection: [],
    };
    const result = await generateNarrativeReport(brief, { client });
    expect(result.overview).toBeNull();
  });

  it('generates mahadasha text before antardasha text, and passes the parent text as antardasha context', async () => {
    const antar: AntardashaBrief = {
      lord: 'Venus', startMs: 0, endMs: 1, isCurrent: true, isPast: false,
      sourceTexts: ['Venus brings harmony.'], contributingRuleIds: ['r2'], parentLord: 'Jupiter',
    };
    const maha: MahadashaBrief = {
      lord: 'Jupiter', startMs: 0, endMs: 2, isCurrent: true, isPast: false,
      sourceTexts: ['Jupiter brings growth.'], contributingRuleIds: ['r1'], antardashas: [antar],
    };
    const brief: ReportBrief = {
      computedAt: new Date().toISOString(), lifeDomains: [], mahadashas: [maha], overallDirection: [],
    };

    const client = fakeClient();
    const result = await generateNarrativeReport(brief, { client });

    expect(result.mahadashas).toHaveLength(1);
    expect(result.mahadashas[0]!.lord).toBe('Jupiter');
    expect(result.antardashas).toHaveLength(1);
    expect(result.antardashas[0]!.parentLord).toBe('Jupiter');

    // The antardasha prompt should have been built AFTER the mahadasha's text existed,
    // so it should reference the generated mahadasha text as context.
    const antarCall = client.calls.find((c) => c.prompt.includes('Venus brings harmony.'));
    expect(antarCall).toBeDefined();
    expect(antarCall!.prompt).toContain('[generated for:');
  });

  it('skips a mahadasha/antardasha with no classical source texts', async () => {
    const emptyAntar: AntardashaBrief = {
      lord: 'Saturn', startMs: 0, endMs: 1, isCurrent: false, isPast: false,
      sourceTexts: [], contributingRuleIds: [], parentLord: 'Jupiter',
    };
    const maha: MahadashaBrief = {
      lord: 'Jupiter', startMs: 0, endMs: 2, isCurrent: true, isPast: false,
      sourceTexts: [], contributingRuleIds: [], antardashas: [emptyAntar],
    };
    const brief: ReportBrief = {
      computedAt: new Date().toISOString(), lifeDomains: [], mahadashas: [maha], overallDirection: [],
    };

    const client = fakeClient();
    const result = await generateNarrativeReport(brief, { client });
    expect(result.mahadashas).toHaveLength(0);
    expect(result.antardashas).toHaveLength(0);
  });

  it('passes the narrative system prompt on every call', async () => {
    const client = fakeClient();
    const brief: ReportBrief = {
      computedAt: new Date().toISOString(),
      lifeDomains: [domainWithData('Career')],
      mahadashas: [],
      overallDirection: [],
    };
    await generateNarrativeReport(brief, { client });
    expect(client.calls.length).toBeGreaterThan(0);
    for (const call of client.calls) {
      expect(call.system).toContain('Narrative Engine');
    }
  });
});
