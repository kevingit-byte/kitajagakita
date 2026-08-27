import type { EventStatus, Severity, SeverityLabel } from "../types";

const SEVERITY_LABEL_BY_LEVEL: Record<Severity, SeverityLabel> = {
  1: "Ringan",
  2: "Sedang",
  3: "Berat",
  4: "Sangat Berat",
  5: "Kritis",
};

const GDACS_ALERT_TO_SEVERITY: Record<string, Severity> = { Green: 2, Orange: 3, Red: 5 };

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
): { status: EventStatus; statusReason: string; severity: Severity; severityLabel: SeverityLabel } {
  const severity = GDACS_ALERT_TO_SEVERITY[alertLevel] ?? 2;
  const severityLabel = SEVERITY_LABEL_BY_LEVEL[severity];

  const isStale = new Date(toDate).getTime() < now.getTime() - 24 * 60 * 60 * 1000;
  if (isCurrent === "false" || isStale) {
    return {
      status: "selesai",
      statusReason: isCurrent === "false"
        ? "GDACS menandai episode ini sudah tidak berlangsung (iscurrent=false)."
        : "Tanggal akhir episode GDACS (todate) telah lewat lebih dari 24 jam.",
      severity,
      severityLabel,
    };
  }

  return {
    status: "aktif",
    statusReason: `GDACS menandai episode ini masih berlangsung dengan tingkat peringatan ${alertLevel}.`,
    severity,
    severityLabel,
  };
}

export function classifyReliefWebDisaster(
  status: string,
): { status: EventStatus; statusReason: string; severity: Severity; severityLabel: SeverityLabel } {
  const isPast = status === "past";
  const severity: Severity = isPast ? 2 : 3;

  return {
    status: isPast ? "selesai" : "aktif",
    statusReason: isPast
      ? "ReliefWeb menandai rekaman ini berstatus 'past' (sudah lampau)."
      : "ReliefWeb menandai rekaman ini masih berstatus aktif ('current' atau 'alert').",
    severity,
    severityLabel: SEVERITY_LABEL_BY_LEVEL[severity],
  };
}
