const ROMAN_VALUES: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
};

/**
 * BMKG's `Dirasakan` field is free text like "II-III Kab. Manggarai" or
 * "IV Nagekeo, IV Maumere, IV Bajawa, IV Ende" - multiple MMI values
 * (sometimes ranges) across multiple locations. Returns the highest MMI
 * value mentioned, since that's what should influence severity.
 */
export function parseMaxMmi(dirasakan: string | null | undefined): number | null {
  if (!dirasakan) return null;

  const matches = dirasakan.match(/\bX{0,3}(IX|IV|V?I{0,3})\b/g);
  if (!matches) return null;

  const values = matches
    .map((m) => ROMAN_VALUES[m])
    .filter((v): v is number => typeof v === "number");

  return values.length > 0 ? Math.max(...values) : null;
}
