import type { DisasterEvent, DisasterType, Tindakan } from "../types";
import { haversineDistanceKm } from "../geo";
import provinceCoordinates from "../data/province-coordinates.json";

type ProvinceCoordinate = { name: string; lat: number; lon: number };
const PROVINCES = provinceCoordinates as ProvinceCoordinate[];

const TINDAKAN_RANK: Record<Tindakan, number> = { normal: 0, waspada: 1, siaga: 2, awas: 3 };

export type ProvinceSummary = {
  province: string;
  lat: number;
  lon: number;
  totalEvents: number;
  activeEvents: number;
  /** Most urgent tindakan among this province's ACTIVE events; null when it has none. */
  mostUrgentActiveTindakan: Tindakan | null;
  countsByType: Partial<Record<DisasterType, number>>;
};

/**
 * No province boundary polygons are available (would need a separate
 * GeoJSON dataset), so events are assigned to their nearest province
 * centroid by straight-line distance - an approximation, not a true
 * point-in-polygon lookup. Fine for a coarse national overview; a border
 * event can attach to the "wrong" neighboring province.
 */
function nearestProvince(lat: number, lon: number): ProvinceCoordinate {
  return PROVINCES.reduce((closest, p) => {
    const d = haversineDistanceKm(lat, lon, p.lat, p.lon);
    const closestD = haversineDistanceKm(lat, lon, closest.lat, closest.lon);
    return d < closestD ? p : closest;
  }, PROVINCES[0]);
}

export function buildProvinceSummaries(events: DisasterEvent[]): ProvinceSummary[] {
  const byProvince = new Map<string, ProvinceSummary>();

  for (const province of PROVINCES) {
    byProvince.set(province.name, {
      province: province.name,
      lat: province.lat,
      lon: province.lon,
      totalEvents: 0,
      activeEvents: 0,
      mostUrgentActiveTindakan: null,
      countsByType: {},
    });
  }

  for (const event of events) {
    const nearest = nearestProvince(event.lat, event.lon);
    const summary = byProvince.get(nearest.name)!;

    summary.totalEvents += 1;
    summary.countsByType[event.type] = (summary.countsByType[event.type] ?? 0) + 1;

    if (event.status === "aktif") {
      summary.activeEvents += 1;
      if (
        summary.mostUrgentActiveTindakan === null ||
        TINDAKAN_RANK[event.tindakan] > TINDAKAN_RANK[summary.mostUrgentActiveTindakan]
      ) {
        summary.mostUrgentActiveTindakan = event.tindakan;
      }
    }
  }

  return Array.from(byProvince.values()).filter((s) => s.totalEvents > 0);
}

export function buildTypeCounts(events: DisasterEvent[]): Partial<Record<DisasterType, number>> {
  const counts: Partial<Record<DisasterType, number>> = {};
  for (const event of events) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
  }
  return counts;
}
