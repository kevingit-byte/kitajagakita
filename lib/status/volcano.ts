import type { EventStatus, Tindakan } from "../types";

export type VolcanoLevel = "I" | "II" | "III" | "IV";

export const VOLCANO_LEVEL_LABEL: Record<VolcanoLevel, string> = {
  I: "Level I (Normal)",
  II: "Level II (Waspada)",
  III: "Level III (Siaga)",
  IV: "Level IV (Awas)",
};

/**
 * PVMBG's own level names ARE normal/waspada/siaga/awas - a direct,
 * official 1:1 mapping onto `tindakan`, not an inference like the other
 * hazard types need.
 */
const TINDAKAN_BY_LEVEL: Record<VolcanoLevel, Tindakan> = {
  I: "normal",
  II: "waspada",
  III: "siaga",
  IV: "awas",
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
  intensitas: string;
  tindakan: Tindakan;
} {
  const intensitas = `${VOLCANO_LEVEL_LABEL[level]} (PVMBG)`;
  const tindakan = TINDAKAN_BY_LEVEL[level];

  if (level === "III" || level === "IV") {
    return {
      status: "aktif",
      statusReason: `Berada pada ${VOLCANO_LEVEL_LABEL[level]} menurut MAGMA ESDM/PVMBG.`,
      intensitas,
      tindakan,
    };
  }

  if (level === "I") {
    return {
      status: "selesai",
      statusReason: `Berada pada ${VOLCANO_LEVEL_LABEL[level]} tanpa indikasi peningkatan aktivitas.`,
      intensitas,
      tindakan,
    };
  }

  return {
    status: "tidak-diketahui",
    statusReason: `Berada pada ${VOLCANO_LEVEL_LABEL[level]} - status aktif/mereda tidak dapat dipastikan tanpa riwayat perubahan level (aplikasi ini tidak menyimpan data historis).`,
    intensitas,
    tindakan,
  };
}
