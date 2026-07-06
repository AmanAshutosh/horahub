import 'server-only';
import { analyticEphemeris, type Ephemeris } from './chart';
import { env } from '@/config';
import { logger } from '@/lib/logger';

/**
 * Selects the active ephemeris from configuration. Analytic is the default and
 * needs no native module; set EPHEMERIS_PROVIDER=swiss for arc-second accuracy.
 *
 * `./swiss` pulls in the native `sweph` addon at import time, so it must only
 * be required when swiss mode is explicitly selected. A static top-level
 * import would load that native binding on every request regardless of the
 * configured provider, which crashes the whole route in any environment where
 * the prebuilt binary isn't available (e.g. a serverless runtime that didn't
 * bundle it) — even for deployments using the default analytic provider.
 */
function loadEphemeris(): Ephemeris {
  if (env.EPHEMERIS_PROVIDER !== 'swiss') return analyticEphemeris;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { swissEphemeris } = require('./swiss') as typeof import('./swiss');
    return swissEphemeris;
  } catch (err) {
    logger.error({ err }, 'Failed to load swiss ephemeris (native sweph module) — falling back to analytic');
    return analyticEphemeris;
  }
}

export const ephemeris: Ephemeris = loadEphemeris();
