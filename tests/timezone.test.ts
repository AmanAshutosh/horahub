import { describe, expect, it } from 'vitest';
import { localToUtc } from '@/lib/timezone';

describe('localToUtc', () => {
  it('applies the fixed +05:30 offset for India', () => {
    const r = localToUtc(1998, 8, 15, 14, 30, 'Asia/Kolkata');
    expect(r).not.toBeNull();
    expect(r!.offsetLabel).toBe('+05:30');
    expect(new Date(r!.utcMs).getUTCHours()).toBe(9);
  });

  it('honours historical daylight saving in New York', () => {
    const summer = localToUtc(1990, 7, 1, 12, 0, 'America/New_York'); // EDT -04:00
    const winter = localToUtc(1990, 1, 1, 12, 0, 'America/New_York'); // EST -05:00
    expect(summer!.offsetLabel).toBe('-04:00');
    expect(winter!.offsetLabel).toBe('-05:00');
  });

  it('returns null for an unknown timezone', () => {
    expect(localToUtc(2000, 1, 1, 0, 0, 'Not/AZone')).toBeNull();
  });
});
