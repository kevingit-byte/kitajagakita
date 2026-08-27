import volcanoCoordinates from "./volcano-coordinates.json";

type VolcanoCoordinate = { name: string; lat: number; lon: number };

const coordinates = volcanoCoordinates as VolcanoCoordinate[];

/**
 * Sourced from OpenStreetMap Overpass (natural=volcano nodes within
 * Indonesia), not MAGMA ESDM - MAGMA's alert-level table gives volcano
 * name + province but no coordinates. Names between the two sources
 * differ (e.g. "Gunung Merapi" vs "Merapi", "Lewotobi laki laki" vs
 * "Lewotobi Laki-laki"), so lookup is fuzzy-normalized rather than exact.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^gunung\s+api\s+/i, "")
    .replace(/^gunung\s+/i, "")
    .replace(/[-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const normalizedIndex = new Map<string, VolcanoCoordinate>();
for (const entry of coordinates) {
  normalizedIndex.set(normalizeName(entry.name), entry);
}

export function findVolcanoCoordinates(magmaName: string): { lat: number; lon: number } | null {
  const target = normalizeName(magmaName);

  const exact = normalizedIndex.get(target);
  if (exact) return { lat: exact.lat, lon: exact.lon };

  for (const [key, entry] of normalizedIndex) {
    if (key.includes(target) || target.includes(key)) {
      return { lat: entry.lat, lon: entry.lon };
    }
  }

  return null;
}
