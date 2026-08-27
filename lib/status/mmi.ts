import type { RegionIntensity } from "../types";

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
 * "IV Nagekeo, IV Maumere, IV Bajawa, IV Ende" - one MMI value or range per
 * region, comma-separated across regions. Splits that into per-region
 * entries: { wilayah, maxMmi }. A region reporting a range (e.g. "III-IV")
 * uses the range's upper bound, matching how BMKG's own SIG conversion
 * treats a range - the worst felt intensity reported in that area.
 */
function parseRegionMmi(dirasakan: string): { wilayah: string; maxMmi: number }[] {
  const segments = dirasakan.split(",").map((s) => s.trim()).filter(Boolean);
  const results: { wilayah: string; maxMmi: number }[] = [];

  for (const segment of segments) {
    const match = segment.match(/^([IVX]+)(?:-([IVX]+))?\s+(.+)$/);
    if (!match) continue;
    const [, lowRoman, highRoman, wilayah] = match;
    const low = ROMAN_VALUES[lowRoman];
    const high = highRoman ? ROMAN_VALUES[highRoman] : undefined;
    if (low === undefined) continue;
    const maxMmi = high !== undefined ? Math.max(low, high) : low;
    results.push({ wilayah, maxMmi });
  }

  return results;
}

/**
 * SIG-BMKG (Skala Intensitas Gempabumi) I-V, the scale BMKG adopted in 2016
 * to replace raw MMI (I-XII) for public communication - simpler, and tuned
 * to Indonesian building/cultural context. Source:
 * https://www.bmkg.go.id/gempabumi/skala-intensitas-gempabumi.bmkg
 *
 * MMI->SIG bands and the official color convention (I putih/white is
 * "not felt", so it never actually appears in a `Dirasakan` report - that
 * field only exists when something WAS felt):
 *   SIG I   MMI I-II     putih/white   - tidak dirasakan, hanya tercatat alat
 *   SIG II  MMI III-IV   hijau/green   - dirasakan banyak orang, tanpa kerusakan
 *   SIG III MMI V-VI     kuning/yellow - kerusakan ringan pada bangunan tanpa struktur kuat
 *   SIG IV  MMI VII-VIII jingga/orange - kerusakan sedang-berat, retak dinding, sebagian roboh
 *   SIG V   MMI IX-XII   merah/red     - kerusakan berat
 */
export const SIG_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "SIG I",
  2: "SIG II",
  3: "SIG III",
  4: "SIG IV",
  5: "SIG V",
};

export const SIG_COLOR: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "#e5e5e5",
  2: "#22c55e",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
};

export function sigFromMmi(mmi: number): 1 | 2 | 3 | 4 | 5 {
  if (mmi <= 2) return 1;
  if (mmi <= 4) return 2;
  if (mmi <= 6) return 3;
  if (mmi <= 8) return 4;
  return 5;
}

/**
 * Converts BMKG's `Dirasakan` field into per-region SIG-BMKG readings.
 * Returns null (never an estimated/guessed value) when `Dirasakan` is
 * empty - many offshore quakes have nobody to report feeling them, and the
 * UI must show "Belum ada laporan dirasakan", not a magnitude-based guess.
 */
export function parseRegionSig(dirasakan: string | null | undefined): RegionIntensity[] | null {
  if (!dirasakan) return null;
  const regions = parseRegionMmi(dirasakan);
  if (regions.length === 0) return null;

  return regions.map(({ wilayah, maxMmi }) => {
    const sig = sigFromMmi(maxMmi);
    return { wilayah, sig, sigLabel: SIG_LABEL[sig] };
  });
}
