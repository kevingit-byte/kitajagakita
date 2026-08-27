import type { EventStatus, Severity, SeverityLabel } from "../types";
import { clusterByDistanceAndTime } from "../geo";

export type QuakeInput = {
  id: string;
  magnitude: number;
  timeMs: number;
  lat: number;
  lon: number;
  depthKm: number;
  place: string;
  /** Highest MMI value from BMKG's Dirasakan field, if a matching BMKG record was found. */
  dirasakanMmi?: number | null;
};

export type QuakeSequence = {
  mainshock: QuakeInput;
  aftershocks: QuakeInput[];
  status: EventStatus;
  statusReason: string;
  severity: Severity;
  severityLabel: SeverityLabel;
  severityReason: string;
};

const SEQUENCE_EPSILON_KM = 100;
const SEQUENCE_MAX_DAYS_APART = 14;
const AFTERSHOCK_MIN_MAGNITUDE = 3.5;
const AKTIF_WINDOW_HOURS = 24;
const MEREDA_WINDOW_HOURS = 72;

const SEVERITY_LABEL_BY_LEVEL: Record<Severity, SeverityLabel> = {
  1: "Ringan",
  2: "Sedang",
  3: "Berat",
  4: "Sangat Berat",
  5: "Kritis",
};

function pickMainshock(cluster: QuakeInput[]): QuakeInput {
  return cluster.reduce((best, quake) => {
    if (quake.magnitude > best.magnitude) return quake;
    if (quake.magnitude === best.magnitude && quake.timeMs < best.timeMs) return quake;
    return best;
  }, cluster[0]);
}

function classifySequenceStatus(
  aftershocks: QuakeInput[],
  now: Date,
): { status: EventStatus; statusReason: string } {
  const qualifying = aftershocks.filter((a) => a.magnitude >= AFTERSHOCK_MIN_MAGNITUDE);
  if (qualifying.length === 0) {
    return {
      status: "selesai",
      statusReason: `Tidak ada gempa susulan berkekuatan ≥M${AFTERSHOCK_MIN_MAGNITUDE} sejak gempa utama.`,
    };
  }

  const latest = qualifying.reduce((a, b) => (a.timeMs > b.timeMs ? a : b));
  const ageHours = (now.getTime() - latest.timeMs) / (1000 * 60 * 60);

  if (ageHours <= AKTIF_WINDOW_HOURS) {
    return {
      status: "aktif",
      statusReason: `Gempa susulan M${latest.magnitude} terjadi ${ageHours.toFixed(1)} jam lalu (dalam ${AKTIF_WINDOW_HOURS} jam terakhir).`,
    };
  }

  if (ageHours <= MEREDA_WINDOW_HOURS) {
    return {
      status: "mereda",
      statusReason: `Gempa susulan terakhir (M${latest.magnitude}) terjadi ${ageHours.toFixed(0)} jam lalu (${AKTIF_WINDOW_HOURS}-${MEREDA_WINDOW_HOURS} jam).`,
    };
  }

  return {
    status: "selesai",
    statusReason: `Tidak ada gempa susulan ≥M${AFTERSHOCK_MIN_MAGNITUDE} dalam ${MEREDA_WINDOW_HOURS} jam terakhir (terakhir ${ageHours.toFixed(0)} jam lalu).`,
  };
}

function classifySeverity(mainshock: QuakeInput): { severity: Severity; reasonParts: string[] } {
  let level: number;
  if (mainshock.magnitude >= 7) level = 5;
  else if (mainshock.magnitude >= 6) level = 4;
  else if (mainshock.magnitude >= 5) level = 3;
  else if (mainshock.magnitude >= 4) level = 2;
  else level = 1;

  const reasonParts = [`magnitudo M${mainshock.magnitude}`];

  if (mainshock.depthKm < 70) {
    level += 1;
    reasonParts.push(`dangkal (${mainshock.depthKm} km, <70 km sehingga dirasakan lebih kuat di permukaan)`);
  } else {
    reasonParts.push(`kedalaman ${mainshock.depthKm} km (tidak dangkal, tidak ada penambahan tingkat)`);
  }

  if (mainshock.dirasakanMmi != null && mainshock.dirasakanMmi >= 5) {
    level += 1;
    reasonParts.push(`dirasakan hingga MMI ${mainshock.dirasakanMmi}`);
  }

  const severity = Math.min(5, Math.max(1, level)) as Severity;
  return { severity, reasonParts };
}

/**
 * Groups quakes into sequences (100km / 14 days, graph-chained - not just
 * distance-to-mainshock) and classifies each sequence's status/severity.
 * Validated against the real Ruteng/Manggarai aftershock sequence sample:
 * reproduces the expected 9-of-15 grouping with isolated events (Sangihe,
 * Maluku, Banten, Sulawesi Tengah, Sulut) correctly excluded.
 */
export function buildQuakeSequences(quakes: QuakeInput[], now: Date = new Date()): QuakeSequence[] {
  const clusters = clusterByDistanceAndTime(
    quakes,
    SEQUENCE_EPSILON_KM,
    SEQUENCE_MAX_DAYS_APART,
    (q) => ({ lat: q.lat, lon: q.lon }),
    (q) => q.timeMs,
  );

  return clusters.map((cluster) => {
    const mainshock = pickMainshock(cluster);
    const aftershocks = cluster.filter((q) => q.id !== mainshock.id);

    const { status, statusReason } = classifySequenceStatus(aftershocks, now);
    const { severity, reasonParts } = classifySeverity(mainshock);

    return {
      mainshock,
      aftershocks,
      status,
      statusReason,
      severity,
      severityLabel: SEVERITY_LABEL_BY_LEVEL[severity],
      severityReason: `Tingkat keparahan dari ${reasonParts.join(", ")}.`,
    };
  });
}
