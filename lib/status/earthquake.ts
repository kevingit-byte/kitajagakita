import type { EventStatus } from "../types";
import { clusterByDistanceAndTime } from "../geo";

export type QuakeInput = {
  id: string;
  magnitude: number;
  timeMs: number;
  lat: number;
  lon: number;
  depthKm: number;
  place: string;
  /** Raw BMKG `Dirasakan` text, if a matching BMKG record was found - converted to SIG-BMKG per-region elsewhere (lib/status/mmi.ts), not here. */
  dirasakan?: string | null;
};

export type QuakeSequence = {
  mainshock: QuakeInput;
  aftershocks: QuakeInput[];
  status: EventStatus;
  statusReason: string;
};

const SEQUENCE_EPSILON_KM = 100;
const SEQUENCE_MAX_DAYS_APART = 14;
const AFTERSHOCK_MIN_MAGNITUDE = 3.5;
const AKTIF_WINDOW_HOURS = 24;
const MEREDA_WINDOW_HOURS = 72;

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

/**
 * Groups quakes into sequences (100km / 14 days, graph-chained - not just
 * distance-to-mainshock) and classifies each sequence's status (whether
 * aftershocks are still ongoing). Validated against the real Ruteng/
 * Manggarai aftershock sequence sample:
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

    return { mainshock, aftershocks, status, statusReason };
  });
}
