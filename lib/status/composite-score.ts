import type { DisasterEvent } from "../types";
import { haversineDistanceKm } from "../geo";

export type SafetyLevel = "AMAN" | "WASPADA" | "SIAGA" | "BAHAYA";

export type ScoreFactor = {
  label: string;
  detail: string;
  points: number;
};

export type CompositeScoreResult = {
  level: SafetyLevel;
  totalPoints: number;
  factors: ScoreFactor[];
  nearestActiveEvent: DisasterEvent | null;
  nearestActiveDistanceKm: number | null;
  activeEventsWithin100km: number;
};

const NEARBY_RADIUS_KM = 100;

/**
 * Rules-based, not AI - every point is a documented threshold, and the
 * result always carries the full per-factor breakdown (never a bare
 * score), per the spec. Distance and severity of the nearest ACTIVE event
 * are weighted equally (0-5 each) since a very close, very severe event
 * should be able to reach BAHAYA on those two factors alone, without
 * needing AQI or event-count to also be bad - a scenario like "M7 aktif
 * earthquake 5km away, otherwise calm" must not average out to a lower
 * level just because nothing else nearby is wrong.
 */
function distancePoints(distanceKm: number | null): number {
  if (distanceKm === null) return 0;
  if (distanceKm < 5) return 5;
  if (distanceKm < 25) return 4;
  if (distanceKm < 50) return 3;
  if (distanceKm < 100) return 2;
  if (distanceKm < 300) return 1;
  return 0;
}

function aqiPoints(usAqi: number | null): number {
  if (usAqi === null) return 0;
  if (usAqi > 300) return 5;
  if (usAqi > 200) return 4;
  if (usAqi > 150) return 3;
  if (usAqi > 100) return 2;
  if (usAqi > 50) return 1;
  return 0;
}

function countPoints(count: number): number {
  if (count >= 5) return 2;
  if (count >= 2) return 1;
  return 0;
}

function levelFromTotal(total: number): SafetyLevel {
  if (total >= 10) return "BAHAYA";
  if (total >= 7) return "SIAGA";
  if (total >= 4) return "WASPADA";
  return "AMAN";
}

export function computeCompositeScore(
  location: { lat: number; lon: number },
  allEvents: DisasterEvent[],
  usAqi: number | null,
): CompositeScoreResult {
  const activeEvents = allEvents.filter((e) => e.status === "aktif");

  let nearestActiveEvent: DisasterEvent | null = null;
  let nearestActiveDistanceKm: number | null = null;
  for (const event of activeEvents) {
    const distance = haversineDistanceKm(location.lat, location.lon, event.lat, event.lon);
    if (nearestActiveDistanceKm === null || distance < nearestActiveDistanceKm) {
      nearestActiveDistanceKm = distance;
      nearestActiveEvent = event;
    }
  }

  const activeEventsWithin100km = activeEvents.filter(
    (e) => haversineDistanceKm(location.lat, location.lon, e.lat, e.lon) <= NEARBY_RADIUS_KM,
  ).length;

  const distPts = distancePoints(nearestActiveDistanceKm);
  const sevPts = nearestActiveEvent ? nearestActiveEvent.severity : 0;
  const aqiPts = aqiPoints(usAqi);
  const countPts = countPoints(activeEventsWithin100km);
  const totalPoints = distPts + sevPts + aqiPts + countPts;

  const factors: ScoreFactor[] = [
    {
      label: "Jarak ke kejadian aktif terdekat",
      detail: nearestActiveEvent
        ? `${nearestActiveEvent.title} berjarak ${nearestActiveDistanceKm!.toFixed(0)} km.`
        : "Tidak ada kejadian berstatus aktif yang ditemukan.",
      points: distPts,
    },
    {
      label: "Tingkat keparahan kejadian terdekat",
      detail: nearestActiveEvent
        ? `${nearestActiveEvent.severityLabel} (tingkat ${nearestActiveEvent.severity} dari 5).`
        : "Tidak berlaku - tidak ada kejadian aktif.",
      points: sevPts,
    },
    {
      label: "Kualitas udara (AQI)",
      detail: usAqi !== null ? `Indeks AQI saat ini: ${usAqi}.` : "Data kualitas udara tidak tersedia.",
      points: aqiPts,
    },
    {
      label: `Jumlah kejadian aktif dalam radius ${NEARBY_RADIUS_KM} km`,
      detail: `${activeEventsWithin100km} kejadian aktif ditemukan.`,
      points: countPts,
    },
  ];

  return {
    level: levelFromTotal(totalPoints),
    totalPoints,
    factors,
    nearestActiveEvent,
    nearestActiveDistanceKm,
    activeEventsWithin100km,
  };
}
