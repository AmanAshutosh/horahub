/**
 * Regression tests for the divisional-chart (varga) formulas.
 *
 * These lock in known-correct sign mappings from classical Parashari rules
 * so a future refactor can't silently mis-transcribe a formula — errors
 * here don't throw or type-error, they just produce confidently wrong data.
 */
import { describe, it, expect } from 'vitest';
import { vargaSignOf, buildAllDivisionalCharts } from '../varga';

const Ari = 0, Tau = 1, Gem = 2, Can = 3, Leo = 4, Vir = 5;
const Lib = 6, Sco = 7, Sag = 8, Cap = 9, Aqu = 10, Pis = 11;

describe('vargaSignOf', () => {
  it('D9 Navamsa follows the movable/fixed/dual starting-sign rule', () => {
    expect(vargaSignOf(9, 0 * 30 + 5)).toBe(Tau); // Aries (movable) -> starts at itself
    expect(vargaSignOf(9, 1 * 30 + 5)).toBe(Aqu); // Taurus (fixed) -> starts at 9th (Capricorn)
    expect(vargaSignOf(9, 2 * 30 + 5)).toBe(Sco); // Gemini (dual) -> starts at 5th (Libra)
  });

  it('D3 Drekkana steps by trine (5th/9th), not by consecutive sign', () => {
    expect(vargaSignOf(3, 0 * 30 + 5)).toBe(Ari);
    expect(vargaSignOf(3, 0 * 30 + 15)).toBe(Leo); // 5th from Aries
    expect(vargaSignOf(3, 0 * 30 + 25)).toBe(Sag); // 9th from Aries
  });

  it('D4 Chaturthamsa steps by kendra (4th/7th/10th)', () => {
    expect(vargaSignOf(4, 0 * 30 + 2)).toBe(Ari);
    expect(vargaSignOf(4, 0 * 30 + 10)).toBe(Can); // 4th from Aries
    expect(vargaSignOf(4, 0 * 30 + 18)).toBe(Lib); // 7th from Aries
    expect(vargaSignOf(4, 0 * 30 + 26)).toBe(Cap); // 10th from Aries
  });

  it('D2 Hora is binary (Cancer/Leo) and flips by odd/even sign parity', () => {
    expect(vargaSignOf(2, 0 * 30 + 5)).toBe(Leo);  // Aries (odd), first half -> Sun's hora
    expect(vargaSignOf(2, 0 * 30 + 20)).toBe(Can); // Aries (odd), second half -> Moon's hora
    expect(vargaSignOf(2, 1 * 30 + 5)).toBe(Can);  // Taurus (even), first half -> Moon's hora
    expect(vargaSignOf(2, 1 * 30 + 20)).toBe(Leo); // Taurus (even), second half -> Sun's hora
  });

  it('D7 Saptamsha starts even signs at the 7th sign from them', () => {
    expect(vargaSignOf(7, 0 * 30 + 2)).toBe(Ari);
    expect(vargaSignOf(7, 1 * 30 + 2)).toBe(Sco); // 7th from Taurus
  });

  it('D10 Dasamsha starts even signs at the 9th sign from them', () => {
    expect(vargaSignOf(10, 0 * 30 + 1)).toBe(Ari);
    expect(vargaSignOf(10, 1 * 30 + 1)).toBe(Cap); // 9th from Taurus
  });

  it('D12 Dwadashamsha always starts at the sign itself', () => {
    expect(vargaSignOf(12, 0 * 30 + 1)).toBe(Ari);
    expect(vargaSignOf(12, 0 * 30 + 29)).toBe(Pis); // 11th part from Aries
  });
});

describe('buildAllDivisionalCharts', () => {
  it('produces a full chart (lagna + 12 houses + all 9 planets) for every covered division', () => {
    const sidereal = {
      Sun: 10, Moon: 40, Mars: 70, Mercury: 100, Jupiter: 130,
      Venus: 160, Saturn: 190, Rahu: 220, Ketu: 40,
    };
    const charts = buildAllDivisionalCharts(sidereal, 5);
    expect(Object.keys(charts).sort()).toEqual(['D10', 'D12', 'D2', 'D3', 'D4', 'D7', 'D9']);
    for (const chart of Object.values(charts)) {
      expect(chart.houses).toHaveLength(12);
      expect(Object.keys(chart.planets)).toHaveLength(9);
      // Every occupant listed under a house must agree with that planet's own house field.
      for (const house of chart.houses) {
        for (const occupant of house.occupants) {
          expect(chart.planets[occupant].house).toBe(house.house);
        }
      }
    }
  });
});
