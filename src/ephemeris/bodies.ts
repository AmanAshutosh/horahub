import { atan2, cos, eccentricAnomaly, norm360, sin } from './math';

export interface SunResult {
  lon: number; // tropical geocentric ecliptic longitude
  meanLon: number; // Sun's mean longitude (for sidereal time)
  xs: number; // rectangular components, needed to geocentrify planets
  ys: number;
}

/** Geocentric ecliptic longitude of the Sun (Schlyter). */
export function sunPosition(d: number): SunResult {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = norm360(356.047 + 0.9856002585 * d);
  const E = eccentricAnomaly(M, e);
  const xv = cos(E) - e;
  const yv = Math.sqrt(1 - e * e) * sin(E);
  const v = atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lon = norm360(v + w);
  return { lon, meanLon: norm360(w + M), xs: r * cos(lon), ys: r * sin(lon) };
}

/** Geocentric ecliptic longitude of the Moon (Schlyter, with main perturbations). */
export function moonPosition(d: number, sunMeanLon: number): number {
  const N = 125.1228 - 0.0529538083 * d;
  const w = 318.0634 + 0.1643573223 * d;
  const M = norm360(115.3654 + 13.0649929509 * d);
  const e = 0.0549;
  const i = 5.1454;
  const E = eccentricAnomaly(M, e);
  const x = cos(E) - e;
  const y = Math.sqrt(1 - e * e) * sin(E);
  const v = atan2(y, x);
  const xe = cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(i);
  const ye = sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(i);
  let lon = atan2(ye, xe);
  const Ms = norm360(356.047 + 0.9856002585 * d);
  const Lm = norm360(N + w + M);
  const Dm = norm360(Lm - sunMeanLon);
  const F = norm360(Lm - N);
  lon +=
    -1.274 * sin(M - 2 * Dm) +
    0.658 * sin(2 * Dm) -
    0.186 * sin(Ms) -
    0.059 * sin(2 * M - 2 * Dm) -
    0.057 * sin(M - 2 * Dm + Ms) +
    0.053 * sin(M + 2 * Dm) +
    0.046 * sin(2 * Dm - Ms) +
    0.041 * sin(M - Ms) -
    0.035 * sin(Dm) -
    0.031 * sin(M + Ms) -
    0.015 * sin(2 * F - 2 * Dm) +
    0.011 * sin(M - 4 * Dm);
  return norm360(lon);
}

interface OrbitalElements {
  N: number;
  i: number;
  w: number;
  a: number;
  e: number;
  M: number;
}

type ClassicalPlanet = 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn';

const ELEMENTS: Record<ClassicalPlanet, (d: number) => OrbitalElements> = {
  Mercury: (d) => ({ N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.0e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: norm360(168.6562 + 4.0923344368 * d) }),
  Venus: (d) => ({ N: 76.6799 + 2.4659e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.891 + 1.38374e-5 * d, a: 0.72333, e: 0.006773 - 1.302e-9 * d, M: norm360(48.0052 + 1.6021302244 * d) }),
  Mars: (d) => ({ N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: norm360(18.6021 + 0.5240207766 * d) }),
  Jupiter: (d) => ({ N: 100.4542 + 2.76854e-5 * d, i: 1.303 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: norm360(19.895 + 0.0830853001 * d) }),
  Saturn: (d) => ({ N: 113.6634 + 2.3898e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: norm360(316.967 + 0.0334442282 * d) }),
};

/** Geocentric ecliptic longitude of a classical planet, with Jupiter/Saturn mutual perturbations. */
export function planetPosition(name: ClassicalPlanet, d: number, sun: SunResult): number {
  const o = ELEMENTS[name](d);
  const E = eccentricAnomaly(o.M, o.e);
  const xv = o.a * (cos(E) - o.e);
  const yv = o.a * Math.sqrt(1 - o.e * o.e) * sin(E);
  const v = atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const xh = r * (cos(o.N) * cos(v + o.w) - sin(o.N) * sin(v + o.w) * cos(o.i));
  const yh = r * (sin(o.N) * cos(v + o.w) + cos(o.N) * sin(v + o.w) * cos(o.i));
  let lon = norm360(atan2(yh + sun.ys, xh + sun.xs));
  const Mj = norm360(19.895 + 0.0830853001 * d);
  const Ms = norm360(316.967 + 0.0334442282 * d);
  if (name === 'Jupiter') {
    lon += -0.332 * sin(2 * Mj - 5 * Ms - 67.6) - 0.056 * sin(2 * Mj - 2 * Ms + 21) + 0.042 * sin(3 * Mj - 5 * Ms + 21) - 0.036 * sin(Mj - 2 * Ms) + 0.022 * cos(Mj - Ms) + 0.023 * sin(2 * Mj - 3 * Ms + 52) - 0.016 * sin(Mj - 5 * Ms - 69);
  } else if (name === 'Saturn') {
    lon += 0.812 * sin(2 * Mj - 5 * Ms - 67.6) - 0.229 * cos(2 * Mj - 4 * Ms - 2) + 0.119 * sin(Mj - 2 * Ms - 3) + 0.046 * sin(2 * Mj - 6 * Ms - 69) + 0.014 * sin(Mj - 3 * Ms + 32);
  }
  return norm360(lon);
}

/** Mean ascending lunar node (Rāhu), tropical. */
export function rahuPosition(d: number): number {
  return norm360(125.1228 - 0.0529538083 * d);
}
