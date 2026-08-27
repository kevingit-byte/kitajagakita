import type { DisasterEvent, EventStatus, Tindakan } from "../types";
import type { FirmsHotspot } from "../sources/firms";
import { haversineDistanceKm } from "../geo";
import { isInPeatProneProvince } from "../data/peat-prone-provinces";
import { classifyAqi } from "../labels";

export type WildfireCluster = {
  id: string;
  centerLat: number;
  centerLon: number;
  pointCount: number;
  totalFrp: number;
  /** Detection count per acq_date (YYYY-MM-DD), e.g. { "2026-08-26": 12 }. */
  countsByDate: Record<string, number>;
  latestAcqDate: string;
  points: FirmsHotspot[];
};

/**
 * Shown in the UI wherever wildfire status/severity is displayed - a
 * hotspot is a satellite heat signature, not confirmed fire on the ground.
 */
export const WILDFIRE_CAVEAT =
  "Titik panas adalah deteksi suhu tinggi dari satelit, belum tentu kebakaran. Perlu verifikasi lapangan. Lintasan satelit memiliki celah waktu dan tutupan awan dapat menyebabkan pembacaan 'padam' yang keliru.";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function classifyStatus(
  cluster: WildfireCluster,
  now: Date,
): { status: EventStatus; statusReason: string } {
  const today = isoDate(now);
  const yesterday = isoDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const dayBeforeYesterday = isoDate(new Date(now.getTime() - 48 * 60 * 60 * 1000));

  const todayCount = cluster.countsByDate[today] ?? 0;
  const yesterdayCount = cluster.countsByDate[yesterday] ?? 0;
  const dayBeforeCount = cluster.countsByDate[dayBeforeYesterday] ?? 0;

  if (todayCount === 0 && (yesterdayCount > 0 || dayBeforeCount > 0)) {
    return {
      status: "selesai",
      statusReason: `Tidak ada deteksi titik panas baru hari ini, meski ada deteksi dalam 48 jam sebelumnya (kemarin: ${yesterdayCount}, kemarin lusa: ${dayBeforeCount}).`,
    };
  }

  if (todayCount === 0 && yesterdayCount === 0 && dayBeforeCount === 0) {
    return {
      status: "tidak-diketahui",
      statusReason: "Tidak ada deteksi dalam jendela data 3 hari untuk klaster ini - status tidak dapat ditentukan.",
    };
  }

  if (todayCount > yesterdayCount) {
    return {
      status: "aktif",
      statusReason: `Deteksi hari ini (${todayCount}) lebih banyak dari kemarin (${yesterdayCount}) - kebakaran meluas.`,
    };
  }

  if (todayCount < yesterdayCount / 2) {
    return {
      status: "mereda",
      statusReason: `Deteksi hari ini (${todayCount}) kurang dari separuh kemarin (${yesterdayCount}).`,
    };
  }

  return {
    status: "aktif",
    statusReason: `Deteksi hari ini (${todayCount}) relatif stabil dibanding kemarin (${yesterdayCount}).`,
  };
}

/** Sum of FRP (fire radiative power, MW) for points detected on a given acq_date. */
function frpOnDate(cluster: WildfireCluster, date: string): number {
  return cluster.points.filter((p) => p.acqDate === date).reduce((sum, p) => sum + p.frp, 0);
}

/**
 * Max distance from the cluster centroid to any of its points - a cheap
 * (O(n), not O(n²) pairwise) proxy for how spread out the cluster is.
 * Point count alone doesn't distinguish a small, dense, intense burn from
 * a large, sparse complex - this does.
 */
function spreadRadiusKm(cluster: WildfireCluster): number {
  let maxDistance = 0;
  for (const point of cluster.points) {
    const distance = haversineDistanceKm(cluster.centerLat, cluster.centerLon, point.lat, point.lon);
    if (distance > maxDistance) maxDistance = distance;
  }
  return maxDistance;
}

/**
 * Combines total cluster FRP, geographic spread, the 3-day FRP trend, and
 * whether the cluster sits in a peat-prone province into a 0-4 `tindakan`
 * urgency level - point count is not used at all (per instruction: it must
 * not be the main factor, and every other factor here already correlates
 * with detection density without inheriting its bias toward simply "more
 * satellite passes over the same spot" rather than "worse fire").
 */
