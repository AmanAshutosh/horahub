import { describe, it, expect } from 'vitest';
import { computeRetrograde } from '../retrograde';

describe('computeRetrograde', () => {
  it('flags a planet as retrograde when its longitude decreased', () => {
    const result = computeRetrograde({ Mars: 100 } as never, { Mars: 101 } as never);
    expect(result.Mars).toBe(true);
  });

  it('flags a planet as direct when its longitude increased', () => {
    const result = computeRetrograde({ Mars: 101 } as never, { Mars: 100 } as never);
    expect(result.Mars).toBe(false);
  });

  it('handles the 0/360 wraparound correctly in both directions', () => {
    // Direct motion crossing 360 -> 0
    expect(computeRetrograde({ Mars: 1 } as never, { Mars: 359 } as never).Mars).toBe(false);
    // Retrograde motion crossing 0 -> 360
    expect(computeRetrograde({ Mars: 359 } as never, { Mars: 1 } as never).Mars).toBe(true);
  });
});
