import type { EventStatus, Tindakan } from "../types";

/**
 * The spec calls for banjir/cuaca intensitas to come from BMKG's own
 * peringatan dini (early warning) levels (waspada/siaga/awas), but this app
 * has no working integration with that feed - BMKG's warning portal
 * (data.bmkg.go.id) could not even be reached to evaluate a format this
 * session (network egress to *.go.id domains was blocked in this sandbox).
 * GDACS's Green/Orange/Red alert level is used as a stand-in instead, and
 * labelled honestly as a proxy rather than misattributed to BMKG - a wrong
 * label on an official-sounding reading would be worse than an honest gap.
 */
const GDACS_ALERT_TO_TINDAKAN: Record<string, Tindakan> = { Green: "waspada", Orange: "siaga", Red: "awas" };

/**
 * GDACS reports `iscurrent` as the *string* "true"/"false", not a boolean -
 * confirmed against the real sample in docs/samples/gdacs.json. A naive
 * `=== false` check would silently never match.
 */
export function classifyGdacsEvent(
  alertLevel: "Green" | "Orange" | "Red",
  isCurrent: "true" | "false",
  toDate: string,
  now: Date = new Date(),
): { status: EventStatus; statusReason: string; intensitas: string; tindakan: Tindakan } {
  const tindakan = GDACS_ALERT_TO_TINDAKAN[alertLevel] ?? "waspada";
  const intensitas = `Tingkat peringatan ${alertLevel} (GDACS, proksi - peringatan resmi BMKG belum tersedia)`;

  const isStale = new Date(toDate).getTime() < now.getTime() - 24 * 60 * 60 * 1000;
  if (isCurrent === "false" || isStale) {
    return {
      status: "selesai",
      statusReason: isCurrent === "false"
        ? "GDACS menandai episode ini sudah tidak berlangsung (iscurrent=false)."
        : "Tanggal akhir episode GDACS (todate) telah lewat lebih dari 24 jam.",
      intensitas,
      tindakan,
    };
  }

  return {
    status: "aktif",
    statusReason: `GDACS menandai episode ini masih berlangsung dengan tingkat peringatan ${alertLevel}.`,
    intensitas,
    tindakan,
  };
}

export function classifyReliefWebDisaster(
  status: string,
): { status: EventStatus; statusReason: string; intensitas: string; tindakan: Tindakan } {
  const isPast = status === "past";

  return {
    status: isPast ? "selesai" : "aktif",
    statusReason: isPast
      ? "ReliefWeb menandai rekaman ini berstatus 'past' (sudah lampau)."
      : "ReliefWeb menandai rekaman ini masih berstatus aktif ('current' atau 'alert').",
    intensitas: `Status ReliefWeb: ${status} (proksi - ReliefWeb tidak menerbitkan skala peringatan resmi)`,
    tindakan: isPast ? "normal" : "waspada",
  };
}
