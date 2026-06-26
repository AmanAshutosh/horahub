import 'server-only';
import { analyticEphemeris, type Ephemeris } from './chart';
import { swissEphemeris } from './swiss';
import { env } from '@/config';

/**
 * Selects the active ephemeris from configuration. Analytic is the default and
 * needs no native module; set EPHEMERIS_PROVIDER=swiss for arc-second accuracy.
 */
export const ephemeris: Ephemeris = env.EPHEMERIS_PROVIDER === 'swiss' ? swissEphemeris : analyticEphemeris;