function classifyTindakan(cluster: WildfireCluster, now: Date): { tindakan: Tindakan; tindakanReason: string } {
  const reasonParts: string[] = [];
  let points = 0;

  // FRP (fire radiative power, MW) - direct measure of burn intensity.
  if (cluster.totalFrp >= 500) points += 4;
  else if (cluster.totalFrp >= 200) points += 3;
  else if (cluster.totalFrp >= 50) points += 2;
  else if (cluster.totalFrp >= 10) points += 1;
  reasonParts.push(`total FRP klaster ${cluster.totalFrp.toFixed(1)} MW`);

  // Spread - a wide cluster is a fire complex, not one small burn.
  const radiusKm = spreadRadiusKm(cluster);
  if (radiusKm >= 10) points += 3;
  else if (radiusKm >= 5) points += 2;
  else if (radiusKm >= 2) points += 1;
  reasonParts.push(`sebaran klaster radius ${radiusKm.toFixed(1)} km`);

  // 3-day FRP trend - is intensity escalating, not just detection count.
  const today = isoDate(now);
  const dayBeforeYesterday = isoDate(new Date(now.getTime() - 48 * 60 * 60 * 1000));
  const todayFrp = frpOnDate(cluster, today);
  const earlierFrp = frpOnDate(cluster, dayBeforeYesterday);
  let trendLabel: string;
  if (earlierFrp > 0 && todayFrp > earlierFrp * 2) {
    points += 3;
    trendLabel = "meningkat tajam";
  } else if (todayFrp > earlierFrp) {
    points += 2;
    trendLabel = "meningkat";
  } else if (todayFrp >= earlierFrp * 0.5) {
    points += 1;
    trendLabel = "relatif stabil";
  } else {
    trendLabel = "menurun";
  }
  reasonParts.push(`tren FRP 3 hari: ${trendLabel}`);

  // Peatland - fires on peat burn deeper, spread underground, and produce
  // far more smoke/haze than the same-size fire on mineral soil.
  const peatProvince = isInPeatProneProvince(cluster.centerLat, cluster.centerLon);
  if (peatProvince) {
    points += 3;
    reasonParts.push(`berada di provinsi rawan lahan gambut (${peatProvince.name})`);
  }

  let tindakan: Tindakan;
  if (points >= 9) tindakan = "awas";
  else if (points >= 6) tindakan = "siaga";
  else if (points >= 3) tindakan = "waspada";
  else tindakan = "normal";

  return {
    tindakan,
    tindakanReason: `Berdasarkan ${reasonParts.join(", ")}.`,
  };
}

/**
 * The spec calls for karhutla intensitas to be an ISPU (Indonesia's own air
 * quality standard) category from the nearest air-quality reading - not
 * hotspot count. This app could not verify ISPU's official breakpoint
 * table this session (KLHK's ISPU portal and Permen LHK 14/2020's text are
 * both on domains this sandbox's network egress blocked outright), so
 * rather than guess concentration breakpoints and mislabel them as the
 * official Indonesian standard, this uses the already-implemented US EPA
 * AQI (via Open-Meteo, see lib/labels.ts classifyAqi) and labels it
 * honestly as AQI, not ISPU. Worth swapping for real ISPU once a reachable
 * source for its breakpoints is confirmed.
 */
function intensitasFromAirQuality(usAqi: number | null): string | null {
  if (usAqi === null) return null;
  const category = classifyAqi(usAqi);
  return `AQI ${usAqi} - ${category.label} (AS/EPA via Open-Meteo, proksi - ISPU resmi KLHK belum tersedia)`;
}

export function classifyWildfireCluster(
  cluster: WildfireCluster,
  now: Date = new Date(),
  nearestUsAqi: number | null = null,
): {
  status: EventStatus;
  statusReason: string;
  tindakan: Tindakan;
  tindakanReason: string;
  intensitas: string | null;
} {
  const { status, statusReason } = classifyStatus(cluster, now);
  const { tindakan, tindakanReason } = classifyTindakan(cluster, now);
  const intensitas = intensitasFromAirQuality(nearestUsAqi);
  return { status, statusReason, tindakan, tindakanReason, intensitas };
}

export function wildfireClusterToEvent(
  cluster: WildfireCluster,
  now: Date = new Date(),
  nearestUsAqi: number | null = null,
): DisasterEvent {
  const { status, statusReason, tindakan, intensitas } = classifyWildfireCluster(cluster, now, nearestUsAqi);

  return {
    id: cluster.id,
    type: "karhutla",
    title: `Titik Panas (${cluster.pointCount} deteksi) di ${cluster.centerLat.toFixed(2)}, ${cluster.centerLon.toFixed(2)}`,
    lat: cluster.centerLat,
    lon: cluster.centerLon,
    province: null,
    occurredAt: `${cluster.latestAcqDate}T00:00:00Z`,
    lastUpdatedAt: now.toISOString(),
    intensitas,
    tindakan,
    status,
    statusReason: `${statusReason} ${WILDFIRE_CAVEAT}`,
    raw: { pointCount: cluster.pointCount, totalFrp: cluster.totalFrp, points: cluster.points.length },
    sourceName: "NASA FIRMS",
    sourceUrl: "https://firms.modaps.eosdis.nasa.gov/",
  };
}
