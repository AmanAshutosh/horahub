import { z } from 'zod';

export const geocodeSchema = z.object({
  q: z.string().min(2, 'Type at least two characters').max(80),
});

export type GeocodeDto = z.infer<typeof geocodeSchema>;
