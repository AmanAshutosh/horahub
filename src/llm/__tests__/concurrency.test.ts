import { describe, it, expect } from 'vitest';
import { mapWithConcurrency } from '../concurrency';

describe('mapWithConcurrency', () => {
  it('preserves result order regardless of completion order', async () => {
    const delays = [30, 10, 20, 5];
    const results = await mapWithConcurrency(delays, 4, (ms) => new Promise((r) => setTimeout(() => r(ms), ms)));
    expect(results).toEqual(delays);
  });

  it('never runs more than `limit` items concurrently', async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);
    await mapWithConcurrency(items, 3, async (i) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      return i;
    });
    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it('processes every item exactly once', async () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const seen: number[] = [];
    await mapWithConcurrency(items, 4, async (i) => {
      seen.push(i);
      return i;
    });
    expect(seen.sort((a, b) => a - b)).toEqual(items);
  });

  it('handles an empty input array', async () => {
    const results = await mapWithConcurrency([], 5, async (i) => i);
    expect(results).toEqual([]);
  });

  it('propagates a rejection from any worker', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (i) => {
        if (i === 2) throw new Error('boom');
        return i;
      }),
    ).rejects.toThrow('boom');
  });
});
