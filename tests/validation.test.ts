import { describe, expect, it } from 'vitest';
import { generateChartSchema } from '@/server/validators/chart.validator';

describe('generateChartSchema', () => {
  const valid = {
    fullName: 'Test', gender: 'MALE', birthDate: '1998-08-15', birthTime: '14:30',
    placeName: 'Noida', latitude: 28.5355, longitude: 77.391, tzName: 'Asia/Kolkata',
  };

  it('accepts a well-formed payload', () => {
    expect(generateChartSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed date', () => {
    expect(generateChartSchema.safeParse({ ...valid, birthDate: '15-08-1998' }).success).toBe(false);
  });

  it('rejects an out-of-range latitude', () => {
    expect(generateChartSchema.safeParse({ ...valid, latitude: 120 }).success).toBe(false);
  });
});
