import type { EventStatus, Severity, SeverityLabel } from "../types";

export type VolcanoLevel = "I" | "II" | "III" | "IV";

export const VOLCANO_LEVEL_LABEL: Record<VolcanoLevel, string> = {
  I: "Level I (Normal)",
  II: "Level II (Waspada)",
  III: "Level III (Siaga)",
  IV: "Level IV (Awas)",
};

const SEVERITY_BY_LEVEL: Record<VolcanoLevel, Severity> = { I: 1, II: 2, III: 4, IV: 5 };
const SEVERITY_LABEL_BY_LEVEL: Record<Severity, SeverityLabel> = {
  1: "Ringan",
  2: "Sedang",
  3: "Berat",
  4: "Sangat Berat",
  5: "Kritis",
};

/**
 * The spec's full rule set for volcanoes includes "mereda: level lowered
 * within the last 30 days" - but this project has no database (by design)
 * and MAGMA ESDM's page is a current snapshot with no history endpoint, so
 * a level-change-within-30-days fact genuinely cannot be computed. Rather
 * than fake it, Level II (Waspada) - which could be either rising toward
 * Siaga or settling down from it - is honestly reported as
 * tidak-diketahui. Only Level III/IV (aktif) and Level I (selesai) are
 * rules this data can actually support.
 */
export function classifyVolcanoStatus(level: VolcanoLevel): {
  status: EventStatus;
  statusReason: string;
  severity: Severity;
  severityLabel: SeverityLabel;
} {
  const severity = SEVERITY_BY_LEVEL[level];
  const severityLabel = SEVERITY_LABEL_BY_LEVEL[severity];

  if (level === "III" || level === "IV") {
    return {
      status: "aktif",
      statusReason: `Berada pada ${VOLCANO_LEVEL_LABEL[level]} menurut MAGMA ESDM/PVMBG.`,
      severity,
      severityLabel,
    };
  }

  if (level === "I") {
    return {
      status: "selesai",
      statusReason: `Berada pada ${VOLCANO_LEVEL_LABEL[level]} tanpa indikasi peningkatan aktivitas.`,
      severity,
      severityLabel,
    };
  }

  return {
    status: "tidak-diketahui",
    statusReason: `Berada pada ${VOLCANO_LEVEL_LABEL[level]} - status aktif/mereda tidak dapat dipastikan tanpa riwayat perubahan level (aplikasi ini tidak menyimpan data historis).`,
    severity,
    severityLabel,
  };
}
