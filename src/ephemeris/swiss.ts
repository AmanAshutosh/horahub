import 'server-only';
import swe from 'sweph';
import type { BirthInput, ChartFacts, PlanetName } from '@/types/chart';
import { assembleChartFacts, utcParts } from './assemble';
import type { Ephemeris } from './chart';
import { norm360 } from './math';
import { computeRetrograde, ONE_DAY_MS } from './retrograde';

const C = swe.constants;
const BASE_FLAG = C.SEFLG_MOSEPH | C.SEFLG_SIDEREAL; // Moshier model → no data files.

const SE_ID: Record<Exclude<PlanetName, 'Ketu'>, number> = {
  Sun: C.SE_SUN,
  Moon: C.SE_MOON,
  Mars: C.SE_MARS,
  Mercury: C.SE_MERCURY,
  Jupiter: C.SE_JUPITER,
  Venus: C.SE_VENUS,
  Saturn: C.SE_SATURN,
  Rahu: C.SE_MEAN_NODE,
};

let sidModeSet = false;
function ensureLahiri(): void {
  if (!sidModeSet) {
    swe.set_sid_mode(C.SE_SIDM_LAHIRI, 0, 0);
    sidModeSet = true;
  }
}

/**
 * Swiss Ephemeris adapter. Same ChartFacts contract as the analytic engine,
 * arc-second accuracy, canonical Lahiri ayanāṁśa. Uses the built-in Moshier
 * model, so no .se1 data files are required to deploy.
 */
export class SwissEphemeris implements Ephemeris {
  readonly id = 'swiss';

  private siderealAt(utcMs: number): { sidereal: Record<PlanetName, number>; jd: number } {
    ensureLahiri();
    const { Y, Mo, D, utHours } = utcParts(utcMs);
    const jd = swe.julday(Y, Mo, D, utHours, C.SE_GREG_CAL);

    const sidereal = {} as Record<PlanetName, number>;
    for (const name of Object.keys(SE_ID) as Array<keyof typeof SE_ID>) {
      const result = swe.calc_ut(jd, SE_ID[name], BASE_FLAG);
      if (result.error && result.error.length > 0 && result.data[0] === undefined) {
        throw new Error(`Swiss Ephemeris failed for ${name}: ${result.error}`);
      }
      sidereal[name] = norm360(result.data[0]);
    }
    sidereal.Ketu = norm360(sidereal.Rahu + 180);

    return { sidereal, jd };
  }

  compute(input: BirthInput): ChartFacts {
    const { sidereal, jd } = this.siderealAt(input.utcMs);

    const ayanamsa = swe.get_ayanamsa_ex_ut(jd, C.SEFLG_MOSEPH).data;
    const houses = swe.houses_ex(jd, C.SEFLG_SIDEREAL | C.SEFLG_MOSEPH, input.latitude, input.longitude, 'W');
    const ascLon = houses.data.points[0];

    const previousDay = this.siderealPositions(input.utcMs - ONE_DAY_MS);
    const retrograde = computeRetrograde(sidereal, previousDay);

    return assembleChartFacts(sidereal, ascLon, ayanamsa, input.utcMs, retrograde);
  }

  siderealPositions(utcMs: number): Record<PlanetName, number> {
    return this.siderealAt(utcMs).sidereal;
  }
}

export const swissEphemeris: Ephemeris = new SwissEphemeris();
