// Angle helpers. All trig works in degrees throughout the engine.
export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;

export const norm360 = (x: number): number => ((x % 360) + 360) % 360;
export const sin = (deg: number): number => Math.sin(deg * D2R);
export const cos = (deg: number): number => Math.cos(deg * D2R);
export const tan = (deg: number): number => Math.tan(deg * D2R);
export const atan2 = (y: number, x: number): number => Math.atan2(y, x) * R2D;

/** Day number from Paul Schlyter's epoch (1999-12-31 00:00 UT). */
export function dayNumber(year: number, month: number, day: number, utHours: number): number {
  return (
    367 * year -
    Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) +
    Math.floor((275 * month) / 9) +
    day -
    730530 +
    utHours / 24
  );
}

/** Solve Kepler's equation; M and result in degrees. */
export function eccentricAnomaly(meanAnomalyDeg: number, e: number): number {
  let E = meanAnomalyDeg + R2D * e * sin(meanAnomalyDeg) * (1 + e * cos(meanAnomalyDeg));
  for (let i = 0; i < 5; i += 1) {
    E = E - (E - R2D * e * sin(E) - meanAnomalyDeg) / (1 - e * cos(E));
  }
  return E;
}
