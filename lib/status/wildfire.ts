import type { DisasterEvent, EventStatus, Severity, SeverityLabel } from "../types";
import type { FirmsHotspot } from "../sources/firms";

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
  "Titik panas adalah sinyal panas yang terdeteksi satelit, bukan konfirmasi kebakaran di lapangan. Lintasan satelit memiliki celah waktu dan tutupan awan dapat menyebabkan pembacaan 'padam' yang keliru.";

const SEVERITY_LABEL_BY_LEVEL: Record<Severity, SeverityLabel> = {
  1: "Ringan",
  2: "Sedang",
  3: "Berat",
  4: "Sangat Berat",
  5: "Kritis",
};

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

function classifySeverity(cluster: WildfireCluster): { severity: Severity; severityReason: string } {
  const score = cluster.pointCount + cluster.totalFrp / 20;
  let severity: Severity;
  if (score >= 100) severity = 5;
  else if (score >= 50) severity = 4;
  else if (score >= 20) severity = 3;
  else if (score >= 8) severity = 2;
  else severity = 1;

  return {
    severity,
    severityReason: `Berdasarkan ${cluster.pointCount} titik deteksi dan total daya radiatif api (FRP) ${cluster.totalFrp.toFixed(1)} MW.`,
  };
}

export function classifyWildfireCluster(
  cluster: WildfireCluster,
  now: Date = new Date(),
): {
  status: EventStatus;
  statusReason: string;
  severity: Severity;
  severityLabel: SeverityLabel;
  severityReason: string;
} {
  const { status, statusReason } = classifyStatus(cluster, now);
  const { severity, severityReason } = classifySeverity(cluster);
  return { status, statusReason, severity, severityLabel: SEVERITY_LABEL_BY_LEVEL[severity], severityReason };
}

export function wildfireClusterToEvent(cluster: WildfireCluster, now: Date = new Date()): DisasterEvent {
  const { status, statusReason, severity, severityLabel } = classifyWildfireCluster(cluster, now);

  return {
    id: cluster.id,
    type: "karhutla",
    title: `Titik Panas (${cluster.pointCount} deteksi) di ${cluster.centerLat.toFixed(2)}, ${cluster.centerLon.toFixed(2)}`,
    lat: cluster.centerLat,
    lon: cluster.centerLon,
    province: null,
    occurredAt: `${cluster.latestAcqDate}T00:00:00Z`,
    lastUpdatedAt: now.toISOString(),
    severity,
    severityLabel,
    status,
    statusReason: `${statusReason} ${WILDFIRE_CAVEAT}`,
    raw: { pointCount: cluster.pointCount, totalFrp: cluster.totalFrp, points: cluster.points.length },
    sourceName: "NASA FIRMS",
    sourceUrl: "https://firms.modaps.eosdis.nasa.gov/",
  };
}
