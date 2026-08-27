import type { DisasterType } from "../types";

/**
 * Strips BMKG's distance+direction prefix from a Wilayah string, leaving
 * just the place name. Verified against every real Wilayah string across
 * all three BMKG endpoints (docs/samples/) - formats genuinely differ
 * ("Pusat gempa berada di laut 51 km timur laut Ruteng-Manggarai" vs
 * "41 km TimurLaut MBAY-NAGEKEO-NTT", spaced vs concatenated direction
 * words, mixed casing), which is why this is a real function with real
 * tests rather than a one-off inline regex.
 */
export function extractPlaceName(wilayah: string): string {
  let s = wilayah.trim();
  s = s.replace(/^Pusat gempa berada di (laut|darat),?\s*/i, "");
  s = s.replace(/^\d+(\.\d+)?\s*km,?\s*/i, "");

  const directions = ["Timur\\s*Laut", "Barat\\s*Daya", "Barat\\s*Laut", "Tenggara", "Selatan", "Utara", "Timur", "Barat"];
  const dirPattern = new RegExp(`^(${directions.join("|")})\\s*`, "i");
  s = s.replace(dirPattern, "");

  return s.replace(/^[,\s]+|[,\s]+$/g, "");
}

/** Indonesian search keyword per hazard type, matching the spec's query examples. */
const TYPE_KEYWORD: Record<DisasterType, string> = {
  gempa: "gempa",
  karhutla: "karhutla",
  gunungapi: "erupsi",
  banjir: "banjir",
  longsor: "longsor",
  cuaca: "cuaca ekstrem",
  lainnya: "bencana",
};

export type NewsQueryInput = {
  type: DisasterType;
  /** BMKG's raw Wilayah string, when available (gempa). */
  wilayah?: string | null;
  /** The volcano's own name (gunungapi) - more specific than a type+place query. */
  volcanoName?: string | null;
  /** Province/region name, when the source provides one directly. */
  province?: string | null;
  /** Reverse-geocoded place name, resolved separately when nothing else is available. */
  geocodedPlace?: string | null;
};

/**
 * Builds a query like the spec's examples ("karhutla+Ketapang",
 * "gempa+Sumbawa") from whatever place information the event carries.
 * Returns null when no place information exists at all (search is skipped
 * rather than sent as a place-less, near-useless query).
 */
export function buildNewsQuery(input: NewsQueryInput): string | null {
  if (input.type === "gunungapi" && input.volcanoName) {
    return input.volcanoName;
  }

  const place = (input.wilayah && extractPlaceName(input.wilayah)) || input.province || input.geocodedPlace || null;
  if (!place) return null;

  return `${TYPE_KEYWORD[input.type]} ${place}`;
}
