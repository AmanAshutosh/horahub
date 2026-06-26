/**
 * Convert a local wall-clock birth time in an IANA zone to a UTC instant,
 * honouring the daylight-saving rules in effect on that historical date
 * (the IANA database carries historical transitions, so this is correct for
 * past births, not just a fixed offset).
 */
export interface ResolvedInstant {
  utcMs: number;
  offsetMinutes: number;
  offsetLabel: string; // e.g. "+05:30"
}

function offsetMinutesAt(tz: string, utcMs: number): number | null {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    const parts: Record<string, string> = {};
    for (const p of dtf.formatToParts(new Date(utcMs))) parts[p.type] = p.value;
    const asUtc = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second),
    );
    return Math.round((asUtc - utcMs) / 60000);
  } catch {
    return null;
  }
}

export function localToUtc(
  year: number, month: number, day: number, hour: number, minute: number, tz: string,
): ResolvedInstant | null {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let offset = offsetMinutesAt(tz, guess);
  if (offset === null) return null;
  let utcMs = guess - offset * 60000;
  offset = offsetMinutesAt(tz, utcMs) ?? offset; // one refinement across DST edges
  utcMs = guess - offset * 60000;
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const label = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return { utcMs, offsetMinutes: offset, offsetLabel: label };
}
