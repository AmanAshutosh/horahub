import { z } from 'zod';

export const generateChartSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm'),
  placeName: z.string().min(1).max(160),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  tzName: z.string().min(1).max(64),
});

export type GenerateChartDto = z.infer<typeof generateChartSchema>;
