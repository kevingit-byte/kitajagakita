import type { Tindakan, EventStatus } from "./types";
import type { SafetyLevel } from "./status/composite-score";

export type HumanLevel = "aman" | "waspada" | "siaga" | "bahaya";

export type HumanLevelPresentation = {
  level: HumanLevel;
  icon: string;
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotClass: string;
};

/**
 * One consistent 4-level severity language used everywhere in the UI -
 * badges, cards, region summaries, location status - so a color never
 * appears without an icon and a plain-language label next to it
 * (accessibility: never rely on color alone).
 */
export const HUMAN_LEVEL: Record<HumanLevel, HumanLevelPresentation> = {
  aman: {
    level: "aman",
    icon: "🟢",
    label: "Normal / Relatif Aman",
    shortLabel: "Aman",
    badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  waspada: {
    level: "waspada",
    icon: "🟡",
    label: "Waspada",
    shortLabel: "Waspada",
    badgeClass: "bg-yellow-950 text-yellow-300 border-yellow-800",
    dotClass: "bg-yellow-500",
  },
  siaga: {
    level: "siaga",
    icon: "🟠",
    label: "Siaga",
    shortLabel: "Siaga",
    badgeClass: "bg-orange-950 text-orange-300 border-orange-800",
    dotClass: "bg-orange-500",
  },
  bahaya: {
    level: "bahaya",
    icon: "🔴",
    label: "Perlu Perhatian",
    shortLabel: "Perlu Perhatian",
    badgeClass: "bg-red-950 text-red-300 border-red-800",
    dotClass: "bg-red-500",
  },
};

/** The composite location score's AMAN/WASPADA/SIAGA/BAHAYA maps directly. */
export function levelFromSafetyLevel(safetyLevel: SafetyLevel): HumanLevelPresentation {
  return HUMAN_LEVEL[safetyLevel.toLowerCase() as HumanLevel];
}

const HUMAN_LEVEL_BY_TINDAKAN: Record<Tindakan, HumanLevel> = {
  normal: "aman",
  waspada: "waspada",
  siaga: "siaga",
  awas: "bahaya",
};

/**
 * A single event's `tindakan` (normal/waspada/siaga/awas) collapses to the
 * same 4-level language for consistent card badges. selesai events always
 * read as calm/neutral regardless of what tindakan they were while active -
 * a resolved M7 earthquake shouldn't still look alarming on a card.
 */
export function levelFromTindakan(tindakan: Tindakan, status: EventStatus): HumanLevelPresentation {
  if (status === "selesai") return HUMAN_LEVEL.aman;
  return HUMAN_LEVEL[HUMAN_LEVEL_BY_TINDAKAN[tindakan]];
}
